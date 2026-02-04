"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";

import { ensureBusinessCtx, getMyBusiness, updateMyBusiness } from "@/lib/api";
import { notify } from "@/lib/notify";
import { publicMenuUrl } from "@/lib/share";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "")
    .replace(/\-+/g, "-");
}

type StoredUser = { name: string; email: string; role?: string };

export default function SettingsPage() {
  const router = useRouter();

  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [address, setAddress] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  useEffect(() => setHydrated(true), []);

  // auth + role guard
  useEffect(() => {
    if (!hydrated) return;

    const raw = localStorage.getItem("nuvio_user");
    const token = localStorage.getItem("nuvio_token");

    if (!raw || !token) {
      router.replace("/login");
      return;
    }

    try {
      const u = JSON.parse(raw) as StoredUser;

      // si es superadmin → admin
      if (u?.role === "SUPERADMIN") {
        router.replace("/admin");
        return;
      }

      setUser({ name: u.name, email: u.email, role: u.role });
    } catch {
      router.replace("/login");
    }
  }, [hydrated, router]);

  const publicUrl = useMemo(() => {
    const clean = slugify(slug);
    return clean ? publicMenuUrl(clean) : null;
  }, [slug]);

  const handleLogout = () => {
    localStorage.removeItem("nuvio_user");
    localStorage.removeItem("nuvio_token");
    localStorage.removeItem("nuvio_business_slug");
    localStorage.removeItem("nuvio_business_id");
    localStorage.removeItem("nuvio_business_name");
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

  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        // asegura ctx (si fuera superadmin, tira error)
        await ensureBusinessCtx();
        const b = await getMyBusiness();

        setName(b.name ?? "");
        setSlug(b.slug ?? "");
        setAddress(b.address ?? "");
        setWhatsapp((b as any).whatsapp ?? "");
      } catch (e: any) {
        setErr(e?.message || "No se pudo cargar la configuración");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  async function onSave() {
    const cleanName = name.trim();
    const cleanSlug = slugify(slug);
    const cleanAddress = address.trim() || null;
    const cleanWhatsapp = whatsapp.trim() || null;

    if (!cleanName) return notify.error("El nombre no puede estar vacío.");
    if (!cleanSlug) return notify.error("El slug no puede estar vacío.");

    try {
      setSaving(true);
      setErr(null);

      const updated = await updateMyBusiness({
        name: cleanName,
        slug: cleanSlug,
        address: cleanAddress,
        whatsapp: cleanWhatsapp,
      });

      setSlug(updated.slug); // por si normaliza
      notify.success("Guardado ✅");
    } catch (e: any) {
      const msg = e?.message || "Error guardando";
      setErr(msg);
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

  if (!user) return null;

  return (
    <PageShell>
      <PageHeader
        title="Configuración del negocio"
        subtitle="Nombre, slug público, WhatsApp y dirección."
        user={user}
        onLogout={handleLogout}
      />

      <main className="space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="text-indigo-400 underline hover:text-indigo-300 text-sm">
            ← Volver al dashboard
          </Link>

          {publicUrl ? (
            <button
              onClick={() => copy(publicUrl)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
            >
              Copiar link público
            </button>
          ) : null}
        </div>

        {err ? (
          <Card>
            <p className="text-sm text-red-400">{err}</p>
          </Card>
        ) : null}

        <Card>
          {loading ? (
            <p className="text-sm text-slate-300">Cargando...</p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Nombre</label>
                <input
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Sabores y Aromas"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">Slug público</label>
                <input
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="ej: sabores-y-aromas"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Link final: <span className="font-mono">/m/{slugify(slug)}</span>
                </p>
                {publicUrl ? (
                  <p className="mt-1 text-xs text-slate-500">
                    URL:{" "}
                    <a className="text-indigo-400 underline" href={publicUrl} target="_blank" rel="noreferrer">
                      {publicUrl}
                    </a>
                  </p>
                ) : null}
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">WhatsApp</label>
                <input
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="5491112345678"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Tip: formato internacional (Argentina: 549 + código de área + número).
                </p>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">Dirección</label>
                <input
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ej: Corrientes 2641, Martínez"
                />
              </div>

              <button
                onClick={onSave}
                disabled={saving}
                className="rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 px-4 py-2 text-sm font-medium text-white"
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          )}
        </Card>
      </main>
    </PageShell>
  );
}
