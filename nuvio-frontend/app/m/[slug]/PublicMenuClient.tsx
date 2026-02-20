"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import type { MenuBusiness, MenuCategory, MenuProduct, Money } from "./types";
import { resolveMediaUrl } from "@/lib/media";
import { FeaturedProducts } from "@/components/FeaturedProducts";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

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

function trackProductClick(businessId: number, productId?: number) {
  if (!businessId) return;

  fetch(`${API_BASE}/api/analytics/product-click`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ businessId, productId }),
  }).catch((err) => console.error("Error tracking click:", err));
}

type Theme = "dark" | "light" | "warm";

function ProductRow({
  p,
  waBase,
  businessName,
  businessId,
  categoryName,
  theme,
  useSecondary,
  secondaryColor,
  secondaryTextColor,
}: {
  p: MenuProduct;
  waBase: string | null;
  businessName: string;
  businessId: number;
  categoryName?: string;
  theme: Theme;
  useSecondary?: boolean;
  secondaryColor?: string;
  secondaryTextColor?: string;
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

  const handleWhatsAppClick = () => {
    if (!waHref) return;
    trackProductClick(businessId, p.id);
    window.open(waHref, "_blank", "noopener,noreferrer");
  };

  return (
    <li className="px-4 py-4">
      <div className="flex items-start gap-3">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={p.name}
            loading="lazy"
            decoding="async"
            className={`h-16 w-16 rounded-lg object-cover border shrink-0 ${
              theme === "dark"
                ? "border-slate-800"
                : theme === "light"
                ? "border-gray-300"
                : "border-amber-700"
            }`}
          />
        ) : (
          <div
            className={`h-16 w-16 rounded-lg border shrink-0 ${
              theme === "dark"
                ? "border-slate-800 bg-slate-900/40"
                : theme === "light"
                ? "border-gray-300 bg-gray-100"
                : "border-amber-700 bg-amber-100"
            }`}
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-medium truncate">{p.name}</div>
              {p.description ? <div className="mt-1 text-sm opacity-70">{p.description}</div> : null}
            </div>

            {priceLabel ? (
              <div
                className={`shrink-0 rounded-lg border px-2 py-1 text-sm ${
                  theme === "dark"
                    ? "border-slate-700 bg-slate-950/50 text-slate-200"
                    : theme === "light"
                    ? "border-gray-300 bg-white text-gray-800"
                    : "border-amber-700 bg-amber-50 text-amber-900"
                }`}
              >
                {priceLabel}
              </div>
            ) : null}
          </div>

          {waHref ? (
            <div className="mt-3">
              {useSecondary ? (
                <button
                  onClick={handleWhatsAppClick}
                  className="inline-flex items-center justify-center rounded-xl px-3 py-2 text-xs font-medium transition-colors duration-200 hover:opacity-95"
                  style={{ backgroundColor: secondaryColor, color: secondaryTextColor, borderColor: secondaryColor }}
                >
                  Pedir este producto
                </button>
              ) : (
                <button
                  onClick={handleWhatsAppClick}
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-xs font-medium text-white transition-colors duration-200 hover:opacity-95"
                >
                  Pedir este producto
                </button>
              )}
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
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current || !slug) return;
    tracked.current = true;

    fetch(`${API_BASE}/api/analytics/menu-view/${slug}`, {
      method: "POST",
    }).catch((err) => console.error("Error tracking view:", err));
  }, [slug]);

  const [open, setOpen] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    categories.forEach((c, idx) => (initial[c.id] = idx === 0));
    if (ungroupedProducts.length) initial[-1] = true;
    return initial;
  });

  const [searchQuery, setSearchQuery] = useState("");
  
  const defaultTheme = useMemo(() => {
    const config = (business as any).menuConfig;
    if (config && typeof config === "object" && config.theme) {
      return config.theme as Theme;
    }
    return "dark";
  }, [business]);

  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [customBg, setCustomBg] = useState(false);
  const [customAll, setCustomAll] = useState(false);

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

  const handleTopWhatsAppClick = () => {
    if (!waTop) return;
    trackProductClick(business.id);
    window.open(waTop, "_blank", "noopener,noreferrer");
  };

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;

    const query = searchQuery.toLowerCase();

    return categories
      .map((cat) => {
        const filteredSections = cat.sections
          ?.map((section) => ({
            ...section,
            products: section.products.filter((p) => p.name.toLowerCase().includes(query)),
          }))
          .filter((s) => s.products.length > 0);

        const filteredProducts = cat.products.filter((p) => p.name.toLowerCase().includes(query));

        return {
          ...cat,
          sections: filteredSections,
          products: filteredProducts,
        };
      })
      .filter((c) => (c.sections && c.sections.length > 0) || c.products.length > 0);
  }, [categories, searchQuery]);

  const filteredUngrouped = useMemo(() => {
    if (!searchQuery.trim()) return ungroupedProducts;
    const query = searchQuery.toLowerCase();
    return ungroupedProducts.filter((p) => p.name.toLowerCase().includes(query));
  }, [ungroupedProducts, searchQuery]);

  function toggleCat(id: number) {
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function setAll(nextOpen: boolean) {
    const m: Record<number, boolean> = {};
    categories.forEach((c) => (m[c.id] = nextOpen));
    if (ungroupedProducts.length) m[-1] = nextOpen;
    setOpen(m);
  }

  const businessInfo = useMemo(() => {
    const info = business as any;
    return {
      description: info.description || null,
      logo: info.logo || null,
      instagram: info.instagram || null,
      facebook: info.facebook || null,
      website: info.website || null,
      hours: info.hours || null,
      primaryColor: info.menuConfig?.primaryColor || info.primaryColor || null,
      cardColor: info.menuConfig?.cardColor || null,
      secondaryColor: info.menuConfig?.secondaryColor || null,
    };
  }, [business]);

  // ✨ NUEVO: Filtrar productos destacados de TODAS las fuentes
  const featuredProducts = useMemo(() => {
    const allProducts: MenuProduct[] = [];
    
    // Productos de categorías con secciones
    categories.forEach((cat) => {
      cat.sections?.forEach((section) => {
        section.products.forEach((p) => {
          if ((p as any).isFeatured && (p as any).isAvailable !== false) {
            allProducts.push(p);
          }
        });
      });
      
      // Productos sin sección
      cat.products.forEach((p) => {
        if ((p as any).isFeatured && (p as any).isAvailable !== false) {
          allProducts.push(p);
        }
      });
    });
    
    // Productos sin categoría
    ungroupedProducts.forEach((p) => {
      if ((p as any).isFeatured && (p as any).isAvailable !== false) {
        allProducts.push(p);
      }
    });
    
    return allProducts;
  }, [categories, ungroupedProducts]);

  function getContrastColor(hex?: string) {
    if (!hex) return "#ffffff";
    const h = hex.replace("#", "");
    const bigint = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? "#000000" : "#ffffff";
  }

  const themeClasses = {
    dark: {
      bg: "bg-slate-950",
      text: "text-slate-100",
      card: "bg-slate-900/40 border-slate-800",
      button: "bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800",
      input: "bg-slate-800 border-slate-700 text-white",
      divider: "divide-slate-800",
      sectionHeader: "bg-slate-800/50 border-slate-700",
      footer: "border-slate-800",
    },
    light: {
      bg: "bg-gray-50",
      text: "text-gray-900",
      card: "bg-white border-gray-200",
      button: "bg-white border-gray-300 text-gray-700 hover:bg-gray-50",
      input: "bg-white border-gray-300 text-gray-900",
      divider: "divide-gray-200",
      sectionHeader: "bg-gray-100 border-gray-300",
      footer: "border-gray-200",
    },
    warm: {
      bg: "bg-amber-50",
      text: "text-amber-950",
      card: "bg-white border-amber-200",
      button: "bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200",
      input: "bg-white border-amber-300 text-amber-900",
      divider: "divide-amber-200",
      sectionHeader: "bg-amber-100 border-amber-300",
      footer: "border-amber-200",
    },
  };

  const primaryColor = businessInfo.primaryColor || "#16a34a";
  const primaryTextColor = getContrastColor(primaryColor);
  const cardColor = businessInfo.cardColor || "#0f172a";
  const cardTextColor = getContrastColor(cardColor);
  const secondaryColor = businessInfo.secondaryColor || "#10b981";
  const secondaryTextColor = getContrastColor(secondaryColor);

  const [customCard, setCustomCard] = useState(false);
  const [customSecondary, setCustomSecondary] = useState(false);

  const t = themeClasses[theme];

  const menuConfigVersion = useMemo(() => {
    try {
      return JSON.stringify((business as any).menuConfig || {});
    } catch {
      return "";
    }
  }, [business]);

  useEffect(() => {
    setCustomBg(customAll);
    setCustomCard(customAll);
    setCustomSecondary(customAll);
  }, [customAll]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `nuvio_menu_toggles_${business.id}`;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.menuConfigVersion === menuConfigVersion) {
        if (typeof parsed.customAll === "boolean") setCustomAll(parsed.customAll);
        if (parsed.theme) setTheme(parsed.theme as Theme);
      }
    } catch (e) {
      /* ignore */
    }
  }, [business.id, menuConfigVersion]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `nuvio_menu_toggles_${business.id}`;
    try {
      localStorage.setItem(
        key,
        JSON.stringify({ menuConfigVersion, customAll, theme, updatedAt: Date.now() })
      );
    } catch (e) {
      /* ignore */
    }
  }, [business.id, menuConfigVersion, customAll, theme]);

  return (
    <div
      className={`min-h-screen ${t.bg} ${t.text}`}
      style={
        customBg
          ? { backgroundColor: primaryColor, color: primaryTextColor }
          : undefined
      }
    >
      <div className="mx-auto max-w-3xl px-4 py-10">
        <header className="space-y-3">
          {businessInfo.logo && (
            <div className="flex justify-center mb-4">
              <img
                src={businessInfo.logo}
                alt={business.name}
                className="h-20 w-auto object-contain"
              />
            </div>
          )}

          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">{business.name}</h1>
            
            {businessInfo.description && (
              <p className="text-sm opacity-70 mt-2">{businessInfo.description}</p>
            )}
            
            {business.address ? (
              <p className="text-sm opacity-70">{business.address}</p>
            ) : (
              <p className="text-sm opacity-50">Menú digital</p>
            )}

            {(businessInfo.instagram || businessInfo.facebook || businessInfo.website) && (
              <div className="flex flex-wrap gap-3 mt-3">
                {businessInfo.instagram && (
                  <a
                    href={businessInfo.instagram.startsWith('http') ? businessInfo.instagram : `https://instagram.com/${businessInfo.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-base px-2 py-1 rounded-md opacity-90 hover:opacity-100 flex items-center gap-2"
                  >
                    <span className="text-lg">📷</span>
                    <span>Instagram</span>
                  </a>
                )}
                {businessInfo.facebook && (
                  <a
                    href={businessInfo.facebook.startsWith('http') ? businessInfo.facebook : `https://facebook.com/${businessInfo.facebook}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-base px-2 py-1 rounded-md opacity-90 hover:opacity-100 flex items-center gap-2"
                  >
                    <span className="text-lg">👍</span>
                    <span>Facebook</span>
                  </a>
                )}
                {businessInfo.website && (
                  <a
                    href={businessInfo.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-base px-2 py-1 rounded-md opacity-90 hover:opacity-100 flex items-center gap-2"
                  >
                    <span className="text-lg">🌐</span>
                    <span>Sitio web</span>
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {waTop ? (
                <button
                  onClick={handleTopWhatsAppClick}
                  className={customSecondary ? "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-200" : "inline-flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors duration-200"}
                  style={customSecondary ? { backgroundColor: secondaryColor, color: secondaryTextColor, borderColor: secondaryColor } : undefined}
                >
                  Pedir por WhatsApp
                </button>
              ) : null}

              <button
                onClick={() => setAll(!allOpen)}
                className={`inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm ${t.button} transition-colors duration-200`}
              >
                {allOpen ? "Contraer todo" : "Expandir todo"}
              </button>

              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setTheme("dark");
                    setCustomBg(false);
                    setCustomCard(false);
                    setCustomSecondary(false);
                  }}
                  className={`px-3 py-2 rounded-lg border ${
                    theme === "dark" ? "bg-slate-700 border-slate-600" : t.button
                  } transition-colors duration-200`}
                  title="Modo oscuro"
                >
                  <span className="inline-flex items-center gap-2">
                    <span>🌙</span>
                    <span className="text-sm">Modo oscuro</span>
                  </span>
                </button>
                <button
                  onClick={() => {
                    setTheme("light");
                    setCustomBg(false);
                    setCustomCard(false);
                    setCustomSecondary(false);
                  }}
                  className={`px-3 py-2 rounded-lg border ${
                    theme === "light" ? "bg-gray-200 border-gray-400" : t.button
                  } transition-colors duration-200`}
                  title="Modo claro"
                >
                  <span className="inline-flex items-center gap-2">
                    <span>☀️</span>
                    <span className="text-sm">Modo claro</span>
                  </span>
                </button>
                <button
                  onClick={() => setCustomAll((s) => !s)}
                  className={`px-3 py-2 rounded-lg border ${
                    customAll ? "ring-2 ring-offset-1" : t.button
                  } transition-colors duration-200`}
                  title="Personalizado"
                >
                  <span className="inline-flex items-center gap-2">
                    <span>🎨</span>
                    <span className="text-sm">Personalizado</span>
                  </span>
                </button>
              </div>
            </div>

            <div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar productos..."
                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${t.input}`}
              />
            </div>

            {(filteredCategories.length > 0 || filteredUngrouped.length > 0) && (
              <div className="flex flex-wrap gap-2">
                {filteredCategories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      document.getElementById(`cat-${c.id}`)?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }}
                    className={`border w-10 h-10 text-sm flex items-center justify-center rounded-md ${t.button} transition-colors duration-200`}
                    title={c.name}
                  >
                    {c.name}
                  </button>
                ))}

                {filteredUngrouped.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      document.getElementById("cat-ungrouped")?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }}
                    className={`rounded-full border px-3 py-1 text-xs ${t.button}`}
                  >
                    Otros
                  </button>
                )}
              </div>
            )}
          </div>
        </header>

        {searchQuery &&
          filteredCategories.length === 0 &&
          filteredUngrouped.length === 0 && (
            <div className={`mt-6 rounded-2xl border p-8 text-center ${t.card}`}>
              <p className="text-sm opacity-70">
                No se encontraron productos con "{searchQuery}"
              </p>
            </div>
          )}

        <div className="mt-6 space-y-6">
          {/* ✨ PRODUCTOS DESTACADOS */}
          <FeaturedProducts products={featuredProducts} theme={theme} />

          {filteredUngrouped.length > 0 && (
            <section id="cat-ungrouped" className={`rounded-2xl border overflow-hidden ${t.card}`} style={
              customCard
                ? { backgroundColor: cardColor, color: cardTextColor, borderColor: cardColor, transition: "background-color 200ms, color 200ms, border-color 200ms" }
                : undefined
            }>
              <button
                onClick={() => toggleCat(-1)}
                className={`w-full flex items-center justify-between border-b px-4 py-3 ${t.button}`}
              >
                <h2 className="text-lg font-medium">Otros</h2>
                <span className="text-xs opacity-70">{open[-1] === false ? "Mostrar" : "Ocultar"}</span>
              </button>

              {open[-1] !== false && (
                <ul className={`divide-y ${t.divider}`}>
                  {filteredUngrouped.map((p) => (
                    <ProductRow
                      key={p.id}
                      p={p}
                      waBase={waBase}
                      businessName={business.name}
                      businessId={business.id}
                      theme={theme}
                      useSecondary={customSecondary}
                      secondaryColor={secondaryColor}
                      secondaryTextColor={secondaryTextColor}
                    />
                  ))}
                </ul>
              )}
            </section>
          )}

          {filteredCategories.map((cat) => {
            const isOpen = open[cat.id] === true;
            const catImgSrc = resolveMediaUrl(cat.imageUrl);

            const sectionsProductCount =
              cat.sections?.reduce((sum, s) => sum + (s.products?.length || 0), 0) || 0;
            const directProductCount = cat.products?.length || 0;
            const totalProducts = sectionsProductCount + directProductCount;

            return (
              <section key={cat.id} id={`cat-${cat.id}`} className={`rounded-2xl border overflow-hidden ${t.card}`} style={
                customCard
                  ? { backgroundColor: cardColor, color: cardTextColor, borderColor: cardColor, transition: "background-color 200ms, color 200ms, border-color 200ms" }
                  : undefined
              }>
                <button
                  onClick={() => toggleCat(cat.id)}
                  className={`w-full flex items-center justify-between border-b px-4 py-3 ${t.button}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {catImgSrc ? (
                      <img
                        src={catImgSrc}
                        alt={cat.name}
                        className={`h-9 w-9 rounded-lg object-cover border ${
                          theme === "dark"
                            ? "border-slate-800"
                            : theme === "light"
                            ? "border-gray-300"
                            : "border-amber-700"
                        }`}
                      />
                    ) : (
                      <div
                        className={`h-9 w-9 rounded-lg border ${
                          theme === "dark"
                            ? "border-slate-800 bg-slate-900/40"
                            : theme === "light"
                            ? "border-gray-300 bg-gray-100"
                            : "border-amber-700 bg-amber-100"
                        }`}
                      />
                    )}
                    <h2 className="text-lg font-medium truncate">{cat.name}</h2>
                  </div>

                  <span className="text-xs opacity-70">
                    {isOpen ? "Ocultar" : "Mostrar"} · {totalProducts}
                  </span>
                </button>

                {isOpen && (
                  <div>
                    {cat.sections && cat.sections.length > 0 && (
                      <div>
                        {cat.sections.map((section) => (
                          <div key={section.id}>
                            <div className={`px-4 py-3 border-b ${t.sectionHeader}`}>
                              <h3 className="text-sm font-bold uppercase tracking-wider">
                                {section.name}
                              </h3>
                            </div>

                            {section.products && section.products.length > 0 && (
                              <ul className={`divide-y ${t.divider}`}>
                                {section.products.map((p) => (
                                  <ProductRow
                                    key={p.id}
                                    p={p}
                                    waBase={waBase}
                                    businessName={business.name}
                                    businessId={business.id}
                                    categoryName={cat.name}
                                    theme={theme}
                                    useSecondary={customSecondary}
                                    secondaryColor={secondaryColor}
                                    secondaryTextColor={secondaryTextColor}
                                  />
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {cat.products && cat.products.length > 0 && (
                      <>
                        {cat.sections && cat.sections.length > 0 && (
                          <div className={`px-4 py-3 border-b border-t ${t.sectionHeader}`}>
                            <h3 className="text-sm font-bold uppercase tracking-wider">Sin sección</h3>
                          </div>
                        )}
                        <ul className={`divide-y ${t.divider}`}>
                          {cat.products.map((p) => (
                            <ProductRow
                              key={p.id}
                              p={p}
                              waBase={waBase}
                              businessName={business.name}
                              businessId={business.id}
                              categoryName={cat.name}
                              theme={theme}
                              useSecondary={customSecondary}
                              secondaryColor={secondaryColor}
                              secondaryTextColor={secondaryTextColor}
                            />
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        {waTop && (
          <button
            onClick={handleTopWhatsAppClick}
            className={customSecondary ? "fixed bottom-5 right-5 rounded-full px-4 py-3 text-sm font-medium shadow-lg" : "fixed bottom-5 right-5 rounded-full bg-emerald-600 hover:bg-emerald-500 px-4 py-3 text-sm font-medium text-white shadow-lg"}
            style={customSecondary ? { backgroundColor: secondaryColor, color: secondaryTextColor, borderColor: secondaryColor } : undefined}
          >
            WhatsApp
          </button>
        )}

        <footer className={`mt-10 border-t pt-6 text-sm opacity-80 ${t.footer}`}>
          {businessInfo.hours && (
            <div className="mb-6 text-base">
              <div className="font-medium mb-3 text-lg">Horarios de atención:</div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-base opacity-85">
                {Object.entries(businessInfo.hours).map(([day, hours]) => {
                  const label =
                    day === "monday"
                      ? "Lunes"
                      : day === "tuesday"
                      ? "Martes"
                      : day === "wednesday"
                      ? "Miércoles"
                      : day === "thursday"
                      ? "Jueves"
                      : day === "friday"
                      ? "Viernes"
                      : day === "saturday"
                      ? "Sábado"
                      : "Domingo";

                  let hoursLabel: string;
                  if (typeof hours === "string") {
                    hoursLabel = hours || "Cerrado";
                  } else if (Array.isArray(hours)) {
                    hoursLabel = hours.length ? hours.join(" - ") : "Cerrado";
                  } else if (hours && typeof hours === "object") {
                    const open = (hours as any).open || "";
                    const close = (hours as any).close || "";
                    hoursLabel = open || close ? `${open}${open && close ? " - " : ""}${close}` : "Cerrado";
                  } else {
                    hoursLabel = "Cerrado";
                  }

                  return (
                    <div key={day}>
                      <div className="capitalize font-medium">{label}</div>
                      <div className="opacity-80">{hoursLabel}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <p>
            Hecho con <span className="opacity-100">Nuvio</span> · <span className="font-mono">/m/{slug}</span>
          </p>
        </footer>
      </div>
    </div>
  );
}