"use client";

import { Card } from "@/components/ui/Card";

type Props = {
  slug: string;
  businessName: string;
};

export function QrMenuCard({ slug, businessName }: Props) {
  const qrPngUrl = `/api/menu/${slug}/qr.png`;

  const handlePrint = () => {
    const w = window.open("", "_blank");
    if (!w) return;

    w.document.write(`
      <html>
        <head><title>QR - ${businessName}</title></head>
        <body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
          <img src="${qrPngUrl}" style="width:320px;height:320px" />
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `);
    w.document.close();
  };

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Código QR del menú</h2>
          <p className="mt-1 text-sm text-slate-400">
            Escaneando este QR se abre <span className="font-mono">/m/{slug}</span>.
          </p>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
            >
              Imprimir QR
            </button>

            <a
              href={qrPngUrl}
              download={`qr-${slug}.png`}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
            >
              Descargar PNG
            </a>
          </div>
        </div>

        <div className="shrink-0 rounded-xl border border-slate-800 bg-slate-950 p-3">
          <img
            src={qrPngUrl}
            alt={`QR menú ${businessName}`}
            className="h-44 w-44 rounded-md"
          />
        </div>
      </div>
    </Card>
  );
}
