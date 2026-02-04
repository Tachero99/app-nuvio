import jwt from "jsonwebtoken";
import prisma from "../prismaClient.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) return res.status(401).json({ message: "No token" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(401).json({ message: "Usuario inválido" });

    if (user.status !== "ACTIVE") {
      return res.status(403).json({ message: "Usuario desactivado" });
    }

    req.user = user; // guardamos el user para rutas siguientes
    next();
  } catch (e) {
    return res.status(401).json({ message: "Token inválido" });
  }
}
