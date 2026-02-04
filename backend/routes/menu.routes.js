// routes/menu.routes.js
import { Router } from "express";
import { prisma } from "../prismaClient.js";
import QRCode from "qrcode"; 

const router = Router();

// ✅ QR público (no auth): /api/menu/:slug/qr.png
router.get("/:slug/qr.png", async (req, res) => {
  try {
    const { slug } = req.params;

    const business = await prisma.business.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true, isActive: true },
    });

    if (!business || !business.isActive) {
      return res.status(404).json({ message: "Menú no disponible para este negocio" });
    }

    const FRONTEND_PUBLIC_URL = process.env.FRONTEND_PUBLIC_URL ?? "http://localhost:3000";
    const publicUrl = `${FRONTEND_PUBLIC_URL}/m/${business.slug}`;

    const pngBuffer = await QRCode.toBuffer(publicUrl, {
      type: "png",
      errorCorrectionLevel: "H",
      margin: 2,
      scale: 8,
    });

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.send(pngBuffer);
  } catch (e) {
    console.error("Error generando QR:", e);
    return res.status(500).json({ message: "Error generando QR" });
  }
});


// Endpoint público: menú por slug de negocio
router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const business = await prisma.business.findUnique({
      where: { slug },
      include: {
        categories: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
        products: {
          where: { status: "ACTIVE" },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!business || !business.isActive) {
      return res
        .status(404)
        .json({ message: "Menú no disponible para este negocio" });
    }

    const categories = business.categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      imageUrl: cat.imageUrl,
      sortOrder: cat.sortOrder,
      products: business.products.filter((p) => p.categoryId === cat.id),
    }));

    const ungroupedProducts = business.products.filter(
      (p) => !p.categoryId
    );

    res.json({
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        whatsapp: business.whatsapp,
        address: business.address,
      },
      categories,
      ungroupedProducts,
    });
  } catch (error) {
    console.error("Error obteniendo menú público:", error);
    res.status(500).json({ message: "Error obteniendo menú" });
  }
});

export default router;
