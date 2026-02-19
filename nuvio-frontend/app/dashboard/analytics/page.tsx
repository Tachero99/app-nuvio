"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { notify } from "@/lib/notify";

type StoredUser = { name: string; email: string };

type AnalyticsSummary = {
  totalViews: number;
  viewsToday: number;
  viewsLast7Days: number;
  viewsLast30Days: number;
  totalClicks: number;
  clicksLast7Days: number;
};

type TopProduct = {
  productId: number;
  productName: string;
  clicks: number;
};

type ViewByDay = {
  date: string;
  count: number;
};

export default function AnalyticsPage() {
  const router = useRouter();

  const [user, setUser] = useState<StoredUser | null>(null);
  const [businessId, setBusinessId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [viewsByDay, setViewsByDay] = useState<ViewByDay[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const raw = localStorage.getItem("nuvio_user");
    if (!raw) return router.replace("/login");

    try {
      const u = JSON.parse(raw);
      setUser({ name: u.name, email: u.email });

      const bizId = localStorage.getItem("nuvio_business_id");
      if (bizId) setBusinessId(Number(bizId));
    } catch {
      router.replace("/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("nuvio_user");
    localStorage.removeItem("nuvio_token");
    localStorage.removeItem("nuvio_business_slug");
    localStorage.removeItem("nuvio_business_id");
    localStorage.removeItem("nuvio_business_name");
    router.push("/login");
  };

  async function loadAnalytics() {
    if (!businessId) return;

    try {
      setLoading(true);

      const token = localStorage.getItem("nuvio_token");
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

      const res = await fetch(`${apiBase}/api/analytics/business/${businessId}/summary`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Error cargando analytics");

      const data = await res.json();
      setSummary(data.summary);
      setTopProducts(data.topProducts || []);
      setViewsByDay(data.viewsByDay || []);
    } catch (e: any) {
      notify.error(e?.message || "Error cargando estadísticas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user || !businessId) return;
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, businessId]);

  if (!user) return null;

  return (
    <PageShell>
      <PageHeader
        title="Analytics"
        subtitle="Estadísticas de visitas y clicks en tu menú"
        user={user}
        onLogout={handleLogout}
      />

      <main className="space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="text-sm text-indigo-300 hover:text-indigo-200 underline">
            ← Volver al dashboard
          </Link>

          <button
            onClick={loadAnalytics}
            disabled={loading}
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "Cargando..." : "Refrescar"}
          </button>
        </div>

        {!summary ? (
          <Card>
            <p className="text-sm text-slate-400 text-center py-8">
              {loading ? "Cargando estadísticas..." : "No hay datos disponibles"}
            </p>
          </Card>
        ) : (
          <>
            {/* Resumen principal */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <div className="text-xs text-slate-400">Visitas Totales</div>
                <div className="text-2xl font-semibold text-slate-100 mt-1">{summary.totalViews}</div>
                <div className="text-xs text-slate-500 mt-1">Desde el inicio</div>
              </Card>

              <Card>
                <div className="text-xs text-slate-400">Hoy</div>
                <div className="text-2xl font-semibold text-emerald-400 mt-1">{summary.viewsToday}</div>
                <div className="text-xs text-slate-500 mt-1">Visitas de hoy</div>
              </Card>

              <Card>
                <div className="text-xs text-slate-400">Últimos 7 días</div>
                <div className="text-2xl font-semibold text-indigo-400 mt-1">{summary.viewsLast7Days}</div>
                <div className="text-xs text-slate-500 mt-1">Visitas esta semana</div>
              </Card>

              <Card>
                <div className="text-xs text-slate-400">Últimos 30 días</div>
                <div className="text-2xl font-semibold text-purple-400 mt-1">{summary.viewsLast30Days}</div>
                <div className="text-xs text-slate-500 mt-1">Visitas este mes</div>
              </Card>
            </div>

            {/* Clicks en WhatsApp */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <div className="text-xs text-slate-400">Total Clicks WhatsApp</div>
                <div className="text-2xl font-semibold text-slate-100 mt-1">{summary.totalClicks}</div>
                <div className="text-xs text-slate-500 mt-1">Todos los productos</div>
              </Card>

              <Card>
                <div className="text-xs text-slate-400">Clicks (últimos 7 días)</div>
                <div className="text-2xl font-semibold text-emerald-400 mt-1">{summary.clicksLast7Days}</div>
                <div className="text-xs text-slate-500 mt-1">Esta semana</div>
              </Card>
            </div>

            {/* Productos más clickeados */}
            <Card>
              <h2 className="text-sm font-semibold text-slate-100 mb-4">
                🔥 Productos más clickeados (Top 10)
              </h2>

              {topProducts.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">
                  Todavía no hay clicks en productos
                </p>
              ) : (
                <div className="space-y-2">
                  {topProducts.map((product, index) => (
                    <div
                      key={product.productId}
                      className="flex items-center justify-between rounded-lg bg-slate-800/50 px-4 py-3 border border-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-950 text-indigo-300 text-sm font-semibold">
                          {index + 1}
                        </div>
                        <span className="text-sm text-slate-100">{product.productName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-emerald-400">{product.clicks}</span>
                        <span className="text-xs text-slate-400">clicks</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Gráfico simple de vistas por día */}
            <Card>
              <h2 className="text-sm font-semibold text-slate-100 mb-4">
                📊 Visitas por día (últimos 30 días)
              </h2>

              {viewsByDay.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No hay datos de visitas</p>
              ) : (
                <div className="space-y-1">
                  {viewsByDay.map((day) => {
                    const maxViews = Math.max(...viewsByDay.map((d) => d.count));
                    const percentage = (day.count / maxViews) * 100;

                    return (
                      <div key={day.date} className="flex items-center gap-3">
                        <div className="text-xs text-slate-400 w-24 shrink-0">
                          {new Date(day.date).toLocaleDateString("es-AR", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </div>
                        <div className="flex-1 bg-slate-800 rounded-full h-6 overflow-hidden">
                          <div
                            className="bg-linear-to-r from-indigo-600 to-purple-600 h-full flex items-center justify-end px-2"
                            style={{ width: `${percentage}%` }}
                          >
                            <span className="text-xs text-white font-medium">{day.count}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Info adicional */}
            <Card>
              <div className="space-y-2 text-sm">
                <h3 className="font-semibold text-slate-100">💡 ¿Cómo funciona?</h3>
                <ul className="space-y-1 text-slate-400">
                  <li>• Las visitas se registran cada vez que alguien abre tu menú público</li>
                  <li>• Los clicks se registran cuando alguien presiona "Pedir por WhatsApp"</li>
                  <li>• Los datos se actualizan en tiempo real</li>
                  <li>• Las estadísticas son privadas y solo vos podés verlas</li>
                </ul>
              </div>
            </Card>
          </>
        )}
      </main>
    </PageShell>
  );
}