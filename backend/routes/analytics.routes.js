// backend/routes/analytics.routes.js
import { Router } from "express";
import {
  trackMenuView,
  trackProductClick,
  getAnalyticsSummary,
} from "../controllers/analytics.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

// Rutas públicas (para tracking desde el menú público)
router.post("/menu-view/:slug", trackMenuView);
router.post("/product-click", trackProductClick);

// Rutas autenticadas (para ver estadísticas en el dashboard)
router.get("/business/:businessId/summary", requireAuth, getAnalyticsSummary);

export default router;

// Registrar en server.js:
// import analyticsRoutes from "./routes/analytics.routes.js";
// app.use("/api/analytics", analyticsRoutes);