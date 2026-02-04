// controllers/category.controller.js
import prisma from "../prismaClient.js";

async function assertCanAccessBusiness(req, businessId) {
  const role = req.user?.role;
  if (role === "SUPERADMIN") return;

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { ownerId: true, isActive: true },
  });

  if (!business || business.isActive === false) {
    const err = new Error("BUSINESS_NOT_FOUND");
    err.status = 404;
    throw err;
  }

  if (business.ownerId !== req.user?.id) {
    const err = new Error("FORBIDDEN");
    err.status = 403;
    throw err;
  }
}

// GET /api/business/:businessId/categories
export const listCategories = async (req, res) => {
  try {
    const businessId = Number(req.params.businessId);
    if (!businessId) return res.status(400).json({ message: "businessId inválido" });

    await assertCanAccessBusiness(req, businessId);

    const categories = await prisma.category.findMany({
      where: { businessId },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true, slug: true },
    });

    return res.json({ categories, business });
  } catch (e) {
    if (e?.status) {
      if (e.message === "BUSINESS_NOT_FOUND") return res.status(404).json({ message: "Negocio no encontrado" });
      if (e.message === "FORBIDDEN") return res.status(403).json({ message: "No tenés permisos sobre este negocio" });
    }
    console.error("listCategories:", e);
    return res.status(500).json({ message: "Error listando categorías" });
  }
};

// POST /api/business/:businessId/categories
export const createCategory = async (req, res) => {
  try {
    const businessId = Number(req.params.businessId);
    const { name, imageUrl, sortOrder } = req.body;

    if (!businessId) return res.status(400).json({ message: "businessId inválido" });
    if (!name || !String(name).trim()) return res.status(400).json({ message: "name es obligatorio" });

    await assertCanAccessBusiness(req, businessId);

    const category = await prisma.category.create({
      data: {
        businessId,
        name: String(name).trim(),
        imageUrl: imageUrl ?? null,
        sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
        isActive: true,
      },
    });

    return res.status(201).json({ category });
  } catch (e) {
    if (e?.status) {
      if (e.message === "BUSINESS_NOT_FOUND") return res.status(404).json({ message: "Negocio no encontrado" });
      if (e.message === "FORBIDDEN") return res.status(403).json({ message: "No tenés permisos sobre este negocio" });
    }
    console.error("createCategory:", e);
    return res.status(500).json({ message: "Error creando categoría" });
  }
};

// PATCH /api/categories/:id  (incluye activar/desactivar)
export const updateCategory = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "id inválido" });

    const existing = await prisma.category.findUnique({
      where: { id },
      select: { id: true, businessId: true },
    });
    if (!existing) return res.status(404).json({ message: "Categoría no encontrada" });

    await assertCanAccessBusiness(req, existing.businessId);

    const { name, imageUrl, sortOrder, isActive } = req.body;

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: name === undefined ? undefined : String(name).trim(),
        imageUrl: imageUrl === undefined ? undefined : imageUrl,
        sortOrder: sortOrder === undefined ? undefined : sortOrder,
        isActive: typeof isActive === "boolean" ? isActive : undefined,
      },
    });

    return res.json({ category });
  } catch (e) {
    if (e?.status) {
      if (e.message === "BUSINESS_NOT_FOUND") return res.status(404).json({ message: "Negocio no encontrado" });
      if (e.message === "FORBIDDEN") return res.status(403).json({ message: "No tenés permisos sobre este negocio" });
    }
    console.error("updateCategory:", e);
    return res.status(500).json({ message: "Error actualizando categoría" });
  }
};

// DELETE /api/categories/:id  -> HARD DELETE REAL
export const deleteCategory = async (req, res) => {
  try {
    const userId = Number(req.user?.id);
    const categoryId = Number(req.params.id);

    if (!Number.isFinite(userId)) {
      return res.status(401).json({ message: "No autenticado" });
    }
    if (!Number.isFinite(categoryId)) {
      return res.status(400).json({ message: "id inválido" });
    }

    // ✅ Buscar SOLO si pertenece al owner (evita el bug string vs number)
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        business: { ownerId: userId },
      },
      select: { id: true },
    });

    if (!category) {
      return res.status(404).json({ message: "Categoría no encontrada o no te pertenece" });
    }

    // 🔥 Hard delete seguro: primero null en productos, después delete categoría
    await prisma.$transaction([
      prisma.product.updateMany({
        where: { categoryId },
        data: { categoryId: null },
      }),
      prisma.category.delete({
        where: { id: categoryId },
      }),
    ]);

    return res.status(204).end();
  } catch (error) {
    console.error("Error eliminando categoría:", error);
    return res.status(500).json({ message: "Error eliminando categoría" });
  }
};
