import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { listUsers, createUser, setUserStatus } from "../controllers/admin.controller.js";

const router = Router();

router.get("/users", requireAuth, requireRole("SUPERADMIN"), listUsers);
router.post("/users", requireAuth, requireRole("SUPERADMIN"), createUser);
router.patch("/users/:id/status", requireAuth, requireRole("SUPERADMIN"), setUserStatus);

export default router;
