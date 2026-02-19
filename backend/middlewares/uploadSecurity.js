// backend/middlewares/uploadSecurity.js
import multer from "multer";

// Configuración segura para uploads de Excel
export const uploadExcelSecure = multer({
  storage: multer.memoryStorage(),
  
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
    files: 1, // Solo 1 archivo a la vez
  },
  
  fileFilter: (req, file, cb) => {
    // Solo aceptar .xlsx (el más seguro)
    const allowedMimes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ];
    
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error("Solo se permiten archivos .xlsx"));
    }
    
    // Verificar extensión también (doble check)
    if (!file.originalname.toLowerCase().endsWith('.xlsx')) {
      return cb(new Error("Solo se permiten archivos .xlsx"));
    }
    
    cb(null, true);
  }
});

// Handler de errores de multer
export function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: "Archivo demasiado grande. Máximo 5MB" 
      });
    }
    return res.status(400).json({ 
      message: `Error de upload: ${err.message}` 
    });
  }
  
  if (err) {
    return res.status(400).json({ 
      message: err.message 
    });
  }
  
  next();
}