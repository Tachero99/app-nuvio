// backend/schemas/category.schema.js
import { z } from "zod";

/**
 * Helpers
 * - convierten ""/null/undefined -> undefined (para optional)
 * - convierten "123" -> 123
 * - aplican min/max sobre el ZodNumber interno (NO sobre el preprocess)
 */
const withMinMax = (schema, min, max) => {
  let s = schema;
  if (Number.isFinite(min)) s = s.min(min);
  if (Number.isFinite(max)) s = s.max(max);
  return s;
};

export const intField = (min, max) =>
  z.preprocess((v) => {
    if (v === "" || v === null || v === undefined) return undefined;
    const n = typeof v === "string" ? Number(v) : v;
    if (!Number.isFinite(n)) return v;
    return Math.trunc(n);
  }, withMinMax(z.number().int(), min, max));

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1, "name es obligatorio").max(120),
  imageUrl: z.string().trim().url("imageUrl debe ser URL válida").nullable().optional(),
  sortOrder: intField(0, 10000).optional(),
  isActive: z.boolean().optional(),
});

export const categoryUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  imageUrl: z.string().trim().url("imageUrl debe ser URL válida").nullable().optional(),
  sortOrder: intField(0, 10000).optional(),
  isActive: z.boolean().optional(),
});
