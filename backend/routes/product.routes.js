// routes/product.routes.js
import { Router } from "express";
import {
  createProduct,
  listProducts,
  listProductsBulk, 
  updateProduct,
  updateProductsBulk, 
  deleteProduct,
  importProductsFromExcel,    // ← NUEVO
  confirmImportProducts, 
} from "../controllers/product.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { productCreateSchema, productBulkUpdateSchema, productUpdateSchema } from "../schemas/product.schema.js";
import multer from "multer";

const router = Router();

// ✨ NUEVO: Bulk endpoints (DEBEN IR ANTES de las rutas con :id)
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


// Configurar multer para archivos en memoria
const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos Excel (.xls, .xlsx) o CSV"));
    }
  },
});

// ✨ Rutas de importación
router.post(
  "/business/:businessId/products/import",
  requireAuth,
  uploadMemory.single("file"),
  importProductsFromExcel
);

router.post(
  "/business/:businessId/products/import/confirm",
  requireAuth,
  confirmImportProducts
);

export default router;
