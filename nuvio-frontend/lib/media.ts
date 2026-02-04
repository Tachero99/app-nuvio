// lib/media.ts
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

export function resolveMediaUrl(url?: string | null): string | null {
  if (!url) return null;

  // data urls
  if (url.startsWith("data:")) return url;

  // absolutos
  if (url.startsWith("http://") || url.startsWith("https://")) return url;

  // relativos: /uploads/xxx.jpg o uploads/xxx.jpg
  if (url.startsWith("/")) return `${API_BASE}${url}`;
  return `${API_BASE}/${url}`;
}
