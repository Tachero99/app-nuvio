// routes/upload.routes.js
import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

const uploadDir = path.join(process.cwd(), "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".bin";
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 6 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype?.startsWith("image/")) {
      return cb(new Error("Solo se permiten imágenes (image/*)."));
    }
    cb(null, true);
  },
});

// POST /api/uploads
router.post("/uploads", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: "ValidationError",
      message: 'No se recibió archivo. El campo debe llamarse "file".',
    });
  }

  // ✅ URL ABSOLUTA (esto evita el ValidationError del PATCH)
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const url = `${baseUrl}/uploads/${req.file.filename}`;

  return res.status(201).json({ url });
});

export default router;
