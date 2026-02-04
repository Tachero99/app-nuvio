// controllers/business.controller.js
import { prisma } from "../prismaClient.js";

/**
 * Crea un negocio para el usuario logueado
 * (por ahora asumimos 1 negocio por dueño)
 */
export const createBusiness = async (req, res) => {
  try {
    const userId = req.user.id; // viene del middleware de auth
    const { name, slug, whatsapp, address } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ message: "name y slug son obligatorios" });
    }

    // slug único
    const existing = await prisma.business.findUnique({
      where: { slug },
    });
    if (existing) {
      return res
        .status(409)
        .json({ message: "Ya existe un negocio con ese slug" });
    }

    const business = await prisma.business.create({
      data: {
        name,
        slug,
        whatsapp,
        address,
        ownerId: userId,
      },
    });

    res.status(201).json(business);
  } catch (error) {
    console.error("Error creando negocio:", error);
    res.status(500).json({ message: "Error creando negocio" });
  }
};

/**
 * Devuelve el negocio del usuario logueado
 */
export const getMyBusiness = async (req, res) => {
  try {
    // ✅ superadmin no tiene negocio
    if (req.user.role === "SUPERADMIN") {
      return res
        .status(403)
        .json({ message: "SUPERADMIN no tiene negocio asociado" });
    }

    const userId = req.user.id;

    const business = await prisma.business.findFirst({
      where: { ownerId: userId, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        address: true,
        whatsapp: true,
        isActive: true,
      },
    });

    if (!business) {
      return res
        .status(404)
        .json({ message: "Este usuario todavía no tiene negocio" });
    }

    return res.json(business);
  } catch (error) {
    console.error("Error obteniendo negocio:", error);
    return res.status(500).json({ message: "Error obteniendo negocio" });
  }
};

/**
 * Actualiza datos del negocio del usuario
 */

export const updateMyBusiness = async (req, res) => {
  try {
    if (req.user.role === "SUPERADMIN") {
      return res
        .status(403)
        .json({ message: "SUPERADMIN no tiene negocio asociado" });
    }

    const userId = req.user.id;
    const { name, whatsapp, address, isActive, slug } = req.body;

    const business = await prisma.business.findFirst({
      where: { ownerId: userId },
    });

    if (!business) {
      return res
        .status(404)
        .json({ message: "Este usuario no tiene negocio para actualizar" });
    }

    // ✅ si cambia slug, validamos único
    let nextSlug = business.slug;
    if (typeof slug === "string" && slug.trim() && slug.trim() !== business.slug) {
      const candidate = slug.trim();

      const existing = await prisma.business.findUnique({
        where: { slug: candidate },
      });

      if (existing && existing.id !== business.id) {
        return res.status(409).json({ message: "Ya existe un negocio con ese slug" });
      }

      nextSlug = candidate;
    }

    const updated = await prisma.business.update({
      where: { id: business.id },
      data: {
        name: typeof name === "string" && name.trim() ? name.trim() : business.name,
        whatsapp: whatsapp ?? business.whatsapp,
        address: address ?? business.address,
        slug: nextSlug,
        isActive: typeof isActive === "boolean" ? isActive : business.isActive,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        address: true,
        whatsapp: true,
        isActive: true,
      },
    });

    return res.json(updated);
  } catch (error) {
    console.error("Error actualizando negocio:", error);
    return res.status(500).json({ message: "Error actualizando negocio" });
  }
};
