// middlewares/validate.middleware.js
export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "ValidationError",
        details: result.error.flatten(),
      });
    }
    req.body = result.data; // ✅ body sanitizado
    next();
  };
}
