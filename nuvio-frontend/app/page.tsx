// app/page.tsx
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4">
      <main className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900/60 px-8 py-10 shadow-xl">
        {/* Branding */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-8 w-8 rounded-xl bg-indigo-500 flex items-center justify-center text-xs font-bold">
            N
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">
              Nuvio Studio
            </p>
            <p className="text-xs text-slate-400">
              Menús digitales y NFC para comercios
            </p>
          </div>
        </div>

        {/* Texto principal */}
        <h1 className="text-3xl font-semibold tracking-tight mb-3">
          Panel de administración
        </h1>
        <p className="text-slate-300 mb-8 max-w-xl">
          Desde acá vas a poder gestionar tu comercio, categorías y productos
          para el menú digital que ven tus clientes.
        </p>

        {/* Botones */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full bg-indigo-500 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-400 transition-colors"
          >
            Iniciar sesión
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-full border border-slate-700 px-6 py-3 text-sm font-medium text-slate-100 hover:bg-slate-800 transition-colors"
          >
            Ir al dashboard
          </Link>
        </div>

        <p className="mt-6 text-xs text-slate-500">
          Tip: primero logueate desde la pantalla de{" "}
          <span className="font-medium text-slate-300">Login</span> y después
          probá entrar al dashboard.
        </p>
      </main>
    </div>
  );
}
