// lib/useAnalytics.ts
import { useEffect, useRef } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export function useMenuViewTracking(slug: string, businessId: number) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current || !slug) return;

    tracked.current = true;

    // Registrar vista del menú
    fetch(`${API_BASE}/api/analytics/menu-view/${slug}`, {
      method: "POST",
    }).catch((err) => console.error("Error tracking view:", err));
  }, [slug]);
}

export function trackProductClick(businessId: number, productId?: number) {
  if (!businessId) return;

  fetch(`${API_BASE}/api/analytics/product-click`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ businessId, productId }),
  }).catch((err) => console.error("Error tracking click:", err));
}

// Usar en app/m/[slug]/page.tsx:
// import { useMenuViewTracking } from "@/lib/useAnalytics";
// useMenuViewTracking(slug, data.business.id);

// Usar en PublicMenuClient.tsx en el botón de WhatsApp:
// import { trackProductClick } from "@/lib/useAnalytics";
// onClick={() => {
//   trackProductClick(business.id, p.id);
//   window.open(waHref, "_blank");
// }}