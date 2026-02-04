// middlewares/auth.middleware.js
import jwt from "jsonwebtoken";
import prisma from "../prismaClient.js";

// Middleware de protección de rutas
export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Token no enviado" });
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Formato de token inválido" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Traemos el usuario real de la DB (para saber status actual)
    const dbUser = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, name: true, email: true, role: true, status: true },
    });

    if (!dbUser) {
      return res.status(401).json({ message: "Usuario no existe" });
    }

    if (dbUser.status !== "ACTIVE") {
      return res.status(403).json({ message: "Usuario inactivo" });
    }

    req.user = dbUser; // ahora req.user trae status real
    next();
  } catch (error) {
    console.error("Error verificando token:", error);
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};

// Alias para compatibilidad con rutas viejas
export const authMiddleware = requireAuth;
