// controllers/section.controller.js
import prisma from "../prismaClient.js";

async function assertCanAccessBusiness(req, businessId) {
  const role = req.user?.role;
  if (role === "SUPERADMIN") return;

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { ownerId: true },
  });

  if (!business) {
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

// GET /api/business/:businessId/categories/:categoryId/sections
export async function listSections(req, res) {
  try {
    const businessId = Number(req.params.businessId);
    const categoryId = Number(req.params.categoryId);

    if (!businessId || !categoryId) {
      return res.status(400).json({ message: "businessId y categoryId son obligatorios" });
    }

    await assertCanAccessBusiness(req, businessId);

    const sections = await prisma.section.findMany({
      where: {
        businessId,
        categoryId,
      },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });

    return res.json({ sections });
  } catch (e) {
    if (e?.status) {
      if (e.message === "BUSINESS_NOT_FOUND")
        return res.status(404).json({ message: "Negocio no encontrado" });
      if (e.message === "FORBIDDEN")
        return res.status(403).json({ message: "No tenés permisos sobre este negocio" });
    }
    console.error("listSections:", e);
    return res.status(500).json({ message: "Error listando secciones" });
  }
}

// POST /api/business/:businessId/categories/:categoryId/sections
export async function createSection(req, res) {
  try {
    const businessId = Number(req.params.businessId);
    const categoryId = Number(req.params.categoryId);
    const { name, sortOrder } = req.body;

    if (!businessId || !categoryId) {
      return res.status(400).json({ message: "businessId y categoryId son obligatorios" });
    }

    if (!name || String(name).trim() === "") {
      return res.status(400).json({ message: "El nombre es obligatorio" });
    }

    await assertCanAccessBusiness(req, businessId);

    // Verificar que la categoría existe y pertenece al negocio
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        businessId,
      },
    });

    if (!category) {
      return res.status(404).json({ message: "Categoría no encontrada" });
    }

    const section = await prisma.section.create({
      data: {
        businessId,
        categoryId,
        name: String(name).trim(),
        sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
        isActive: true,
      },
    });

    return res.status(201).json({ section });
  } catch (e) {
    if (e?.status) {
      if (e.message === "BUSINESS_NOT_FOUND")
        return res.status(404).json({ message: "Negocio no encontrado" });
      if (e.message === "FORBIDDEN")
        return res.status(403).json({ message: "No tenés permisos sobre este negocio" });
    }
    console.error("createSection:", e);
    return res.status(500).json({ message: "Error creando sección" });
  }
}

// PATCH /api/sections/:id
export async function updateSection(req, res) {
  try {
    const id = Number(req.params.id);
    const { name, sortOrder, isActive } = req.body;

    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const existing = await prisma.section.findUnique({
      where: { id },
      select: { id: true, businessId: true },
    });

    if (!existing) {
      return res.status(404).json({ message: "Sección no encontrada" });
    }

    await assertCanAccessBusiness(req, existing.businessId);

    const section = await prisma.section.update({
      where: { id },
      data: {
        name: name !== undefined ? String(name).trim() : undefined,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
    });

    return res.json({ section });
  } catch (e) {
    if (e?.status) {
      if (e.message === "BUSINESS_NOT_FOUND")
        return res.status(404).json({ message: "Negocio no encontrado" });
      if (e.message === "FORBIDDEN")
        return res.status(403).json({ message: "No tenés permisos sobre este negocio" });
    }
    console.error("updateSection:", e);
    return res.status(500).json({ message: "Error actualizando sección" });
  }
}

// DELETE /api/sections/:id
export async function deleteSection(req, res) {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const existing = await prisma.section.findUnique({
      where: { id },
      select: { id: true, businessId: true },
    });

    if (!existing) {
      return res.status(404).json({ message: "Sección no encontrada" });
    }

    await assertCanAccessBusiness(req, existing.businessId);

    // Desasociar productos de esta sección
    await prisma.product.updateMany({
      where: { sectionId: id },
      data: { sectionId: null },
    });

    // Eliminar la sección
    await prisma.section.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (e) {
    if (e?.status) {
      if (e.message === "BUSINESS_NOT_FOUND")
        return res.status(404).json({ message: "Negocio no encontrado" });
      if (e.message === "FORBIDDEN")
        return res.status(403).json({ message: "No tenés permisos sobre este negocio" });
    }
    console.error("deleteSection:", e);
    return res.status(500).json({ message: "Error eliminando sección" });
  }
}