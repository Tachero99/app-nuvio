// app/dashboard/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";

import {
  getMyBusiness,
  getMenuBySlug,
  getMyShareInfo,
  updateMyBusiness,
  type ShareInfo,
} from "@/lib/api";

import { publicMenuUrl } from "@/lib/share";
import { notify } from "@/lib/notify";

import { ShareMenuCard } from "@/components/share/ShareMenuCard";
import { QrMenuCard } from "@/components/share/QrMenuCard";

interface StoredUser {
  id: number;
  name: string;
  email: string;
  role: string;
  status?: string;
}

type Business = {
  id: number;
  name: string;
  slug: string;
  address: string | null;
  whatsapp?: string | null;
  isActive?: boolean;
};

function ShareAndQrSection({
  business,
  share,
}: {
  business: Business | null;
  share: ShareInfo | null;
}) {
  if (!business?.slug) return null;

  const message = share?.message;
  const whatsapp = share?.whatsapp ?? business.whatsapp ?? null;

  return (
    <>
      <ShareMenuCard
        businessName={business.name}
        slug={business.slug}
        whatsapp={whatsapp}
        message={message}
      />
      <QrMenuCard businessName={business.name} slug={business.slug} />
    </>
  );
}

export default function DashboardPage() {
  const router = useRouter();

  const [hydrated, setHydrated] = useState(false);

  const [user, setUser] = useState<StoredUser | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [menu, setMenu] = useState<any>(null);
  const [share, setShare] = useState<ShareInfo | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ editor B.3
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editWhatsapp, setEditWhatsapp] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);

  //////////////////////////////// posible linea para borrar
  const canToggleBusiness = user?.role === "SUPERADMIN";
  //////////////////////////////////////
  
  const publicUrl = useMemo(() => {
    return business?.slug ? publicMenuUrl(business.slug) : null;
  }, [business?.slug]);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const raw = window.localStorage.getItem("nuvio_user");
    if (!raw) {
      router.replace("/login");
      return;
    }

    try {
      const u = JSON.parse(raw) as StoredUser;
      setUser(u);
    } catch (e) {
      console.error("Error leyendo nuvio_user:", e);
      router.replace("/login");
    }
  }, [hydrated, router]);

  async function loadAll() {
    try {
      setLoading(true);
      setError(null);

      const b = await getMyBusiness();
      setBusiness(b);

      // cache
      window.localStorage.setItem("nuvio_business_slug", b.slug);
      window.localStorage.setItem("nuvio_business_id", String(b.id));
      window.localStorage.setItem("nuvio_business_name", b.name);

      const m = await getMenuBySlug(b.slug);
      setMenu(m);

      try {
        const s = await getMyShareInfo();
        setShare(s);
      } catch (e) {
        console.warn("No se pudo cargar share info:", e);
        setShare(null);
      }

      // ✅ inicializar editor
      setEditName(b.name ?? "");
      setEditSlug(b.slug ?? "");
      setEditAddress(b.address ?? "");
      setEditWhatsapp(b.whatsapp ?? "");
      setEditIsActive(b.isActive ?? true);
    } catch (e) {
      console.error(e);
      setError("No se pudo cargar el negocio o el menú.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!hydrated) return;
    if (!user) return;

    // si es superadmin, mandalo al panel admin
    if (user.role === "SUPERADMIN") {
      router.replace("/admin");
      return;
    }

    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, user, router]);

  const handleLogout = () => {
    window.localStorage.removeItem("nuvio_user");
    window.localStorage.removeItem("nuvio_token");
    window.localStorage.removeItem("nuvio_business_slug");
    window.localStorage.removeItem("nuvio_business_id");
    window.localStorage.removeItem("nuvio_business_name");
    router.replace("/login");
  };

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      notify.success("Copiado ✅");
    } catch {
      notify.error("No se pudo copiar.");
    }
  }

  async function onSaveBusiness() {
    if (!business) return;

    const name = editName.trim();
    const slug = editSlug.trim();

    if (!name) return notify.error("El nombre no puede estar vacío.");
    if (!slug) return notify.error("El slug no puede estar vacío.");

    try {
      setSaving(true);
      setError(null);

      const payload: any = {
        name,
        slug,
        address: editAddress.trim() ? editAddress.trim() : null,
        whatsapp: editWhatsapp.trim() ? editWhatsapp.trim() : null,
      };

      // ✅ solo SUPERADMIN puede tocar isActive
      if (canToggleBusiness) payload.isActive = !!editIsActive;

      await updateMyBusiness(payload);

      notify.success("Negocio actualizado ✅");
      setEditMode(false);
      await loadAll();
    } catch (e: any) {
      console.error(e);
      const msg = e?.message || "No se pudo guardar.";
      setError(msg);
      notify.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function toggleBusinessActive() {
    if (!business) return;
    if (!canToggleBusiness) return;

    const next = !(business.isActive ?? true);

    try {
      setSaving(true);
      setError(null);

      await updateMyBusiness({ isActive: next } as any);

      notify.success(next ? "Negocio activado ✅" : "Negocio desactivado ✅");
      await loadAll();
    } catch (e: any) {
      const msg = e?.message || "No se pudo cambiar el estado del negocio.";
      setError(msg);
      notify.error(msg);
    } finally {
      setSaving(false);
    }
  }

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <p className="text-sm text-slate-300">Cargando…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="space-y-3 text-center">
          <p className="text-sm text-slate-300">Redirigiendo al login…</p>
          <Link href="/login" className="text-indigo-400 underline hover:text-indigo-300">
            Ir al login
          </Link>
        </div>
      </div>
    );
  }

  const activeBadge =
    (business?.isActive ?? true)
      ? "border-emerald-800 bg-emerald-950/40 text-emerald-200"
      : "border-red-800 bg-red-950/40 text-red-200";

  return (
    <PageShell>
      <PageHeader
        title="Dashboard"
        subtitle="Panel de control del negocio"
        user={{ name: user.name, email: user.email }}
        onLogout={handleLogout}
      />

      <main className="space-y-6">
        {loading && (
          <Card>
            <p className="text-sm text-slate-300">Cargando...</p>
          </Card>
        )}

        {error && (
          <Card>
            <p className="text-sm text-red-400">{error}</p>
          </Card>
        )}

        {/* Negocio + B.3 */}
        <Card>
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm text-slate-200">
                  <span className="text-slate-400">Negocio:</span>{" "}
                  {business?.name ?? "(sin negocio)"}
                </div>

                <div className="mt-1 text-xs text-slate-400">
                  Slug:{" "}
                  <span className="font-mono bg-slate-900 px-1 py-0.5 rounded">
                    {business?.slug ?? "-"}
                  </span>
                </div>

                <div className="mt-2">
                  <span className={`inline-flex text-xs px-2 py-0.5 rounded-full border ${activeBadge}`}>
                    {business?.isActive ?? true ? "ACTIVO" : "INACTIVO"}
                  </span>
                </div>

                {publicUrl && (
                  <div className="mt-2 text-xs text-slate-400">
                    Link público:{" "}
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-400 underline hover:text-indigo-300"
                    >
                      {publicUrl}
                    </a>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {publicUrl ? (
                  <>
                    <button
                      onClick={() => copy(publicUrl)}
                      className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-2 text-sm font-medium text-white"
                    >
                      Copiar link
                    </button>
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
                    >
                      Ver menú
                    </a>
                  </>
                ) : null}

                {/* ✅ SOLO SUPERADMIN */}
                {canToggleBusiness ? (
                  <button
                    onClick={toggleBusinessActive}
                    disabled={saving}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-60"
                  >
                    {saving ? "..." : (business?.isActive ?? true) ? "Desactivar negocio" : "Activar negocio"}
                  </button>
                ) : null}

                <button
                  onClick={() => setEditMode((v) => !v)}
                  disabled={saving}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-60"
                >
                  {editMode ? "Cerrar edición" : "Editar negocio"}
                </button>

                <button
                  onClick={loadAll}
                  disabled={loading || saving}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-60"
                >
                  Refrescar
                </button>
              </div>
            </div>

            {editMode ? (
              <div className="grid gap-3 md:grid-cols-12 pt-2">
                <div className="md:col-span-4">
                  <label className="block text-xs text-slate-400 mb-1">Nombre</label>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="block text-xs text-slate-400 mb-1">Slug</label>
                  <input
                    value={editSlug}
                    onChange={(e) => setEditSlug(e.target.value)}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="block text-xs text-slate-400 mb-1">WhatsApp (opcional)</label>
                  <input
                    value={editWhatsapp}
                    onChange={(e) => setEditWhatsapp(e.target.value)}
                    placeholder="Ej: 54911..."
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="md:col-span-8">
                  <label className="block text-xs text-slate-400 mb-1">Dirección (opcional)</label>
                  <input
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="md:col-span-4 flex items-end gap-2">
                  {/* ✅ SOLO SUPERADMIN */}
                  {canToggleBusiness ? (
                    <label className="inline-flex items-center gap-2 text-sm text-slate-200">
                      <input
                        type="checkbox"
                        checked={editIsActive}
                        onChange={(e) => setEditIsActive(e.target.checked)}
                        className="h-4 w-4"
                      />
                      Negocio activo
                    </label>
                  ) : (
                    <div className="text-xs text-slate-500">
                      Estado del negocio:{" "}
                      <span className="font-mono text-slate-300">
                        {(business?.isActive ?? true) ? "ACTIVO" : "INACTIVO"}
                      </span>
                    </div>
                  )}

                  <button
                    onClick={onSaveBusiness}
                    disabled={saving}
                    className="ml-auto rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 px-4 py-2 text-sm font-medium text-white"
                  >
                    {saving ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </Card>

        <ShareAndQrSection business={business} share={share} />

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <h2 className="text-sm font-semibold text-slate-100">Administración</h2>
            <p className="mt-1 text-sm text-slate-400">Acá vas a cargar y mantener tu menú.</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/dashboard/categories"
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
              >
                ABM Categorías
              </Link>

              <Link
                href="/dashboard/products"
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
              >
                ABM Productos
              </Link>

              <Link 
                href="/dashboard/products/editor"
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800">
                Editor Masivo
              </Link>

              <Link
                href="/dashboard/settings"
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
              >
                Configuración del negocio
              </Link>
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-slate-100">Estado del menú</h2>
            <p className="mt-1 text-sm text-slate-400">
              Resumen rápido para chequear que todo está trayendo bien.
            </p>

            <div className="mt-3 text-sm text-slate-200 space-y-1">
              <div>
                Categorías:{" "}
                <span className="text-slate-300">{menu?.categories?.length ?? 0}</span>
              </div>
              <div>
                Productos sin categoría:{" "}
                <span className="text-slate-300">{menu?.ungroupedProducts?.length ?? 0}</span>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </PageShell>
  );
}
