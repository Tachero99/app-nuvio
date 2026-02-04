// routes/category.routes.js
import { Router } from "express";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { categoryCreateSchema, categoryUpdateSchema } from "../schemas/category.schema.js";

const router = Router();

router.get("/business/:businessId/categories", requireAuth, listCategories);

router.post(
  "/business/:businessId/categories",
  requireAuth,
  validateBody(categoryCreateSchema),
  createCategory
);

router.patch(
  "/categories/:id",
  requireAuth,
  validateBody(categoryUpdateSchema),
  updateCategory
);

router.delete("/categories/:id", requireAuth, deleteCategory);

export default router;

