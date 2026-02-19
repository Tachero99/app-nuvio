"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";

import {
  listProductsBulk,
  updateProductsBulk,
  listCategories,
  type ProductWithCategory,
  type Category,
} from "@/lib/api";

import { notify } from "@/lib/notify";
import { resolveMediaUrl } from "@/lib/media";

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
type SortField = "name" | "price" | "stock" | "sortOrder";
type SortOrder = "asc" | "desc";

export default function BulkEditorPage() {
  const router = useRouter();

  // Auth
  const [user, setUser] = useState<{ role: string } | null>(null);

  // Data
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  // Filtros
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<number | "">("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sortField, setSortField] = useState<SortField>("sortOrder");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Selección múltiple
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Modales de acciones masivas
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [modalValue, setModalValue] = useState("");

  // Panel lateral (edición individual)
  const [editingProduct, setEditingProduct] = useState<ProductWithCategory | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    price: "",
    cost: "",
    stock: "",
    categoryId: "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
    description: "",
    imageUrl: "",
    sortOrder: "",
  });

  // Auth check
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("nuvio_user");
    if (!raw) return router.replace("/login");
    try {
      const u = JSON.parse(raw);
      setUser(u);
      if (u?.role === "SUPERADMIN") router.replace("/admin");
    } catch {
      router.replace("/login");
    }
  }, [router]);

  // Cargar datos inicial
  useEffect(() => {
    if (!user) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadData() {
    setLoading(true);
    try {
      const [productsData, categoriesData] = await Promise.all([listProductsBulk(), listCategories()]);
      setProducts(productsData.products);
      setCategories(categoriesData.categories);
    } catch (err: any) {
      notify.error(err.message || "Error cargando datos");
    } finally {
      setLoading(false);
    }
  }

  // Productos filtrados
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }

    if (categoryFilter !== "") {
      result = result.filter((p) => p.categoryId === categoryFilter);
    }

    if (statusFilter !== "ALL") {
      result = result.filter((p) => p.status === statusFilter);
    }

    result.sort((a, b) => {
      let valA: any = (a as any)[sortField];
      let valB: any = (b as any)[sortField];

      if (sortField === "price" || sortField === "stock" || sortField === "sortOrder") {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      }

      if (sortField === "name") {
        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [products, search, categoryFilter, statusFilter, sortField, sortOrder]);

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredProducts.map((p) => p.id)));
  };

  const openEditPanel = (product: ProductWithCategory) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      price: String(product.price || ""),
      cost: String((product as any).cost || ""),
      stock: String((product as any).stock ?? ""),
      categoryId: String(product.categoryId ?? ""),
      status: product.status,
      description: product.description || "",
      imageUrl: product.imageUrl || "",
      sortOrder: String(product.sortOrder ?? ""),
    });
  };

  const closeEditPanel = () => setEditingProduct(null);

  const handleSaveEdit = async () => {
    if (!editingProduct) return;

    try {
      const updates = [
        {
          id: editingProduct.id,
          name: editForm.name.trim(),
          price: editForm.price ? Number(editForm.price) : null,
          cost: editForm.cost ? Number(editForm.cost) : null,
          stock: editForm.stock ? Number(editForm.stock) : null,
          categoryId: editForm.categoryId ? Number(editForm.categoryId) : null,
          status: editForm.status,
          description: editForm.description.trim() || null,
          imageUrl: editForm.imageUrl.trim() || null,
          sortOrder: editForm.sortOrder ? Number(editForm.sortOrder) : 0,
        },
      ];

      await updateProductsBulk(updates as any);
      notify.success("Producto actualizado");
      await loadData();
      closeEditPanel();
      setSelectedIds(new Set());
    } catch (err: any) {
      notify.error(err.message || "Error actualizando producto");
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  if (!user) return null;

  const allSelected = filteredProducts.length > 0 && selectedIds.size === filteredProducts.length;

  const statusBadge = (s: "ACTIVE" | "INACTIVE") =>
    s === "ACTIVE"
      ? "border-emerald-700/40 bg-emerald-500/10 text-emerald-200"
      : "border-slate-700/70 bg-slate-900/60 text-slate-300";

  const chip = (active: boolean) =>
    active
      ? "border-indigo-400/30 bg-indigo-500/10 text-indigo-200"
      : "border-slate-700/70 bg-slate-900/60 text-slate-300";

  // Design tokens
  const card =
    "rounded-2xl border border-slate-800/80 bg-slate-950/50 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]";
  const cardPad = "p-4 md:p-5";
  const label = "block text-[11px] font-medium tracking-wide text-slate-400 mb-1";
  const inputBase =
    "w-full rounded-xl bg-slate-900/70 border border-slate-800 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-indigo-500/70 focus:ring-2 focus:ring-indigo-500/15 placeholder:text-slate-500";
  const selectBase =
    "w-full rounded-xl bg-slate-900/70 border border-slate-800 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-indigo-500/70 focus:ring-2 focus:ring-indigo-500/15";
  const btn =
    "rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800/60 active:scale-[0.99] transition disabled:opacity-60";
  const btnPrimary =
    "rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white active:scale-[0.99] transition disabled:opacity-60";
  const thBase =
    "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-300/90";
  const tdBase = "px-4 py-4 text-sm text-slate-200";

  return (
    <PageShell>
      <PageHeader
        title="Editor Masivo de Productos"
        subtitle="Filtros + tabla + panel lateral para editar rápido."
      />

      <div className="space-y-4">
        {/* Toolbar */}
        <div className={card}>
          <div className={cardPad}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex-1 grid gap-3 lg:grid-cols-12">
                <div className="lg:col-span-6">
                  <label className={label}>Buscar</label>
                  <input
                    type="text"
                    placeholder="Buscar por nombre..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={inputBase}
                  />
                </div>

                <div className="lg:col-span-3">
                  <label className={label}>Categoría</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value ? Number(e.target.value) : "")}
                    className={selectBase}
                  >
                    <option value="">Todas</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="lg:col-span-3">
                  <label className={label}>Estado</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    className={selectBase}
                  >
                    <option value="ALL">Todos</option>
                    <option value="ACTIVE">Activos</option>
                    <option value="INACTIVE">Inactivos</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link href="/dashboard/products" className={btn}>
                  ← Volver
                </Link>

                <button onClick={loadData} disabled={loading} className={btn}>
                  {loading ? "Cargando..." : "Refrescar"}
                </button>
              </div>
            </div>

            {/* Stats row */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                Mostrando{" "}
                <span className="text-slate-100 font-semibold">{filteredProducts.length}</span> /{" "}
                <span className="text-slate-100 font-semibold">{products.length}</span>
              </div>

              <div className={`text-xs px-2.5 py-1 rounded-full border ${chip(selectedIds.size > 0)}`}>
                Seleccionados: <span className="font-semibold">{selectedIds.size}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/10">
            <div className="p-4 flex items-center justify-between gap-4">
              <div className="text-sm text-indigo-100">
                <span className="font-semibold">{selectedIds.size}</span> producto
                {selectedIds.size > 1 ? "s" : ""} seleccionado{selectedIds.size > 1 ? "s" : ""}.
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setShowCategoryModal(true);
                    setModalValue("");
                  }}
                  className={btn}
                >
                  Cambiar categoría
                </button>

                <button
                  onClick={() => {
                    setShowPriceModal(true);
                    setModalValue("");
                  }}
                  className={btn}
                >
                  Ajustar precios
                </button>

                <button
                  onClick={async () => {
                    try {
                      const updates = Array.from(selectedIds).map((id) => ({
                        id,
                        status: "ACTIVE" as const,
                      }));
                      const result = await updateProductsBulk(updates);
                      notify.success(result.message);
                      await loadData();
                      setSelectedIds(new Set());
                    } catch (err: any) {
                      notify.error(err.message || "Error activando productos");
                    }
                  }}
                  className="rounded-xl border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200 hover:bg-emerald-950/60"
                >
                  Activar
                </button>

                <button
                  onClick={async () => {
                    try {
                      const updates = Array.from(selectedIds).map((id) => ({
                        id,
                        status: "INACTIVE" as const,
                      }));
                      const result = await updateProductsBulk(updates);
                      notify.success(result.message);
                      await loadData();
                      setSelectedIds(new Set());
                    } catch (err: any) {
                      notify.error(err.message || "Error desactivando productos");
                    }
                  }}
                  className={btn}
                >
                  Desactivar
                </button>

                <button
                  onClick={async () => {
                    if (!window.confirm(`¿Eliminar ${selectedIds.size} producto(s)?`)) return;
                    
                    try {
                      // Necesitarías implementar deleteProductsBulk en tu API
                      notify.error("Función eliminar no implementada aún");
                    } catch (err: any) {
                      notify.error(err.message || "Error eliminando productos");
                    }
                  }}
                  className="rounded-xl border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-200 hover:bg-red-950/60"
                >
                  Eliminar
                </button>

                <button onClick={() => setSelectedIds(new Set())} className={btn}>
                  Deseleccionar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabla */}
        <div className={`${card} overflow-hidden`}>
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-slate-700 border-t-indigo-500" />
              <p className="mt-3 text-sm text-slate-300">Cargando productos…</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto h-12 w-12 rounded-2xl border border-slate-800 bg-slate-900/50 flex items-center justify-center">
                <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.6}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <p className="mt-3 text-base font-semibold text-slate-100">No hay productos con esos filtros</p>
              <p className="mt-1 text-sm text-slate-400">Probá cambiar búsqueda, estado o categoría.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full w-full">
                <thead className="bg-slate-950/70 sticky top-0 z-10 backdrop-blur border-b border-slate-800/70">
                  <tr>
                    <th className={`${thBase} w-14`}>
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="h-5 w-5 rounded border-slate-600 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>

                    <th
                      className={`${thBase} cursor-pointer select-none hover:text-indigo-300 transition-colors`}
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center gap-2">
                        NOMBRE
                        {sortField === "name" && (
                          <span className="text-indigo-300 text-base">{sortOrder === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                    </th>

                    <th className={thBase}>CATEGORÍA</th>

                    <th
                      className={`${thBase} cursor-pointer select-none hover:text-indigo-300 transition-colors`}
                      onClick={() => handleSort("price")}
                    >
                      <div className="flex items-center gap-2">
                        PRECIO
                        {sortField === "price" && (
                          <span className="text-indigo-300 text-base">{sortOrder === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                    </th>

                    <th
                      className={`${thBase} cursor-pointer select-none hover:text-indigo-300 transition-colors`}
                      onClick={() => handleSort("stock")}
                    >
                      <div className="flex items-center gap-2">
                        STOCK
                        {sortField === "stock" && (
                          <span className="text-indigo-300 text-base">{sortOrder === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                    </th>

                    <th className={thBase}>ESTADO</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800/70">
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-900/40 transition-colors cursor-pointer"
                      onClick={() => openEditPanel(product)}
                    >
                      <td className={tdBase} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(product.id)}
                          onChange={() => toggleSelect(product.id)}
                          className="h-5 w-5 rounded border-slate-600 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>

                      <td className={tdBase}>
                        <div className="flex items-center gap-4 min-w-0">
                          {product.imageUrl ? (
                            <img
                              src={resolveMediaUrl(product.imageUrl) || ""}
                              alt={product.name}
                              className="h-16 w-16 rounded-xl object-cover border border-slate-800 shrink-0"
                            />
                          ) : (
                            <div className="h-16 w-16 rounded-xl border border-slate-800 bg-slate-900/40 shrink-0 flex items-center justify-center">
                              <span className="text-2xl opacity-30">📦</span>
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="text-base text-slate-100 font-semibold truncate">{product.name}</div>
                            <div className="text-xs text-slate-500 font-mono mt-1">#{product.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className={tdBase}>
                        {product.category?.name ? (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border border-slate-700/70 bg-slate-900/60 text-slate-200">
                            {product.category.name}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-500 italic">(sin categoría)</span>
                        )}
                      </td>

                      <td className={tdBase}>
                        <span className="font-mono text-base text-slate-100 font-semibold">
                          ${Number(product.price || 0).toLocaleString()}
                        </span>
                      </td>

                      <td className={tdBase}>
                        <span className="font-mono text-base text-slate-100 font-semibold">
                          {(product as any).stock ?? "0"}
                        </span>
                      </td>

                      <td className={tdBase}>
                        <span
                          className={`inline-flex items-center px-3 py-1.5 rounded-full border text-sm font-medium ${statusBadge(
                            product.status
                          )}`}
                        >
                          {product.status === "ACTIVE" ? "ACTIVO" : "INACTIVO"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-slate-800/70 bg-slate-950/70 px-4 py-3 text-xs text-slate-400">
                💡 Tip: Click en columnas NOMBRE, PRECIO o STOCK para ordenar. Click en una fila para editar.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Cambiar categoría */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCategoryModal(false)} />
          
          <div className="relative bg-slate-950 border border-slate-800 rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Cambiar categoría</h3>
            
            <div className="mb-4">
              <label className={label}>Nueva categoría</label>
              <select
                value={modalValue}
                onChange={(e) => setModalValue(e.target.value)}
                className={selectBase}
                autoFocus
              >
                <option value="">Seleccionar...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={async () => {
                  if (!modalValue) return notify.error("Seleccioná una categoría");
                  
                  try {
                    const updates = Array.from(selectedIds).map((id) => ({
                      id,
                      categoryId: Number(modalValue),
                    }));
                    const result = await updateProductsBulk(updates);
                    notify.success(result.message);
                    await loadData();
                    setSelectedIds(new Set());
                    setShowCategoryModal(false);
                    setModalValue("");
                  } catch (err: any) {
                    notify.error(err.message || "Error cambiando categoría");
                  }
                }}
                className={btnPrimary}
              >
                Aplicar
              </button>
              <button onClick={() => setShowCategoryModal(false)} className={btn}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Ajustar precios */}
      {showPriceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPriceModal(false)} />
          
          <div className="relative bg-slate-950 border border-slate-800 rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Ajustar precios</h3>
            
            <div className="mb-4">
              <label className={label}>Porcentaje de ajuste</label>
              <input
                type="number"
                value={modalValue}
                onChange={(e) => setModalValue(e.target.value)}
                className={inputBase}
                placeholder="Ejemplo: 10 para +10%, -15 para -15%"
                autoFocus
              />
              <div className="mt-2 text-xs text-slate-400">
                Valores positivos aumentan, negativos descuentan
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={async () => {
                  if (!modalValue) return notify.error("Ingresá un porcentaje");
                  
                  try {
                    const percentage = Number(modalValue);
                    const updates = Array.from(selectedIds).map((id) => {
                      const product = products.find((p) => p.id === id);
                      if (!product || !product.price) return null;
                      
                      const currentPrice = Number(product.price);
                      const newPrice = Math.round(currentPrice * (1 + percentage / 100));
                      
                      return { id, price: Math.max(0, newPrice) };
                    }).filter(Boolean);

                    const result = await updateProductsBulk(updates as any);
                    notify.success(result.message);
                    await loadData();
                    setSelectedIds(new Set());
                    setShowPriceModal(false);
                    setModalValue("");
                  } catch (err: any) {
                    notify.error(err.message || "Error ajustando precios");
                  }
                }}
                className={btnPrimary}
              >
                Aplicar
              </button>
              <button onClick={() => setShowPriceModal(false)} className={btn}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panel lateral */}
      {editingProduct && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={closeEditPanel} />

          <div className="absolute right-0 top-0 h-full w-full max-w-md border-l border-slate-800/80 bg-slate-950 shadow-2xl">
            <div className="h-full overflow-y-auto">
              {/* Header */}
              <div className="p-5 border-b border-slate-800/80">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-lg font-semibold text-slate-100 truncate">Editar producto</div>
                    <div className="mt-1 text-xs text-slate-400">
                      ID <span className="font-mono text-slate-200">#{editingProduct.id}</span>
                    </div>
                  </div>

                  <button
                    onClick={closeEditPanel}
                    className="rounded-xl border border-slate-800 bg-slate-900/70 px-2.5 py-1.5 text-slate-200 hover:bg-slate-800/60"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Imagen */}
                <div className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4">
                  <div className="flex items-center gap-3">
                    {editForm.imageUrl ? (
                      <img
                        src={resolveMediaUrl(editForm.imageUrl) || ""}
                        alt="preview"
                        className="h-16 w-16 rounded-2xl object-cover border border-slate-800"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-2xl border border-slate-800 bg-slate-900/40" />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className={label}>URL de imagen</div>
                      <input
                        type="text"
                        value={editForm.imageUrl}
                        onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                        className={inputBase}
                        placeholder="/uploads/..."
                      />
                    </div>
                  </div>
                </div>

                {/* Datos */}
                <div className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4">
                  <div className="grid gap-4">
                    <div>
                      <label className={label}>Nombre *</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className={inputBase}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={label}>Precio *</label>
                        <input
                          type="number"
                          value={editForm.price}
                          onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                          className={inputBase}
                        />
                      </div>
                      <div>
                        <label className={label}>Costo</label>
                        <input
                          type="number"
                          value={editForm.cost}
                          onChange={(e) => setEditForm({ ...editForm, cost: e.target.value })}
                          className={inputBase}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={label}>Stock</label>
                        <input
                          type="number"
                          value={editForm.stock}
                          onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                          className={inputBase}
                        />
                      </div>

                      <div>
                        <label className={label}>Orden</label>
                        <input
                          type="number"
                          value={editForm.sortOrder}
                          onChange={(e) => setEditForm({ ...editForm, sortOrder: e.target.value })}
                          className={inputBase}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={label}>Categoría</label>
                        <select
                          value={editForm.categoryId}
                          onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                          className={selectBase}
                        >
                          <option value="">Sin categoría</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className={label}>Estado</label>
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                          className={selectBase}
                        >
                          <option value="ACTIVE">Activo</option>
                          <option value="INACTIVE">Inactivo</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className={label}>Descripción</label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        rows={4}
                        className={`${inputBase} resize-none`}
                        placeholder="Opcional..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur p-4">
                <div className="flex gap-2">
                  <button onClick={handleSaveEdit} className={`flex-1 ${btnPrimary}`}>
                    Guardar
                  </button>
                  <button onClick={closeEditPanel} className={btn}>
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}