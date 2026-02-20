"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { ImagePicker } from "@/components/ui/ImagePicker";

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

const DAYS = [
  { key: "monday", label: "Lunes" },
  { key: "tuesday", label: "Martes" },
  { key: "wednesday", label: "Miércoles" },
  { key: "thursday", label: "Jueves" },
  { key: "friday", label: "Viernes" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
];

export default function SettingsPage() {
  const router = useRouter();

  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Campos básicos (existentes)
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [address, setAddress] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  // ✨ Campos nuevos del Módulo 4
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [website, setWebsite] = useState("");
  const [hours, setHours] = useState<Record<string, string>>({
    monday: "",
    tuesday: "",
    wednesday: "",
    thursday: "",
    friday: "",
    saturday: "",
    sunday: "",
  });
  const [primaryColor, setPrimaryColor] = useState("#6366f1");
  const [cardColor, setCardColor] = useState("#0f172a");
  const [secondaryColor, setSecondaryColor] = useState("#10b981");
  const [menuTheme, setMenuTheme] = useState<"dark" | "light" | "warm">("dark");

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

        await ensureBusinessCtx();
        const b = await getMyBusiness();

        // Campos básicos
        setName(b.name ?? "");
        setSlug(b.slug ?? "");
        setAddress(b.address ?? "");
        setWhatsapp((b as any).whatsapp ?? "");

        // ✨ Campos nuevos (si existen)
        setDescription((b as any).description ?? "");
        setLogo((b as any).logo ?? "");
        setInstagram((b as any).instagram ?? "");
        setFacebook((b as any).facebook ?? "");
        setWebsite((b as any).website ?? "");

        if ((b as any).hours) {
          setHours((b as any).hours);
        }

        if ((b as any).menuConfig) {
          setPrimaryColor((b as any).menuConfig.primaryColor || "#6366f1");
          setCardColor((b as any).menuConfig.cardColor || "#0f172a");
          setSecondaryColor((b as any).menuConfig.secondaryColor || "#10b981");
          setMenuTheme((b as any).menuConfig.theme || "dark");
        }
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
        // ✨ Campos nuevos del Módulo 4
        description: description.trim() || null,
        logo: logo.trim() || null,
        instagram: instagram.trim() || null,
        facebook: facebook.trim() || null,
        website: website.trim() || null,
        hours,
        menuConfig: {
          primaryColor,
          cardColor,
          secondaryColor,
          theme: menuTheme,
        },
      } as any);

      setSlug(updated.slug);
      
      // Actualizar localStorage
      localStorage.setItem("nuvio_business_name", cleanName);
      localStorage.setItem("nuvio_business_slug", updated.slug);
      
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
        subtitle="Personalización completa de tu menú digital"
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

        {loading ? (
          <Card>
            <p className="text-sm text-slate-300">Cargando...</p>
          </Card>
        ) : (
          <>
            {/* Información básica */}
            <Card>
              <h2 className="text-sm font-semibold text-slate-100 mb-4">Información Básica</h2>

              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Nombre del negocio *</label>
                    <input
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej: Sabores y Aromas"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Slug público *</label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-400">/m/</span>
                      <input
                        className="flex-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="ej: sabores-y-aromas"
                      />
                    </div>
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
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">WhatsApp</label>
                    <input
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="5491112345678"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Formato internacional (Argentina: 549 + código + número).
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
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-1">Descripción</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Contanos sobre tu negocio..."
                    rows={3}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <ImagePicker
                    label="Logo del negocio"
                    value={logo}
                    onChange={setLogo}
                    hint="Subí tu logo o pegá un link"
                  />
                </div>
              </div>
            </Card>

            {/* Redes sociales */}
            <Card>
              <h2 className="text-sm font-semibold text-slate-100 mb-4">Redes Sociales</h2>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Instagram</label>
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@tuusuario"
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-1">Facebook</label>
                  <input
                    type="text"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    placeholder="facebook.com/tupagina"
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-1">Sitio web</label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://tuweb.com"
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </Card>

            {/* Horarios */}
            <Card>
              <h2 className="text-sm font-semibold text-slate-100 mb-4">Horarios de Atención</h2>

              <div className="space-y-2">
                {DAYS.map((day) => (
                  <div key={day.key} className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-3 text-sm text-slate-300">{day.label}</div>
                    <div className="col-span-9">
                      <input
                        type="text"
                        value={hours[day.key] || ""}
                        onChange={(e) => setHours({ ...hours, [day.key]: e.target.value })}
                        placeholder="Ej: 9:00-18:00 o Cerrado"
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Personalización del menú */}
            <Card>
              <h2 className="text-sm font-semibold text-slate-100 mb-4">Apariencia del Menú</h2>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Color principal</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-10 w-20 rounded border border-slate-700 bg-slate-800 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-1">Color tarjetas</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={cardColor}
                      onChange={(e) => setCardColor(e.target.value)}
                      className="h-10 w-20 rounded border border-slate-700 bg-slate-800 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={cardColor}
                      onChange={(e) => setCardColor(e.target.value)}
                      className="flex-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-1">Color secundario (botones)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="h-10 w-20 rounded border border-slate-700 bg-slate-800 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="flex-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm text-slate-300 mb-1">Tema predeterminado</label>
                <select
                  value={menuTheme}
                  onChange={(e) => setMenuTheme(e.target.value as "dark" | "light" | "warm")}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                >
                  <option value="dark">Oscuro 🌙</option>
                  <option value="light">Claro ☀️</option>
                  <option value="warm">Personalizado 🎨</option>
                </select>
              </div>
            </Card>

            {/* Botón guardar */}
            <div className="flex justify-end">
              <button
                onClick={onSave}
                disabled={saving}
                className="rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 px-6 py-2 text-sm font-medium text-white"
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </>
        )}
      </main>
    </PageShell>
  );
}