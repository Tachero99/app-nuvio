// lib/share.ts

export function publicMenuPath(slug: string) {
  return `/m/${slug}`;
}

export function publicMenuUrl(slug: string, baseUrl?: string) {
  const path = publicMenuPath(slug);

  if (baseUrl) {
    const cleanBase = baseUrl.replace(/\/$/, "");
    return `${cleanBase}${path}`;
  }

  if (typeof window !== "undefined") return `${window.location.origin}${path}`;
  return path;
}

export async function copyToClipboard(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  throw new Error("Clipboard no disponible en este entorno.");
}

export function waLink(phone: string | null | undefined, message: string) {
  const clean = String(phone ?? "").replace(/[^\d]/g, "");
  const txt = encodeURIComponent(message);
  if (!clean) return `https://wa.me/?text=${txt}`;
  return `https://wa.me/${clean}?text=${txt}`;
}

/** ✅ Público: link directo al chat (sin mensaje) */
export function waChatLink(phone: string | null | undefined) {
  const clean = String(phone ?? "").replace(/[^\d]/g, "");
  if (!clean) return null;
  return `https://wa.me/${clean}`;
}
