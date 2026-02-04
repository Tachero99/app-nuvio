"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { loginRequest, getMyBusiness } from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("santi@example.com");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1) Login
      const data = await loginRequest(email, password);

      // (opcional) si tu backend devuelve status
      if (data.user.status === "INACTIVE") {
        throw new Error("Tu usuario está inactivo. Pedile al admin que lo active.");
      }

      // 2) SUPERADMIN -> panel admin (NO pedir negocio)
      if (data.user.role === "SUPERADMIN") {
        // opcional: limpiar datos de negocio viejos
        localStorage.removeItem("nuvio_business_slug");
        localStorage.removeItem("nuvio_business_id");

        router.push("/admin");
        return;
      }

      // 3) CLIENT_OWNER -> pedir negocio y seguir dashboard
      const business = await getMyBusiness();
      localStorage.setItem("nuvio_business_slug", business.slug);
      localStorage.setItem("nuvio_business_id", String(business.id));

      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
        <h1 className="text-2xl font-semibold text-white mb-1 text-center">
          Nuvio Studio
        </h1>
        <p className="text-slate-400 text-sm mb-6 text-center">
          Iniciá sesión para administrar tu negocio
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Email</label>
            <input
              type="email"
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-950/40 border border-red-800 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors px-3 py-2 text-sm font-medium text-white"
          >
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>

        <p className="mt-4 text-xs text-slate-500 text-center">
          ¿Todavía no tenés cuenta? (después hacemos la pantalla de registro)
        </p>
      </div>
    </div>
  );
}
