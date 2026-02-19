// backend/controllers/analytics.controller.js
import { prisma } from "../prismaClient.js";

// POST /api/analytics/menu-view/:slug (público)
export async function trackMenuView(req, res) {
  try {
    const { slug } = req.params;

    const business = await prisma.business.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!business) {
      return res.status(404).json({ message: "Negocio no encontrado" });
    }

    // Extraer metadata
    const userAgent = req.headers["user-agent"] || null;
    const ipAddress = req.ip || req.connection.remoteAddress || null;
    const referer = req.headers.referer || req.headers.referrer || null;

    await prisma.menuView.create({
      data: {
        businessId: business.id,
        userAgent,
        ipAddress,
        referer,
      },
    });

    return res.status(201).json({ message: "Vista registrada" });
  } catch (error) {
    console.error("Error registrando vista:", error);
    return res.status(500).json({ message: "Error registrando vista" });
  }
}

// POST /api/analytics/product-click (público)
export async function trackProductClick(req, res) {
  try {
    const { productId, businessId } = req.body;

    if (!businessId) {
      return res.status(400).json({ message: "businessId requerido" });
    }

    // Extraer metadata
    const userAgent = req.headers["user-agent"] || null;
    const ipAddress = req.ip || req.connection.remoteAddress || null;

    await prisma.productClick.create({
      data: {
        businessId: Number(businessId),
        productId: productId ? Number(productId) : null,
        userAgent,
        ipAddress,
      },
    });

    return res.status(201).json({ message: "Click registrado" });
  } catch (error) {
    console.error("Error registrando click:", error);
    return res.status(500).json({ message: "Error registrando click" });
  }
}

// GET /api/business/:businessId/analytics/summary (autenticado)
export async function getAnalyticsSummary(req, res) {
  try {
    const businessId = Number(req.params.businessId);

    // Verificar permisos (agregar middleware requireAuth antes)
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true },
    });

    if (!business || business.ownerId !== req.user.id) {
      return res.status(403).json({ message: "No autorizado" });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);
    const last30Days = new Date(today);
    last30Days.setDate(last30Days.getDate() - 30);

    // Total de vistas
    const totalViews = await prisma.menuView.count({
      where: { businessId },
    });

    // Vistas últimos 7 días
    const viewsLast7Days = await prisma.menuView.count({
      where: {
        businessId,
        viewedAt: { gte: last7Days },
      },
    });

    // Vistas últimos 30 días
    const viewsLast30Days = await prisma.menuView.count({
      where: {
        businessId,
        viewedAt: { gte: last30Days },
      },
    });

    // Vistas hoy
    const viewsToday = await prisma.menuView.count({
      where: {
        businessId,
        viewedAt: { gte: today },
      },
    });

    // Total de clicks en productos
    const totalClicks = await prisma.productClick.count({
      where: { businessId },
    });

    // Clicks últimos 7 días
    const clicksLast7Days = await prisma.productClick.count({
      where: {
        businessId,
        clickedAt: { gte: last7Days },
      },
    });

    // Productos más clickeados (top 10)
    const topProducts = await prisma.productClick.groupBy({
      by: ["productId"],
      where: {
        businessId,
        productId: { not: null },
      },
      _count: { productId: true },
      orderBy: { _count: { productId: "desc" } },
      take: 10,
    });

    // Obtener info de los productos
    const productIds = topProducts.map((p) => p.productId).filter(Boolean);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });

    const topProductsWithNames = topProducts.map((p) => {
      const product = products.find((pr) => pr.id === p.productId);
      return {
        productId: p.productId,
        productName: product?.name || "Producto eliminado",
        clicks: p._count.productId,
      };
    });

    // Vistas por día (últimos 30 días)
    const viewsByDay = await prisma.$queryRaw`
      SELECT 
        DATE(viewedAt) as date,
        COUNT(*) as count
      FROM menu_views
      WHERE businessId = ${businessId}
        AND viewedAt >= ${last30Days}
      GROUP BY DATE(viewedAt)
      ORDER BY date ASC
    `;

    return res.json({
      summary: {
        totalViews,
        viewsToday,
        viewsLast7Days,
        viewsLast30Days,
        totalClicks,
        clicksLast7Days,
      },
      topProducts: topProductsWithNames,
      viewsByDay,
    });
  } catch (error) {
    console.error("Error obteniendo analytics:", error);
    return res.status(500).json({ message: "Error obteniendo estadísticas" });
  }
}