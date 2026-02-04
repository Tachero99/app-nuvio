"use client";

import { useRef, useState, useMemo } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { notify } from "@/lib/notify";
import { uploadImage } from "@/lib/upload";
import { resolveMediaUrl } from "@/lib/media";

const MySwal = withReactContent(Swal);

export function ImagePicker({
  label,
  value,
  onChange,
  hint,
}: {
  label?: string;
  value: string;
  onChange: (next: string) => void;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);

  const previewSrc = useMemo(() => resolveMediaUrl(value) ?? "", [value]);

  async function onPickUrl() {
    const res = await MySwal.fire({
      title: "Pegar link de imagen",
      input: "text",
      inputPlaceholder: "https://...",
      inputValue: value || "",
      showCancelButton: true,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
    });

    if (!res.isConfirmed) return;

    const next = String(res.value || "").trim();
    if (!next) return;

    onChange(next);
    notify.success("Imagen actualizada ✅");
  }

  async function onPickFile(file: File) {
    try {
      setLoading(true);
      const url = await uploadImage(file); // ideal: devuelve "/uploads/xxx.jpg"
      onChange(url);
      notify.success("Imagen subida ✅");
    } catch (e: any) {
      notify.error(e?.message || "No se pudo subir la imagen.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      {label ? <label className="block text-sm text-slate-300">{label}</label> : null}

      <div className="flex items-center gap-3">
        {value ? (
          <img
            src={previewSrc}
            alt="imagen"
            className="h-14 w-14 rounded-lg object-cover border border-slate-800"
          />
        ) : (
          <div className="h-14 w-14 rounded-lg border border-slate-800 bg-slate-900/40" />
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className="rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 px-3 py-2 text-sm font-medium text-white"
          >
            {loading ? "Subiendo..." : "Subir"}
          </button>

          <button
            type="button"
            onClick={onPickUrl}
            disabled={loading}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-60"
          >
            Pegar link
          </button>

          <button
            type="button"
            onClick={() => onChange("")}
            disabled={loading || !value}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-60"
          >
            Quitar
          </button>
        </div>
      </div>

      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return; // ✅ clave
          onPickFile(f);
        }}
      />
    </div>
  );
}
