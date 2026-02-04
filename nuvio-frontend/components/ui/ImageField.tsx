"use client";

import { useState } from "react";
import { notify } from "@/lib/notify";

type Props = {
  label: string;
  value: string;                 // imageUrl
  onChange: (url: string) => void;
  hint?: string;
};

async function uploadToBackend(file: File): Promise<string> {
  // ✅ Pega al proxy de Next -> backend
  // Backend debe aceptar multipart en POST /api/upload y devolver { url: "https://..." }
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Upload falló: HTTP ${res.status} ${text}`);
  }

  const data = (await res.json()) as { url?: string };
  if (!data.url) throw new Error("Upload falló: no vino 'url' en la respuesta.");
  return data.url;
}

export function ImageField({ label, value, onChange, hint }: Props) {
  const [uploading, setUploading] = useState(false);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const url = await uploadToBackend(file);
      onChange(url);
      notify.success("Imagen subida ✅");
    } catch (err: any) {
      notify.error(err?.message || "No se pudo subir la imagen.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="block text-sm text-slate-300">{label}</label>
        {uploading ? (
          <span className="text-xs text-slate-400">Subiendo...</span>
        ) : null}
      </div>

      <div className="grid gap-2 md:grid-cols-12">
        <input
          className="md:col-span-8 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Pegá URL (https://...) o subí archivo"
        />

        <label className="md:col-span-4 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 cursor-pointer">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPickFile}
            disabled={uploading}
          />
          Subir imagen
        </label>
      </div>

      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}

      {value?.trim() ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
          <div className="text-xs text-slate-400 mb-2">Preview</div>
          <img
            src={value}
            alt="preview"
            className="h-28 w-28 rounded-lg object-cover border border-slate-800"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
              notify.error("No pude cargar la imagen (URL inválida o bloqueada).");
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
