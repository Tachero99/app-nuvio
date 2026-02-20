// routes/menu.routes.js - ACTUALIZADO CON SECCIONES Y MÓDULO 4
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


// ✨ Endpoint público: menú por slug de negocio (CON SECCIONES Y MÓDULO 4)
router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const business = await prisma.business.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        whatsapp: true,
        address: true,
        isActive: true,
        // ✨ NUEVO MÓDULO 4: Campos adicionales
        description: true,
        logo: true,
        instagram: true,
        facebook: true,
        website: true,
        hours: true,
        menuConfig: true,
      },
    });

    if (!business || !business.isActive) {
      return res
        .status(404)
        .json({ message: "Menú no disponible para este negocio" });
    }

    // Obtener categorías activas con secciones y productos
    const categories = await prisma.category.findMany({
      where: {
        businessId: business.id,
        isActive: true,
      },
      orderBy: { sortOrder: "asc" },
      include: {
        // ✨ incluir secciones
        sections: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          include: {
            products: {
              where: { status: "ACTIVE" },
              orderBy: { sortOrder: "asc" },
            },
          },
        },
        // Productos SIN sección
        products: {
          where: {
            status: "ACTIVE",
            sectionId: null,
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    // Productos sin categoría (ungrouped)
    const ungroupedProducts = await prisma.product.findMany({
      where: {
        businessId: business.id,
        status: "ACTIVE",
        categoryId: null,
      },
      orderBy: { sortOrder: "asc" },
    });

    // Formatear respuesta con secciones
    const formattedCategories = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      imageUrl: cat.imageUrl,
      sortOrder: cat.sortOrder,
      sections: cat.sections.map((section) => ({
        id: section.id,
        name: section.name,
        sortOrder: section.sortOrder,
        products: section.products,
      })),
      products: cat.products,
    }));

    res.json({
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        whatsapp: business.whatsapp,
        address: business.address,
        // ✨ NUEVO MÓDULO 4: Incluir en respuesta
        description: business.description,
        logo: business.logo,
        instagram: business.instagram,
        facebook: business.facebook,
        website: business.website,
        hours: business.hours,
        menuConfig: business.menuConfig,
      },
      categories: formattedCategories,
      ungroupedProducts,
    });
  } catch (error) {
    console.error("Error obteniendo menú público:", error);
    res.status(500).json({ message: "Error obteniendo menú" });
  }
});

export default router;