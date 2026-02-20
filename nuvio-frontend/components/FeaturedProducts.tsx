"use client";

import { useMemo } from "react";

type Theme = "dark" | "light" | "warm";

// ✅ Interfaz flexible que acepta cualquier producto
interface FeaturedProduct {
  id: number;
  name: string;
  price?: number | string | null;
  imageUrl?: string | null;
  [key: string]: any;  // Permite cualquier otra propiedad
}

function moneyArs(value: number | string) {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

export function FeaturedProducts({
  products,
  theme = "dark",
}: {
  products: FeaturedProduct[];
  theme?: Theme;
}) {
  const themeClasses = {
    dark: {
      card: "bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border-indigo-700/50",
      badge: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      productCard: "bg-slate-800/50 border-slate-700",
    },
    light: {
      card: "bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200",
      badge: "bg-yellow-100 text-yellow-800 border-yellow-300",
      productCard: "bg-white border-gray-200",
    },
    warm: {
      card: "bg-gradient-to-br from-amber-100 to-orange-100 border-amber-300",
      badge: "bg-yellow-200 text-amber-900 border-yellow-400",
      productCard: "bg-white border-amber-200",
    },
  };

  const t = themeClasses[theme];

  if (products.length === 0) return null;

  return (
    <section className={`rounded-2xl border overflow-hidden ${t.card} mb-6`}>
      <div className="px-4 py-3 border-b border-current/20">
        <div className="flex items-center gap-2">
          <span className="text-xl">⭐</span>
          <h2 className="text-lg font-bold">Productos Destacados</h2>
          <span className={`ml-auto text-xs px-2 py-1 rounded-full border ${t.badge}`}>
            {products.length} {products.length === 1 ? "producto" : "productos"}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {products.map((product) => {
            const priceLabel = product.price != null ? moneyArs(product.price) : null;

            return (
              <div
                key={product.id}
                className={`rounded-xl border p-4 ${t.productCard} hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start gap-3">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-16 w-16 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-lg bg-linear-to-br from-indigo-500/20 to-purple-500/20 shrink-0 flex items-center justify-center text-2xl">
                      ⭐
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{product.name}</div>
                    {priceLabel && (
                      <div className="mt-1 text-lg font-bold text-indigo-400">
                        {priceLabel}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}