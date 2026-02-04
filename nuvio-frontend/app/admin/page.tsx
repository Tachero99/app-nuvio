"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";

import {
  adminListUsers,
  adminCreateUser,
  adminSetUserStatus,
  type AdminUser,
} from "@/lib/api";

import { notify } from "@/lib/notify";

type StoredUser = {
  id: number;
  name: string;
  email: string;
  role: "SUPERADMIN" | "CLIENT_OWNER";
  status?: string;
};

export default function AdminPage() {
  const router = useRouter();

  const [me, setMe] = useState<StoredUser | null>(null);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"CLIENT_OWNER" | "SUPERADMIN">("CLIENT_OWNER");
  const [creating, setCreating] = useState(false);

  const emailOk = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), [email]);
  const passwordOk = useMemo(() => password.trim().length >= 6, [password]);

  // Leer user local
  useEffect(() => {
    if (typeof window === "undefined") return;

    const raw = localStorage.getItem("nuvio_user");
    const token = localStorage.getItem("nuvio_token");

    if (!raw || !token) {
      router.replace("/login");
      return;
    }

    try {
      const u = JSON.parse(raw) as StoredUser;
      setMe(u);

      // 🔒 si no es superadmin, lo sacamos del admin
      if (u.role !== "SUPERADMIN") {
        router.replace("/dashboard");
      }
    } catch {
      router.replace("/login");
    }
  }, [router]);

  async function refresh() {
    try {
      setLoading(true);
      setErr(null);

      // api.ts ya devuelve AdminUser[] en tu implementación
      const list = await adminListUsers();
      setUsers(Array.isArray(list) ? list : []);
    } catch (e: any) {
      setErr(e?.message || "No se pudo cargar la lista.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!me) return;
    if (me.role !== "SUPERADMIN") return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  const handleLogout = () => {
    localStorage.removeItem("nuvio_user");
    localStorage.removeItem("nuvio_token");
    localStorage.removeItem("nuvio_business_slug");
    localStorage.removeItem("nuvio_business_id");
    localStorage.removeItem("nuvio_business_name");
    router.push("/login");
  };

  const handleCreate = async () => {
    const n = name.trim();
    const e = email.trim();
    const p = password.trim();

    if (!n || !e || !p) return notify.error("Completá nombre, email y password.");
    if (!emailOk) return notify.error("Email inválido.");
    if (p.length < 6) return notify.error("El password debe tener al menos 6 caracteres.");

    try {
      setCreating(true);
      setErr(null);

      await adminCreateUser({ name: n, email: e, password: p, role });

      setName("");
      setEmail("");
      setPassword("");
      setRole("CLIENT_OWNER");

      notify.success("Usuario creado ✅");
      await refresh();
    } catch (e: any) {
      const msg = e?.message || "Error creando usuario.";
      setErr(msg);
      notify.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const toggleStatus = async (u: AdminUser) => {
    const next = u.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      setErr(null);
      await adminSetUserStatus(u.id, next);
      notify.success(next === "ACTIVE" ? "Usuario activado ✅" : "Usuario desactivado ✅");
      await refresh();
    } catch (e: any) {
      const msg = e?.message || "Error cambiando estado.";
      setErr(msg);
      notify.error(msg);
    }
  };

  // mientras redirige
  if (!me) return null;

  // si entró un cliente a /admin, por si el replace tarda
  if (me.role !== "SUPERADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-center space-y-3">
          <p>No tenés permisos para ver Admin.</p>
          <Link className="text-indigo-400 underline" href="/dashboard">
            Volver al dashboard
          </Link>
        </div>
      </div>
    );
  }

  const canCreate = !!name.trim() && !!email.trim() && !!password.trim() && emailOk && passwordOk;

  return (
    <PageShell>
      <PageHeader
        title="Admin"
        subtitle="Crear usuarios, ver lista y activar/desactivar accesos."
        user={{ name: me.name, email: me.email }}
        onLogout={handleLogout}
      />

      <main className="space-y-6">
        {err && (
          <Card>
            <p className="text-sm text-red-400">{err}</p>
          </Card>
        )}

        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="text-sm text-indigo-300 hover:text-indigo-200 underline">
            ← Ir al dashboard
          </Link>

          <button
            onClick={refresh}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
          >
            Recargar
          </button>
        </div>

        <Card>
          <h2 className="text-sm font-semibold text-slate-100 mb-3">Crear usuario (solo SUPERADMIN)</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-slate-100"
              placeholder="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="space-y-1">
              <input
                className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-slate-100"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {!emailOk && email.trim() ? (
                <p className="text-xs text-red-400">Email inválido.</p>
              ) : null}
            </div>

            <div className="space-y-1">
              <input
                type="password"
                className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-slate-100"
                placeholder="Password (mín 6)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {!passwordOk && password.trim() ? (
                <p className="text-xs text-red-400">Mínimo 6 caracteres.</p>
              ) : null}
            </div>

            <select
              className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-slate-100"
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
            >
              <option value="CLIENT_OWNER">CLIENT_OWNER</option>
              <option value="SUPERADMIN">SUPERADMIN</option>
            </select>
          </div>

          <button
            onClick={handleCreate}
            disabled={creating || !canCreate}
            className="mt-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 px-4 py-2 text-sm font-medium text-white"
          >
            {creating ? "Creando..." : "Crear usuario"}
          </button>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-100">Usuarios</h2>
          </div>

          {loading ? (
            <p className="text-sm text-slate-300">Cargando...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-slate-400">No hay usuarios.</p>
          ) : (
            <div className="divide-y divide-slate-800">
              {users.map((u) => (
                <div key={u.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm text-slate-100 font-medium truncate">
                      {u.name} <span className="text-slate-400">({u.email})</span>
                    </div>
                    <div className="text-xs text-slate-400">
                      #{u.id} · {u.role} · {u.status}
                    </div>
                  </div>

                  <button
                    onClick={() => toggleStatus(u)}
                    className="shrink-0 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
                  >
                    {u.status === "ACTIVE" ? "Desactivar" : "Activar"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </PageShell>
  );
}
