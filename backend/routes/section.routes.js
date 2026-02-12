// routes/section.routes.js
import { Router } from "express";
import {
  listSections,
  createSection,
  updateSection,
  deleteSection,
} from "../controllers/section.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

// Listar secciones de una categoría
router.get(
  "/business/:businessId/categories/:categoryId/sections",
  requireAuth,
  listSections
);

// Crear sección en una categoría
router.post(
  "/business/:businessId/categories/:categoryId/sections",
  requireAuth,
  createSection
);

// Actualizar sección
router.patch("/sections/:id", requireAuth, updateSection);

// Eliminar sección
router.delete("/sections/:id", requireAuth, deleteSection);

export default router;