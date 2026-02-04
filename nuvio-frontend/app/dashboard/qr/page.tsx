"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/Card";

export default function DashboardQrPage() {
  const [slug, setSlug] = useState<string>("");

  useEffect(() => {
    setSlug(localStorage.getItem("nuvio_business_slug") ?? "");
  }, []);

  const qrUrl = useMemo(() => (slug ? `/api/menu/${slug}/qr.png` : ""), [slug]);

  if (!slug) {
    return (
      <PageShell>
        <Card>
          <p className="text-sm text-slate-300">No encontré el slug del negocio. Volvé al dashboard y recargá.</p>
          <Link className="text-indigo-400 underline" href="/dashboard">Ir al dashboard</Link>
        </Card>
      </PageShell>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5e2b4] text-slate-900">
      <div className="border-b border-black bg-black py-3 text-center text-white font-semibold">
        Codigo QR MENU
      </div>

      <div className="mx-auto max-w-4xl px-6 py-6">
        <p className="text-center text-sm">
          El Siguiente Codigo QR pertenece a su <b>MENU DIGITAL</b>. Al escanearse o ingresar desde su link,
          se accederá directamente a su MENU. Puede compartirlo, hacerle captura, e imprimirlo.
        </p>

        <div className="mt-8 flex justify-center">
          <div className="w-105 rounded bg-black p-8 text-white shadow-2xl">
            <div className="text-center text-2xl font-bold">TU NEGOCIO</div>
            <div className="text-center text-sm mt-1">ESCANEA EL QR</div>

            <div className="mt-6 flex justify-center">
              <img src={qrUrl} alt="QR Menu" className="h-64 w-64 bg-white p-3" />
            </div>

            <div className="mt-6 text-center text-xs leading-5">
              Ingresa a nuestro Menu Digital <br />
              ingresando a <b>{`/m/${slug}`}</b> <br />
              O escaneando el codigo desde tu celular
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center print:hidden">
          <button
            onClick={() => window.print()}
            className="rounded-xl bg-green-600 px-8 py-3 font-semibold text-white shadow hover:bg-green-700"
          >
            IMPRIMIR QR
          </button>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}
