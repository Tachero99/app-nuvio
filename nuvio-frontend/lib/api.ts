// nuvio-frontend/lib/api.ts
import { getToken } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

async function readErrorText(res: Response) {
  // intenta JSON con message/error; si no, texto plano
  const ct = res.headers.get("content-type") || "";
  try {
    if (ct.includes("application/json")) {
      const j = await res.json().catch(() => null);
      const msg = j?.message || j?.error || j?.details || JSON.stringify(j);
      return msg ? String(msg) : "";
    }
  } catch {}
  return await res.text().catch(() => "");
}

async function apiFetch<T>(path: string, options: RequestInit = {}) {
  const token = getToken();

  const headers = new Headers(options.headers);

  // JSON headers salvo FormData
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    // opcional (no molesta si no usás cookies):
    credentials: "include",
  });

  if (!res.ok) {
    const errText = await readErrorText(res);
    throw new Error(`HTTP ${res.status}${errText ? ` - ${errText}` : ""}`);
  }

  // ✅ 204 No Content
  if (res.status === 204) return undefined as T;

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return (await res.json()) as T;

  const text = await res.text().catch(() => "");
  return text as unknown as T;
}

/* =========================
  AUTH
========================= */

export async function loginRequest(email: string, password: string) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });

  if (!res.ok) {
    const text = await readErrorText(res);
    throw new Error(`Login falló: HTTP ${res.status}${text ? ` - ${text}` : ""}`);
  }

  const data = (await res.json()) as {
    token: string;
    user: { id: number; name: string; email: string; role: string; status?: string };
  };

  if (typeof window !== "undefined") {
    localStorage.setItem("nuvio_token", data.token);
    localStorage.setItem("nuvio_user", JSON.stringify(data.user));
  }

  return data;
}

/* =========================
  BUSINESS / MENU
========================= */

export async function getMyBusiness() {
  return apiFetch<{
    id: number;
    name: string;
    slug: string;
    address: string | null;
    whatsapp?: string | null;
    isActive?: boolean;
  }>("/api/business/me");
}

export async function getMenuBySlug(slug: string) {
  return apiFetch<{
    business: {
      id: number;
      name: string;
      address: string | null;
      whatsapp?: string | null;
      slug?: string | null;
    };
    categories: { id: number; name: string; products: any[]; imageUrl?: string | null; sortOrder?: number | null }[];
    ungroupedProducts: any[];
  }>(`/api/menu/${encodeURIComponent(slug)}`);
}

export async function updateMyBusiness(input: {
  name?: string;
  slug?: string;
  whatsapp?: string | null;
  address?: string | null;
  isActive?: boolean;
}) {
  const updated = await apiFetch<{
    id: number;
    name: string;
    slug: string;
    address: string | null;
    whatsapp: string | null;
    isActive: boolean;
  }>("/api/business/me", {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  if (typeof window !== "undefined") {
    localStorage.setItem("nuvio_business_id", String(updated.id));
    localStorage.setItem("nuvio_business_slug", updated.slug);
    localStorage.setItem("nuvio_business_name", updated.name);
  }

  return updated;
}

/** ===== BusinessCtx cache ===== */
export type BusinessCtx = { id: number; slug: string; name: string };

function getStoredUser(): { role?: string } | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("nuvio_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function ensureBusinessCtx(): Promise<BusinessCtx> {
  if (typeof window === "undefined") {
    throw new Error("ensureBusinessCtx() solo se puede usar en el cliente.");
  }

  const u = getStoredUser();
  if (u?.role === "SUPERADMIN") {
    throw new Error("SUPERADMIN no administra categorías/productos. Entrá al /admin.");
  }

  const idRaw = localStorage.getItem("nuvio_business_id");
  const slug = localStorage.getItem("nuvio_business_slug");
  const name = localStorage.getItem("nuvio_business_name");

  if (idRaw && slug) return { id: Number(idRaw), slug, name: name ?? "Mi negocio" };

  const b = await getMyBusiness();

  localStorage.setItem("nuvio_business_id", String(b.id));
  localStorage.setItem("nuvio_business_slug", b.slug);
  localStorage.setItem("nuvio_business_name", b.name);

  return { id: b.id, slug: b.slug, name: b.name };
}

/* =========================
  ADMIN
========================= */

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: "SUPERADMIN" | "CLIENT_OWNER";
  status: "ACTIVE" | "INACTIVE";
  createdAt?: string;
};

export async function adminListUsers(): Promise<AdminUser[]> {
  const data = await apiFetch<{ users: AdminUser[] }>("/api/admin/users");
  return data.users ?? [];
}

export async function adminCreateUser(input: {
  name: string;
  email: string;
  password: string;
  role?: "SUPERADMIN" | "CLIENT_OWNER";
}): Promise<AdminUser> {
  const data = await apiFetch<{ user: AdminUser }>("/api/admin/users", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.user;
}

export async function adminSetUserStatus(
  userId: number,
  status: "ACTIVE" | "INACTIVE"
): Promise<AdminUser> {
  const data = await apiFetch<{ user: AdminUser }>(`/api/admin/users/${userId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return data.user;
}

/* =========================
  CATEGORIES / PRODUCTS
========================= */

export type Category = {
  id: number;
  name: string;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
};

// ✅ price puede venir number o string desde Prisma/JSON
export type Product = {
  id: number;
  name: string;
  price: number | string | null;
  status: "ACTIVE" | "INACTIVE";
  categoryId: number | null;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder?: number | null;
};

/** Normalizadores (aguantan respuestas distintas) */
function pickArray<T>(data: any, key: string): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && Array.isArray(data[key])) return data[key] as T[];
  return [];
}
function pickEntity<T>(data: any, key: string): T {
  return data && data[key] ? (data[key] as T) : (data as T);
}

/** CATEGORIES **/
export async function listCategories(): Promise<{ categories: Category[]; business: BusinessCtx }> {
  const business = await ensureBusinessCtx();
  const raw = await apiFetch<any>(`/api/business/${business.id}/categories`);
  const categories = pickArray<Category>(raw, "categories");
  return { categories, business };
}

// ✅ ahora soporta objeto completo (como tu UI ya lo manda)
export function createCategory(input: string): Promise<Category>;
export function createCategory(input: {
  name: string;
  sortOrder?: number;
  imageUrl?: string | null;
  isActive?: boolean;
}): Promise<Category>;
export async function createCategory(input: any): Promise<Category> {
  const business = await ensureBusinessCtx();

  const payload =
    typeof input === "string"
      ? { name: String(input).trim() }
      : {
          name: String(input?.name ?? "").trim(),
          sortOrder: input?.sortOrder,
          imageUrl: input?.imageUrl ?? null,
          isActive: input?.isActive,
        };

  if (!payload.name) throw new Error("name es obligatorio");

  // limpiar undefined para no mandar basura
  Object.keys(payload).forEach((k) => (payload as any)[k] === undefined && delete (payload as any)[k]);

  const raw = await apiFetch<any>(`/api/business/${business.id}/categories`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return pickEntity<Category>(raw, "category");
}

export async function updateCategory(
  categoryId: number,
  input: Partial<Pick<Category, "name" | "imageUrl" | "isActive" | "sortOrder">>
): Promise<Category> {
  const raw = await apiFetch<any>(`/api/categories/${categoryId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  return pickEntity<Category>(raw, "category");
}

export async function deleteCategory(categoryId: number): Promise<void> {
  await apiFetch<void>(`/api/categories/${categoryId}`, { method: "DELETE" });
}

/** PRODUCTS **/
export async function listProducts(): Promise<{ products: Product[]; business: BusinessCtx }> {
  const business = await ensureBusinessCtx();
  const raw = await apiFetch<any>(`/api/business/${business.id}/products`);
  const products = pickArray<Product>(raw, "products");
  return { products, business };
}

export async function createProduct(input: {
  name: string;
  price: number | null;
  categoryId?: number | null;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
}): Promise<Product> {
  const business = await ensureBusinessCtx();

  const raw = await apiFetch<any>(`/api/business/${business.id}/products`, {
    method: "POST",
    body: JSON.stringify(input),
  });

  return pickEntity<Product>(raw, "product");
}

export async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);

  const data = await apiFetch<{ url: string }>("/api/uploads", {
    method: "POST",
    body: fd,
  });

  return data.url;
}

export async function updateProduct(productId: number, input: Partial<Product>): Promise<Product> {
  const raw = await apiFetch<any>(`/api/products/${productId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  return pickEntity<Product>(raw, "product");
}

export async function deleteProduct(productId: number): Promise<void> {
  await apiFetch<void>(`/api/products/${productId}`, { method: "DELETE" });
}

/* =========================
  SHARE
========================= */

export type ShareInfo = {
  business: { id: number; name: string; slug: string };
  publicPath: string;
  publicUrl: string;
  message: string;
  whatsapp: string | null;
  whatsappShareUrl: string | null;
};

export async function getMyShareInfo(): Promise<ShareInfo> {
  return apiFetch<ShareInfo>("/api/business/me/share");
}
