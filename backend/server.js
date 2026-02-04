// server.js
import express from "express";
import cors from "cors";
import "dotenv/config";

import path from "path";
import authRoutes from "./routes/auth.routes.js";
import businessRoutes from "./routes/business.routes.js";
import menuRoutes from "./routes/menu.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import productRoutes from "./routes/product.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import uploadRoutes from "./routes/upload.routes.js";

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ uploads SIEMPRE en la raíz del backend
const uploadDir = path.join(process.cwd(), "uploads");

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options(/.*/, cors());

// ✅ servir uploads
app.use("/uploads", express.static(uploadDir));

// health
app.get("/health", (_req, res) => res.json({ ok: true }));

// ✅ rutas
app.use("/api/auth", authRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/admin", adminRoutes);

// ABM
app.use("/api", categoryRoutes);
app.use("/api", productRoutes);

// ✅ uploads: POST /api/uploads
app.use("/api", uploadRoutes);

app.listen(PORT, () => {
  console.log(`API en http://localhost:${PORT}`);
  console.log("uploads dir:", uploadDir);
});
