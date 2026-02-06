// routes/product.routes.js
import { Router } from "express";
import {
  createProduct,
  listProducts,
  listProductsBulk, 
  updateProduct,
  updateProductsBulk, 
  deleteProduct,
} from "../controllers/product.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { productCreateSchema, productBulkUpdateSchema, productUpdateSchema } from "../schemas/product.schema.js";

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

export default router;
