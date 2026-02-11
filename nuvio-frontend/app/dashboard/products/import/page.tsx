// app/dashboard/products/import/page.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/Card";

import { notify } from "@/lib/notify";
import { ensureBusinessCtx } from "@/lib/api";

type PreviewRow = {
  categoryName: string;
  sectionName: string | null;
  productName: string;
  price: number | null;
  description: string | null;
};

type Summary = {
  totalRows: number;
  validRows: number;
  errors: string[];
  categoriesToCreate: string[];
  categoriesToUpdate: string[];
  productsToCreate: string[];
  productsToUpdate: string[];
};

export default function ImportProductsPage() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Upload, 2: Preview, 3: Result

  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001",
    []
  );

  const resetAll = () => {
    setFile(null);
    setPreview([]);
    setSummary(null);
    setStep(1);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    setFile(f);
    setPreview([]);
    setSummary(null);
    setStep(1);
  };

  const downloadTemplate = () => {
    const csvContent = `categoria,seccion,producto,precio,descripcion
Pizzas,Clásicas,Pizza Muzzarella,2500,Pizza con muzzarella y salsa de tomate
Pizzas,Clásicas,Pizza Napolitana,2800,Pizza con tomate ajo y albahaca
Pizzas,Especiales,Pizza Calabresa,3200,Pizza con salame picante
Bebidas,,Coca Cola 500ml,800,Bebida gaseosa
Bebidas,,Agua Mineral,500,Agua sin gas
Postres,,Flan Casero,1200,Flan con dulce de leche`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "plantilla-productos-nuvio.csv";
    link.click();
  };

  const handleUpload = async () => {
    if (!file) {
      notify.error("Seleccioná un archivo primero");
      return;
    }

    setLoading(true);
    try {
      const business = await ensureBusinessCtx();
      const token = localStorage.getItem("nuvio_token");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${apiBase}/api/business/${business.id}/products/import`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Error procesando archivo");
      }

      const data = await response.json();

      setPreview(data.preview || []);
      setSummary(data.summary);
      setStep(2);
      notify.success("Archivo procesado exitosamente");
    } catch (err: any) {
      notify.error(err?.message || "Error al procesar archivo");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!summary) return;

    setLoading(true);
    try {
      const business = await ensureBusinessCtx();
      const token = localStorage.getItem("nuvio_token");

      const rows = preview.map((p) => ({
        categoryName: p.categoryName,
        sectionName: p.sectionName,
        productName: p.productName,
        price: p.price,
        description: p.description,
      }));

      const response = await fetch(
        `${apiBase}/api/business/${business.id}/products/import/confirm`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ rows }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Error confirmando importación");
      }

      const data = await response.json();
      notify.success(data.message);
      setStep(3);
    } catch (err: any) {
      notify.error(err?.message || "Error en la importación");
    } finally {
      setLoading(false);
    }
  };

  const StepPill = ({
    n,
    label,
    active,
    done,
  }: {
    n: 1 | 2 | 3;
    label: string;
    active: boolean;
    done: boolean;
  }) => (
    <div
      className={[
        "flex items-center gap-3",
        active ? "text-indigo-300" : "text-slate-500",
      ].join(" ")}
    >
      <div
        className={[
          "flex items-center justify-center h-9 w-9 rounded-full border text-sm font-semibold",
          done
            ? "bg-emerald-950/40 border-emerald-800 text-emerald-200"
            : active
            ? "bg-indigo-600 border-indigo-500 text-white"
            : "bg-slate-900 border-slate-800 text-slate-400",
        ].join(" ")}
      >
        {done ? "✓" : String(n)}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );

  return (
    <PageShell>
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-100">
              Importar productos
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Cargá múltiples productos en un solo paso con un archivo CSV/Excel.
            </p>
          </div>

          <Link
            href="/dashboard/products"
            className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            ← Volver
          </Link>
        </div>
      </div>

      {/* Steps */}
      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <StepPill n={1} label="Subir archivo" active={step === 1} done={step > 1} />
          <div className="hidden md:block h-px flex-1 bg-slate-800 mx-4" />
          <StepPill n={2} label="Preview" active={step === 2} done={step > 2} />
          <div className="hidden md:block h-px flex-1 bg-slate-800 mx-4" />
          <StepPill n={3} label="Completado" active={step === 3} done={false} />
        </div>
      </Card>

      <main className="mt-6 space-y-6">
        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Instrucciones: blanco, premium */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 p-5 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">
                      ℹ️
                    </span>
                    <h3 className="text-base font-semibold text-slate-900">
                      Instrucciones
                    </h3>
                  </div>

                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    <li className="flex gap-2">
                      <span className="mt-0.5 text-indigo-600">•</span>
                      Descargá la plantilla y completala con tus productos.
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-0.5 text-indigo-600">•</span>
                      Guardá el archivo como CSV o Excel.
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-0.5 text-indigo-600">•</span>
                      Subilo, revisá el preview y confirmá la importación.
                    </li>
                  </ul>
                </div>

                <div className="shrink-0">
                  <button
                    onClick={downloadTemplate}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
                  >
                    ⬇️ Descargar plantilla CSV
                  </button>
                  <p className="mt-2 text-xs text-slate-500">
                    Tip: podés abrirla en Excel o Google Sheets.
                  </p>
                </div>
              </div>
            </div>

            {/* Upload: blanco, premium */}
            <Card>
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/90 p-10 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-slate-200">
                  <span className="text-2xl">☁️</span>
                </div>

                <label className="inline-flex cursor-pointer">
                  <span className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">
                    Seleccionar archivo
                  </span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {file ? (
                  <div className="mt-4 text-sm text-slate-700">
                    Archivo seleccionado:{" "}
                    <span className="font-mono rounded-md bg-slate-100 px-2 py-1 text-slate-900 ring-1 ring-slate-200">
                      {file.name}
                    </span>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-600">
                    Excel (.xlsx, .xls) o CSV — tamaño recomendado hasta 5MB
                  </p>
                )}

                <p className="mt-2 text-xs text-slate-500">
                  Tamaño recomendado: hasta 5MB
                </p>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                <button
                  onClick={resetAll}
                  disabled={!file || loading}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Limpiar
                </button>

                <button
                  onClick={handleUpload}
                  disabled={loading || !file}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
                >
                  {loading ? "Procesando..." : "Procesar archivo →"}
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && summary && (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <div className="text-xs text-slate-400">Total filas</div>
                <div className="mt-1 text-2xl font-semibold text-slate-100">
                  {summary.totalRows}
                </div>
              </Card>

              <Card>
                <div className="text-xs text-slate-400">Filas válidas</div>
                <div className="mt-1 text-2xl font-semibold text-emerald-200">
                  {summary.validRows}
                </div>
              </Card>

              <Card>
                <div className="text-xs text-slate-400">Categorías nuevas</div>
                <div className="mt-1 text-2xl font-semibold text-indigo-200">
                  {summary.categoriesToCreate.length}
                </div>
              </Card>

              <Card>
                <div className="text-xs text-slate-400">Productos nuevos</div>
                <div className="mt-1 text-2xl font-semibold text-indigo-200">
                  {summary.productsToCreate.length}
                </div>
              </Card>
            </div>

            {/* Errors */}
            {summary.errors.length > 0 && (
              <Card>
                <div className="rounded-xl border border-red-900/60 bg-red-950/20 p-4">
                  <h3 className="text-sm font-semibold text-red-200">
                    ⚠️ Errores encontrados
                  </h3>
                  <ul className="mt-2 space-y-1 text-sm text-red-200/80">
                    {summary.errors.map((err, idx) => (
                      <li key={idx}>• {err}</li>
                    ))}
                  </ul>
                </div>
              </Card>
            )}

            {/* Preview table */}
            <Card>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">
                    Vista previa
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    {preview.length} productos (revisá antes de confirmar).
                  </p>
                </div>

                <div className="text-xs text-slate-500">
                  Tip: corregí el CSV si hace falta y volvé a subir.
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-slate-900/60">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-300">
                          Categoría
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-300">
                          Producto
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-300">
                          Precio
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-300">
                          Descripción
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-800 bg-slate-950/30">
                      {preview.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/30">
                          <td className="px-5 py-3 text-sm text-slate-200">
                            {row.categoryName}
                          </td>
                          <td className="px-5 py-3 text-sm font-medium text-slate-100">
                            {row.productName}
                          </td>
                          <td className="px-5 py-3 text-sm text-slate-200">
                            {row.price !== null
                              ? `$${Number(row.price).toLocaleString()}`
                              : "-"}
                          </td>
                          <td className="px-5 py-3 text-sm text-slate-400">
                            {row.description || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  onClick={resetAll}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
                >
                  ← Cancelar
                </button>

                <button
                  onClick={handleConfirm}
                  disabled={loading || summary.validRows === 0}
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 px-5 py-2 text-sm font-medium text-white"
                >
                  {loading ? "Importando..." : `Confirmar (${summary.validRows})`}
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="max-w-2xl mx-auto">
            <Card>
              <div className="py-10 text-center">
                <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-2xl border border-emerald-800 bg-emerald-950/40">
                  <svg
                    className="h-7 w-7 text-emerald-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>

                <h2 className="mt-5 text-xl font-semibold text-slate-100">
                  ¡Importación completada!
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Los productos se importaron correctamente en tu menú.
                </p>

                <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
                  <Link
                    href="/dashboard/products"
                    className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-sm font-medium text-white"
                  >
                    Ver productos
                  </Link>

                  <button
                    onClick={resetAll}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-5 py-2 text-sm text-slate-200 hover:bg-slate-800"
                  >
                    Importar más
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>
    </PageShell>
  );
}
