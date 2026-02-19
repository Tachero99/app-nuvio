// routes/product.routes.js - CON SEGURIDAD MEJORADA
import { Router } from "express";
import {
  createProduct,
  listProducts,
  listProductsBulk, 
  updateProduct,
  updateProductsBulk, 
  deleteProduct,
  importProductsFromExcel,
  confirmImportProducts, 
} from "../controllers/product.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { productCreateSchema, productBulkUpdateSchema, productUpdateSchema } from "../schemas/product.schema.js";
import multer from "multer";

const router = Router();

// ✨ Bulk endpoints (DEBEN IR ANTES de las rutas con :id)
router.get("/business/:businessId/products/bulk", requireAuth, listProductsBulk);

router.patch(
  "/products/bulk",
  requireAuth,
  validateBody(productBulkUpdateSchema),
  updateProductsBulk
);

router.get("/business/:businessId/products", requireAuth, listProducts);

router.post(
  "/business/:businessId/products",
  requireAuth,
  validateBody(productCreateSchema),
  createProduct
);

router.patch(
  "/products/:id",
  requireAuth,
  validateBody(productUpdateSchema),
  updateProduct
);

router.delete("/products/:id", requireAuth, deleteProduct);


// ✅ CONFIGURACIÓN SEGURA PARA IMPORTACIÓN DE EXCEL
const uploadExcelSecure = multer({
  storage: multer.memoryStorage(),
  
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
    files: 1, // Solo 1 archivo a la vez
  },
  
  fileFilter: (req, file, cb) => {
    // ✅ SOLO aceptar .xlsx (el más seguro)
    const allowedMimes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ];
    
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error("Solo se permiten archivos .xlsx"));
    }
    
    // ✅ Verificar extensión también (doble check)
    if (!file.originalname.toLowerCase().endsWith('.xlsx')) {
      return cb(new Error("Solo se permiten archivos .xlsx"));
    }
    
    cb(null, true);
  }
});

// ✅ Handler de errores de multer
function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: "Archivo demasiado grande. Máximo 5MB" 
      });
    }
    return res.status(400).json({ 
      message: `Error de upload: ${err.message}` 
    });
  }
  
  if (err) {
    return res.status(400).json({ 
      message: err.message 
    });
  }
  
  next();
}

// ✨ Rutas de importación CON SEGURIDAD
router.post(
  "/business/:businessId/products/import",
  requireAuth,
  uploadExcelSecure.single("file"),
  handleUploadError,
  importProductsFromExcel
);

router.post(
  "/business/:businessId/products/import/confirm",
  requireAuth,
  confirmImportProducts
);

export default router;