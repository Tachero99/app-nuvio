// app/m/[slug]/page.tsx
import { waChatLink } from "@/lib/share";
import PublicMenuClient from "./PublicMenuClient";
import type { MenuCategory, MenuProduct, MenuResponse, MenuSection } from "./types";
import { useMenuViewTracking } from "@/lib/useAnalytics";

function num(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function bySortOrderThenId(a: any, b: any) {
  const ao = num(a?.sortOrder, 0);
  const bo = num(b?.sortOrder, 0);
  if (ao !== bo) return ao - bo;
  return num(a?.id, 0) - num(b?.id, 0);
}

async function fetchMenu(slug: string): Promise<MenuResponse> {
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.API_BASE_URL ??
    "http://localhost:3001";

  const res = await fetch(`${apiBase}/api/menu/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`No se pudo cargar el menú (${res.status}): ${text}`);
  }

  return (await res.json()) as MenuResponse;
}

export default async function PublicMenuPage({
  params,
}: {
  params: { slug: string } | Promise<{ slug: string }>;
}) {
  const { slug } = await Promise.resolve(params);

  try {
    const data = await fetchMenu(slug);
    const waBase = waChatLink(data.business.whatsapp);

    // ✨ Procesar categorías con secciones
    const categories: MenuCategory[] = [...(data.categories ?? [])]
      .map((c) => {
        // Procesar secciones
        const sections: MenuSection[] = [...(c.sections ?? [])]
          .map((s) => ({
            ...s,
            products: [...(s.products ?? [])]
              .filter((p) => (p.status ?? "ACTIVE") === "ACTIVE")
              .sort(bySortOrderThenId),
          }))
          .filter((s) => s.products.length > 0) // Solo secciones con productos activos
          .sort(bySortOrderThenId);

        // Procesar productos sin sección
        const products = [...(c.products ?? [])]
          .filter((p) => (p.status ?? "ACTIVE") === "ACTIVE")
          .sort(bySortOrderThenId);

        return {
          ...c,
          sections,
          products,
        };
      })
      .filter((c) => c.sections.length > 0 || c.products.length > 0) // Solo categorías con contenido
      .sort(bySortOrderThenId);

    const ungroupedProducts: MenuProduct[] = [...(data.ungroupedProducts ?? [])]
      .filter((p) => (p.status ?? "ACTIVE") === "ACTIVE")
      .sort(bySortOrderThenId);

    return (
      <PublicMenuClient
        slug={slug}
        business={data.business}
        waBase={waBase}
        categories={categories}
        ungroupedProducts={ungroupedProducts}
      />
    );
  } catch (err: any) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h1 className="text-xl font-semibold">Menú no disponible</h1>
          <p className="mt-2 text-sm text-slate-300">
            {err?.message || "No se pudo cargar el menú."}
          </p>
          <p className="mt-3 text-xs text-slate-500">
            Si sos el dueño, revisá que el slug exista y que el backend esté corriendo.
          </p>
        </div>
      </div>
    );
  }
}