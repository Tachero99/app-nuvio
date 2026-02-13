// backend/schemas/product.schema.js
import { z } from "zod";

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

export const numberField = (min, max) =>
  z.preprocess((v) => {
    if (v === "" || v === null || v === undefined) return undefined;
    const n = typeof v === "string" ? Number(v) : v;
    if (!Number.isFinite(n)) return v;
    return n;
  }, withMinMax(z.number(), min, max));

export const productCreateSchema = z.object({
  name: z.string().trim().min(1, "name es obligatorio").max(120),
  price: numberField(0, 1_000_000_000).nullable(), // permite null
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  categoryId: intField(1, 1_000_000_000).nullable().optional(),
  sectionId: intField(1, 1_000_000_000).nullable().optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  imageUrl: z.string().trim().url("imageUrl debe ser URL válida").nullable().optional(),
  sortOrder: intField(0, 10000).optional(),
});

export const productUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  price: numberField(0, 1_000_000_000).nullable().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  categoryId: intField(1, 1_000_000_000).nullable().optional(),
  sectionId: intField(1, 1_000_000_000).nullable().optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  imageUrl: z.string().trim().url("imageUrl debe ser URL válida").nullable().optional(),
  sortOrder: intField(0, 10000).optional(),
});

// ✨ NUEVO: Schema para bulk update
export const productBulkUpdateSchema = z.object({
  updates: z.array(
    z.object({
      id: intField(1, 1_000_000_000),
      name: z.string().trim().min(1).max(120).optional(),
      price: numberField(0, 1_000_000_000).nullable().optional(),
      cost: numberField(0, 1_000_000_000).nullable().optional(),
      status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
      categoryId: intField(1, 1_000_000_000).nullable().optional(),
      description: z.string().trim().max(1000).nullable().optional(),
      imageUrl: z.string().trim().url().nullable().optional(),
      stock: intField(0, 1_000_000).nullable().optional(),
      sortOrder: intField(0, 10000).optional(),
    })
  ).min(1, "Debe incluir al menos un producto para actualizar"),
});