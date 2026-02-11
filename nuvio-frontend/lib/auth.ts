// lib/auth.ts
export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("nuvio_token");
}

export function getStoredUser<T = any>(): T | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("nuvio_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export type StoredUser = {
  id: number;
  name: string;
  email: string;
  role: "SUPERADMIN" | "CLIENT_OWNER" | string;
  status?: string;
};

export function readStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("nuvio_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("nuvio_user");
  localStorage.removeItem("nuvio_token");
  localStorage.removeItem("nuvio_business_slug");
  localStorage.removeItem("nuvio_business_id");
  localStorage.removeItem("nuvio_business_name");
}
