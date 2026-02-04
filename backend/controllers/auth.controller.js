// controllers/auth.controller.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../prismaClient.js";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status, // ✅ importante si lo querés usar en front o middleware
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email y contraseña son obligatorios" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: "Credenciales inválidas" });

    // ✅ si está dado de baja, no lo dejás loguear
    if (user.status !== "ACTIVE") {
      return res.status(403).json({ message: "Usuario inactivo" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Credenciales inválidas" });

    const token = generateToken(user);

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      token,
    });
  } catch (error) {
    console.error("Error en login:", error);
    return res.status(500).json({ message: "Error al iniciar sesión" });
  }
}

// ✅ esto es lo que te falta para que no explote auth.routes.js
export async function me(req, res) {
  // viene del middleware: req.user = payload del token
  return res.json({ user: req.user });
}
