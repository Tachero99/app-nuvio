"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { notify } from "@/lib/notify";
import { copyToClipboard, publicMenuUrl, waLink } from "@/lib/share";

type Props = {
  businessName?: string;
  slug: string;
  whatsapp?: string | null;
  message?: string; // opcional (si ya lo armás desde backend)
  baseUrl?: string; // opcional (si querés forzar dominio)
};

export function ShareMenuCard({
  businessName,
  slug,
  whatsapp,
  message,
  baseUrl,
}: Props) {
  const [copying, setCopying] = useState(false);

  const url = useMemo(() => publicMenuUrl(slug, baseUrl), [slug, baseUrl]);

  const waMessage = useMemo(() => {
    if (message?.trim()) return message;
    const name = businessName?.trim() || "mi negocio";
    return `Hola! Te comparto el menú de ${name}: ${url}`;
  }, [message, businessName, url]);

  async function onCopy() {
    try {
      setCopying(true);
      await copyToClipboard(url);
      notify.success("Link copiado ✅");
    } catch (e: any) {
      notify.error(e?.message || "No se pudo copiar el link.");
    } finally {
      setCopying(false);
    }
  }

  function onWhatsapp() {
    const link = waLink(whatsapp, waMessage);
    window.open(link, "_blank", "noopener,noreferrer");
  }

  return (
    <Card>
      <div className="space-y-3">
        <div>
          <div className="text-sm font-semibold text-slate-100">Compartir menú</div>
          <div className="text-xs text-slate-400">
            Copiá el link o mandalo por WhatsApp.
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2">
          <div className="text-xs text-slate-400 mb-1">Link público</div>
          <div className="text-sm text-slate-100 break-all font-mono">{url}</div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={onCopy}
            disabled={copying}
            className="rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 px-4 py-2 text-sm font-medium text-white"
          >
            {copying ? "Copiando..." : "Copiar link"}
          </button>

          <button
            onClick={onWhatsapp}
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            Compartir por WhatsApp
          </button>
        </div>

        {!whatsapp && (
          <p className="text-xs text-amber-300">
            Tip: agregá un WhatsApp en “Configuración” para que el botón mande directo al número.
          </p>
        )}
      </div>
    </Card>
  );
}
