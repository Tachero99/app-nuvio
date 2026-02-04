import bcrypt from "bcryptjs";
import prisma from "../prismaClient.js";

export async function listUsers(req, res) {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
    orderBy: { id: "asc" },
  });

  res.json({ users });
}

// helpers simples
function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

export async function createUser(req, res) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "name, email, password son obligatorios" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: "El email ya existe" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: role ?? "CLIENT_OWNER",
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    // ✅ si es CLIENT_OWNER, creamos negocio automáticamente
    if (user.role === "CLIENT_OWNER") {
      const baseSlug = slugify(name || email.split("@")[0]);
      const slug = `${baseSlug}-${user.id}`; // único

      await prisma.business.create({
        data: {
          name: `${name} (Mi negocio)`,
          slug,
          ownerId: user.id,     // ✅ TU SCHEMA
          whatsapp: null,       // ✅ opcional (tu modelo lo tiene)
          address: null,        // ✅ opcional
          isActive: true,       // ✅ default true, pero lo dejamos explícito
        },
      });
    }

    return res.status(201).json({ user });
  } catch (e) {
    console.error("createUser:", e);
    return res.status(500).json({ message: "Error creando usuario" });
  }
}

export async function setUserStatus(req, res) {
  try {
    const id = Number(req.params.id);
    const { status } = req.body; // "ACTIVE" | "INACTIVE"

    if (!id) return res.status(400).json({ message: "ID inválido" });
    if (status !== "ACTIVE" && status !== "INACTIVE") {
      return res.status(400).json({ message: "status debe ser ACTIVE o INACTIVE" });
    }

    // opcional: evitar que te desactives a vos mismo
    if (req.user?.id === id) {
      return res.status(400).json({ message: "No podés cambiar tu propio estado" });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { status },
      select: { id: true, name: true, email: true, role: true, status: true },
    });

    return res.json({ user });
  } catch (e) {
    console.error("setUserStatus:", e);
    return res.status(500).json({ message: "Error actualizando estado" });
  }
}
