"use client";

import { useMemo, useState } from "react";
import type { MenuBusiness, MenuCategory, MenuProduct, Money } from "./types";
import { resolveMediaUrl } from "@/lib/media";

function moneyArs(value: Money) {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

function buildWaLink(waBase: string, text: string) {
  try {
    const url = new URL(waBase);
    url.searchParams.set("text", text);
    return url.toString();
  } catch {
    const sep = waBase.includes("?") ? "&" : "?";
    return `${waBase}${sep}text=${encodeURIComponent(text)}`;
  }
}

function ProductRow({
  p,
  waBase,
  businessName,
  categoryName,
}: {
  p: MenuProduct;
  waBase: string | null;
  businessName: string;
  categoryName?: string;
}) {
  const priceLabel = p.price != null ? moneyArs(p.price) : null;

  const imgSrc = useMemo(() => resolveMediaUrl(p.imageUrl), [p.imageUrl]);

  const waText = useMemo(() => {
    const parts = [
      `Hola! Quiero pedir en ${businessName}:`,
      `• ${p.name}${priceLabel ? ` (${priceLabel})` : ""}`,
    ];
    if (categoryName) parts.push(`Categoría: ${categoryName}`);
    if (typeof window !== "undefined") parts.push(`Menú: ${window.location.href}`);
    return parts.join("\n");
  }, [businessName, p.name, priceLabel, categoryName]);

  const waHref = waBase ? buildWaLink(waBase, waText) : null;

  return (
    <li className="px-4 py-4">
      <div className="flex items-start gap-3">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={p.name}
            loading="lazy"
            decoding="async"
            className="h-16 w-16 rounded-lg object-cover border border-slate-800 shrink-0"
          />
        ) : (
          <div className="h-16 w-16 rounded-lg border border-slate-800 bg-slate-900/40 shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-medium truncate">{p.name}</div>
              {p.description ? (
                <div className="mt-1 text-sm text-slate-400">{p.description}</div>
              ) : null}
            </div>

            {priceLabel ? (
              <div className="shrink-0 rounded-lg border border-slate-700 bg-slate-950/50 px-2 py-1 text-sm text-slate-200">
                {priceLabel}
              </div>
            ) : null}
          </div>

          {waHref ? (
            <div className="mt-3">
              <a
                href={waHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-xs font-medium text-white"
              >
                Pedir este producto
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export default function PublicMenuClient({
  slug,
  business,
  waBase,
  categories,
  ungroupedProducts,
}: {
  slug: string;
  business: MenuBusiness;
  waBase: string | null;
  categories: MenuCategory[];
  ungroupedProducts: MenuProduct[];
}) {
  const [open, setOpen] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    categories.forEach((c, idx) => (initial[c.id] = idx === 0));
    if (ungroupedProducts.length) initial[-1] = true;
    return initial;
  });

  const allOpen = useMemo(() => {
    const catAll = categories.length ? categories.every((c) => open[c.id] === true) : true;
    const otherAll = ungroupedProducts.length ? open[-1] === true : true;
    return catAll && otherAll;
  }, [categories, open, ungroupedProducts.length]);

  const waTop = useMemo(() => {
    if (!waBase) return null;
    const text = `Hola! Quiero hacer un pedido en ${business.name}.\nMenú: ${
      typeof window !== "undefined" ? window.location.href : ""
    }`;
    return buildWaLink(waBase, text);
  }, [waBase, business.name]);

  function toggleCat(id: number) {
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function setAll(nextOpen: boolean) {
    const m: Record<number, boolean> = {};
    categories.forEach((c) => (m[c.id] = nextOpen));
    if (ungroupedProducts.length) m[-1] = nextOpen;
    setOpen(m);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <header className="space-y-3">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">{business.name}</h1>
            {business.address ? (
              <p className="text-sm text-slate-400">{business.address}</p>
            ) : (
              <p className="text-sm text-slate-500">Menú digital</p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {waTop ? (
                <a
                  href={waTop}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-medium text-white"
                >
                  Pedir por WhatsApp
                </a>
              ) : null}

              <button
                onClick={() => setAll(!allOpen)}
                className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
              >
                {allOpen ? "Contraer todo" : "Expandir todo"}
              </button>
            </div>

            {(categories.length || ungroupedProducts.length) ? (
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      document.getElementById(`cat-${c.id}`)?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }}
                    className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
                    title={c.name}
                  >
                    {c.name}
                  </button>
                ))}

                {ungroupedProducts.length ? (
                  <button
                    type="button"
                    onClick={() => {
                      document.getElementById("cat-ungrouped")?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }}
                    className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
                  >
                    Otros
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </header>

        <div className="mt-6 space-y-6">
          {/* Otros */}
          {ungroupedProducts.length ? (
            <section
              id="cat-ungrouped"
              className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden"
            >
              <button
                onClick={() => toggleCat(-1)}
                className="w-full flex items-center justify-between border-b border-slate-800 px-4 py-3 hover:bg-slate-900/60"
              >
                <h2 className="text-lg font-medium">Otros</h2>
                <span className="text-xs text-slate-400">
                  {open[-1] === false ? "Mostrar" : "Ocultar"}
                </span>
              </button>

              {open[-1] === false ? null : (
                <ul className="divide-y divide-slate-800">
                  {ungroupedProducts.map((p) => (
                    <ProductRow
                      key={p.id}
                      p={p}
                      waBase={waBase}
                      businessName={business.name}
                    />
                  ))}
                </ul>
              )}
            </section>
          ) : null}

          {/* Categorías */}
          {categories.map((cat) => {
            const isOpen = open[cat.id] === true;
            const catImgSrc = resolveMediaUrl(cat.imageUrl);
            
            // ✨ Contar total de productos (secciones + sin sección)
            const totalProducts = 
              (cat.sections?.reduce((sum, s) => sum + s.products.length, 0) ?? 0) +
              (cat.products?.length ?? 0);

            return (
              <section
                id={`cat-${cat.id}`}
                key={cat.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden"
              >
                <button
                  onClick={() => toggleCat(cat.id)}
                  className="w-full flex items-center justify-between border-b border-slate-800 px-4 py-3 hover:bg-slate-900/60"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {catImgSrc ? (
                      <img
                        src={catImgSrc}
                        alt={cat.name}
                        className="h-9 w-9 rounded-lg object-cover border border-slate-800"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-lg border border-slate-800 bg-slate-900/40" />
                    )}
                    <h2 className="text-lg font-medium truncate">{cat.name}</h2>
                  </div>

                  <span className="text-xs text-slate-400">
                    {isOpen ? "Ocultar" : "Mostrar"} · {totalProducts}
                  </span>
                </button>

                {isOpen ? (
                  <div>
                    {/* ✨ NUEVO: Renderizar secciones */}
                    {cat.sections && cat.sections.length > 0 && (
                      <div>
                        {cat.sections.map((section) => (
                          <div key={section.id}>
                            {/* Título de la sección */}
                            <div className="px-4 py-3 bg-slate-800/30 border-b border-slate-800">
                              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                                {section.name}
                              </h3>
                            </div>
                            
                            {/* Productos de la sección */}
                            <ul className="divide-y divide-slate-800">
                              {section.products.map((p) => (
                                <ProductRow
                                  key={p.id}
                                  p={p}
                                  waBase={waBase}
                                  businessName={business.name}
                                  categoryName={cat.name}
                                />
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Productos sin sección */}
                    {cat.products && cat.products.length > 0 && (
                      <ul className="divide-y divide-slate-800">
                        {cat.products.map((p) => (
                          <ProductRow
                            key={p.id}
                            p={p}
                            waBase={waBase}
                            businessName={business.name}
                            categoryName={cat.name}
                          />
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>

        {waTop ? (
          <a
            href={waTop}
            target="_blank"
            rel="noreferrer"
            className="fixed bottom-5 right-5 rounded-full bg-emerald-600 hover:bg-emerald-500 px-4 py-3 text-sm font-medium text-white shadow-lg"
          >
            WhatsApp
          </a>
        ) : null}

        <footer className="mt-10 border-t border-slate-800 pt-6 text-xs text-slate-500">
          <p>
            Hecho con <span className="text-slate-300">Nuvio</span> ·{" "}
            <span className="font-mono">/m/{slug}</span>
          </p>
        </footer>
      </div>
    </div>
  );
}