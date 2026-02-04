// routes/business.routes.js
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { getMyBusiness, updateMyBusiness } from "../controllers/business.controller.js";
import prisma from "../prismaClient.js";

const router = Router();

// ✅ negocio del usuario (controller)
router.get("/me", requireAuth, getMyBusiness);

// ✅ actualizar negocio del usuario (controller)  <<--- ESTO TE FALTABA
router.patch("/me", requireAuth, updateMyBusiness);

/** ✅ share info (lo dejás acá por ahora) */
router.get("/me/share", requireAuth, async (req, res) => {
  try {
    if (req.user.role === "SUPERADMIN") {
      return res.status(403).json({ message: "SUPERADMIN no tiene negocio asociado" });
    }

    const business = await prisma.business.findFirst({
      where: { ownerId: req.user.id, isActive: true },
      select: { id: true, name: true, slug: true, whatsapp: true },
    });

    if (!business) {
      return res.status(404).json({ message: "No se encontró negocio para este usuario" });
    }

    const FRONTEND_PUBLIC_URL = process.env.FRONTEND_PUBLIC_URL ?? "http://localhost:3000";
    const publicPath = `/m/${business.slug}`;
    const publicUrl = `${FRONTEND_PUBLIC_URL}${publicPath}`;

    const rawPhone = business.whatsapp ?? "";
    const phone = rawPhone.replace(/\D/g, "");

    const message = `Hola! Te comparto el menú de ${business.name}: ${publicUrl}`;
    const whatsappShareUrl =
      phone.length >= 8 ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : null;

    return res.json({
      business: { id: business.id, name: business.name, slug: business.slug },
      publicPath,
      publicUrl,
      message,
      whatsapp: business.whatsapp,
      whatsappShareUrl,
    });
  } catch (e) {
    console.error("Error en /business/me/share:", e);
    return res.status(500).json({ message: "Error obteniendo share info" });
  }
});

export default router;
