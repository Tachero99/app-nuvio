// nuvio-frontend/lib/upload.ts
import { getToken } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

export async function uploadImage(file: File): Promise<string> {
  const token = getToken();

  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch(`${API_BASE}/api/uploads`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: fd,
  });

  const text = await res.text().catch(() => "");
  if (!res.ok) throw new Error(text || `HTTP ${res.status}`);

  const data = JSON.parse(text) as { url?: string };
  if (!data?.url) throw new Error("Upload inválido: no vino url");
  return data.url; // ✅ ahora es ABSOLUTA
}
