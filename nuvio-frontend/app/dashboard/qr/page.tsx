"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { notify } from "@/lib/notify";
import QRCode from "qrcode";

type StoredUser = { name: string; email: string };
type QRSize = "small" | "medium" | "large" | "xlarge";

const QR_SIZES = {
  small: { px: 256, label: "Pequeño (256px)" },
  medium: { px: 512, label: "Mediano (512px)" },
  large: { px: 768, label: "Grande (768px)" },
  xlarge: { px: 1024, label: "Extra Grande (1024px)" },
};

export default function QRPage() {
  const router = useRouter();
  
  const [user, setUser] = useState<StoredUser | null>(null);
  const [slug, setSlug] = useState<string>("");
  const [businessName, setBusinessName] = useState<string>("");
  
  // Personalización
  const [color, setColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [size, setSize] = useState<QRSize>("medium");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const raw = localStorage.getItem("nuvio_user");
    if (!raw) return router.replace("/login");

    try {
      const u = JSON.parse(raw);
      setUser({ name: u.name, email: u.email });
      setSlug(localStorage.getItem("nuvio_business_slug") ?? "");
      setBusinessName(localStorage.getItem("nuvio_business_name") ?? "Mi Negocio");
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

  // Generar QR cuando cambian las opciones
  useEffect(() => {
    if (!slug) return;

    const publicUrl = `${window.location.origin}/m/${slug}`;
    const opts = {
      errorCorrectionLevel: "H" as const,
      margin: 2,
      width: QR_SIZES[size].px,
      color: {
        dark: color,
        light: bgColor,
      },
    };

    QRCode.toDataURL(publicUrl, opts)
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("Error generando QR:", err));
  }, [slug, color, bgColor, size]);

  const handleDownloadPNG = () => {
    if (!qrDataUrl) return;

    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `qr-${slug}-${QR_SIZES[size].px}px.png`;
    link.click();

    notify.success("QR descargado ✅");
  };

  const handleDownloadSVG = async () => {
    if (!slug) return;

    try {
      const publicUrl = `${window.location.origin}/m/${slug}`;
      const svgString = await QRCode.toString(publicUrl, {
        type: "svg",
        errorCorrectionLevel: "H",
        margin: 2,
        width: QR_SIZES[size].px,
        color: {
          dark: color,
          light: bgColor,
        },
      });

      const blob = new Blob([svgString], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `qr-${slug}.svg`;
      link.click();
      URL.revokeObjectURL(url);

      notify.success("SVG descargado ✅");
    } catch (err) {
      notify.error("Error descargando SVG");
      console.error(err);
    }
  };

  const handlePrint = () => {
    const w = window.open("", "_blank");
    if (!w) {
      notify.error("No se pudo abrir ventana de impresión");
      return;
    }

    w.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR - ${businessName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              background: #f5e2b4;
            }
            .container {
              background: #000;
              color: #fff;
              padding: 3rem;
              border-radius: 1rem;
              text-align: center;
              max-width: 500px;
            }
            h1 { font-size: 2rem; margin-bottom: 0.5rem; }
            .subtitle { font-size: 0.875rem; margin-bottom: 2rem; opacity: 0.9; }
            .qr-container {
              background: white;
              padding: 1.5rem;
              border-radius: 0.5rem;
              display: inline-block;
            }
            .qr-container img { display: block; width: 300px; height: 300px; }
            .instructions {
              margin-top: 2rem;
              font-size: 0.75rem;
              line-height: 1.6;
              opacity: 0.9;
            }
            .url { font-weight: bold; color: #fbbf24; }
            @media print {
              body { background: white; }
              .container { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${businessName}</h1>
            <div class="subtitle">ESCANEA EL QR</div>
            
            <div class="qr-container">
              <img src="${qrDataUrl}" alt="QR Menu" />
            </div>
            
            <div class="instructions">
              Ingresá a nuestro Menú Digital<br/>
              visitando <span class="url">/m/${slug}</span><br/>
              o escaneando el código desde tu celular
            </div>
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => window.print(), 500);
            };
          </script>
        </body>
      </html>
    `);
    w.document.close();
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/m/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      notify.success("Link copiado ✅");
    } catch {
      notify.error("No se pudo copiar el link");
    }
  };

  if (!user || !slug) return null;

  return (
    <PageShell>
      <PageHeader
        title="QR del Menú"
        subtitle="Generá, personalizá y descargá el código QR de tu menú digital"
        user={user}
        onLogout={handleLogout}
      />

      <main className="space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="text-sm text-indigo-300 hover:text-indigo-200 underline">
            ← Volver al dashboard
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Panel izquierdo: Personalización */}
          <div className="space-y-6">
            {/* Opciones de personalización */}
            <Card>
              <h2 className="text-sm font-semibold text-slate-100 mb-4">Personalización</h2>

              <div className="space-y-4">
                {/* Tamaño */}
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Tamaño</label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value as QRSize)}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                  >
                    {Object.entries(QR_SIZES).map(([key, { label }]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Color del QR */}
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Color del QR</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="h-10 w-20 rounded border border-slate-700 bg-slate-800 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="flex-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                {/* Color de fondo */}
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Color de fondo</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="h-10 w-20 rounded border border-slate-700 bg-slate-800 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="flex-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                {/* Presets */}
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Presets rápidos</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setColor("#000000");
                        setBgColor("#FFFFFF");
                      }}
                      className="px-3 py-1.5 text-xs rounded border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                    >
                      Clásico
                    </button>
                    <button
                      onClick={() => {
                        setColor("#6366f1");
                        setBgColor("#FFFFFF");
                      }}
                      className="px-3 py-1.5 text-xs rounded border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                    >
                      Indigo
                    </button>
                    <button
                      onClick={() => {
                        setColor("#10b981");
                        setBgColor("#FFFFFF");
                      }}
                      className="px-3 py-1.5 text-xs rounded border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                    >
                      Verde
                    </button>
                    <button
                      onClick={() => {
                        setColor("#f59e0b");
                        setBgColor("#000000");
                      }}
                      className="px-3 py-1.5 text-xs rounded border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                    >
                      Ámbar
                    </button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Información del menú */}
            <Card>
              <h2 className="text-sm font-semibold text-slate-100 mb-3">Información</h2>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-slate-400">Negocio:</span>{" "}
                  <span className="text-slate-100 font-medium">{businessName}</span>
                </div>
                <div>
                  <span className="text-slate-400">Slug:</span>{" "}
                  <span className="text-slate-100 font-mono">/m/{slug}</span>
                </div>
                <div>
                  <span className="text-slate-400">URL completa:</span>
                  <div className="mt-1 rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-300 font-mono break-all">
                    {typeof window !== "undefined" && `${window.location.origin}/m/${slug}`}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Panel derecho: Preview y acciones */}
          <div className="space-y-6">
            {/* Preview */}
            <Card>
              <h2 className="text-sm font-semibold text-slate-100 mb-4">Preview</h2>
              
              <div className="flex justify-center">
                {qrDataUrl ? (
                  <div 
                    className="rounded-xl border-2 border-slate-700 p-4"
                    style={{ backgroundColor: bgColor }}
                  >
                    <img
                      src={qrDataUrl}
                      alt={`QR ${businessName}`}
                      className="w-64 h-64"
                    />
                  </div>
                ) : (
                  <div className="w-64 h-64 rounded-xl border-2 border-slate-700 bg-slate-800 flex items-center justify-center">
                    <span className="text-sm text-slate-400">Generando...</span>
                  </div>
                )}
              </div>

              <div className="mt-4 text-center text-xs text-slate-400">
                Tamaño: {QR_SIZES[size].px}x{QR_SIZES[size].px}px
              </div>
            </Card>

            {/* Acciones */}
            <Card>
              <h2 className="text-sm font-semibold text-slate-100 mb-4">Acciones</h2>
              
              <div className="space-y-2">
                <button
                  onClick={handleDownloadPNG}
                  disabled={!qrDataUrl}
                  className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2.5 text-sm font-medium text-white"
                >
                  📥 Descargar PNG
                </button>

                <button
                  onClick={handleDownloadSVG}
                  disabled={!qrDataUrl}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-50"
                >
                  📥 Descargar SVG
                </button>

                <button
                  onClick={handlePrint}
                  disabled={!qrDataUrl}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-50"
                >
                  🖨️ Imprimir QR
                </button>

                <button
                  onClick={handleCopyLink}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-800"
                >
                  🔗 Copiar link del menú
                </button>
              </div>
            </Card>

            {/* Tips */}
            <Card>
              <h2 className="text-sm font-semibold text-slate-100 mb-3">💡 Tips</h2>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>• Usá colores con buen contraste para mejor escaneo</li>
                <li>• El formato SVG es ideal para impresiones grandes</li>
                <li>• Probá el QR con varios celulares antes de imprimir</li>
                <li>• Los QR oscuros sobre fondo claro escanean mejor</li>
              </ul>
            </Card>
          </div>
        </div>
      </main>
    </PageShell>
  );
}