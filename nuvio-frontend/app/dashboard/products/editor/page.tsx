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

export default function ProductEditorPage() {
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

  // Bulk actions
  const [bulkAction, setBulkAction] = useState<
    "status" | "category" | "price-increase" | ""
  >("");
  const [bulkValue, setBulkValue] = useState("");

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
      const [productsData, categoriesData] = await Promise.all([
        listProductsBulk(),
        listCategories(),
      ]);
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

    // Búsqueda
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }

    // Categoría
    if (categoryFilter !== "") {
      result = result.filter((p) => p.categoryId === categoryFilter);
    }

    // Estado
    if (statusFilter !== "ALL") {
      result = result.filter((p) => p.status === statusFilter);
    }

    // Ordenar
    result.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

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

  // Selección
  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  // Abrir panel de edición
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

  const closeEditPanel = () => {
    setEditingProduct(null);
  };

  // Guardar edición individual
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

  // Bulk actions
  const handleBulkAction = async () => {
    if (selectedIds.size === 0) {
      notify.error("Seleccioná al menos un producto");
      return;
    }

    if (!bulkAction) {
      notify.error("Seleccioná una acción");
      return;
    }

    try {
      const updates = Array.from(selectedIds).map((id) => {
        const update: any = { id };

        if (bulkAction === "status") {
          update.status = bulkValue as "ACTIVE" | "INACTIVE";
        } else if (bulkAction === "category") {
          update.categoryId = bulkValue ? Number(bulkValue) : null;
        } else if (bulkAction === "price-increase") {
          const product = products.find((p) => p.id === id);
          if (product && product.price) {
            const currentPrice = Number(product.price);
            const percentage = Number(bulkValue) || 0;
            update.price = Math.round(currentPrice * (1 + percentage / 100));
          }
        }

        return update;
      });

      const result = await updateProductsBulk(updates);
      notify.success(result.message);
      await loadData();
      setSelectedIds(new Set());
      setBulkAction("");
      setBulkValue("");
    } catch (err: any) {
      notify.error(err.message || "Error en acción masiva");
    }
  };

  if (!user) return null;

  const allSelected = filteredProducts.length > 0 && selectedIds.size === filteredProducts.length;

  return (
    <PageShell>
      <PageHeader title="Editor Masivo de Productos" />

      {/* Filtros y búsqueda */}
      <div className="mb-6 space-y-4">
        {/* Fila 1: Búsqueda */}
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Fila 2: Filtros */}
        <div className="flex gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value ? Number(e.target.value) : "")}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">Todos los estados</option>
            <option value="ACTIVE">Activos</option>
            <option value="INACTIVE">Inactivos</option>
          </select>

          <Link href="/dashboard/products">
            <button className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
              Volver
            </button>
          </Link>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="font-medium text-indigo-900">
              {selectedIds.size} producto{selectedIds.size > 1 ? "s" : ""} seleccionado
              {selectedIds.size > 1 ? "s" : ""}:
            </span>

            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value as any)}
              className="px-3 py-1.5 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Seleccionar acción...</option>
              <option value="status">Cambiar estado</option>
              <option value="category">Cambiar categoría</option>
              <option value="price-increase">Aumentar precios %</option>
            </select>

            {bulkAction === "status" && (
              <select
                value={bulkValue}
                onChange={(e) => setBulkValue(e.target.value)}
                className="px-3 py-1.5 border border-indigo-300 rounded-lg"
              >
                <option value="">Seleccionar estado...</option>
                <option value="ACTIVE">Activo</option>
                <option value="INACTIVE">Inactivo</option>
              </select>
            )}

            {bulkAction === "category" && (
              <select
                value={bulkValue}
                onChange={(e) => setBulkValue(e.target.value)}
                className="px-3 py-1.5 border border-indigo-300 rounded-lg"
              >
                <option value="">Seleccionar categoría...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}

            {bulkAction === "price-increase" && (
              <input
                type="number"
                placeholder="% (ej: 10)"
                value={bulkValue}
                onChange={(e) => setBulkValue(e.target.value)}
                className="w-24 px-3 py-1.5 border border-indigo-300 rounded-lg"
              />
            )}

            <button
              onClick={handleBulkAction}
              disabled={!bulkAction || !bulkValue}
              className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Aplicar
            </button>

            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-4 py-1.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Tabla mejorada */}
<div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
  {loading ? (
    <div className="p-12 text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      <p className="mt-4 text-gray-600 font-medium">Cargando productos...</p>
    </div>
  ) : filteredProducts.length === 0 ? (
    <div className="p-12 text-center">
      <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <p className="mt-4 text-lg font-medium text-gray-900">No hay productos</p>
      <p className="mt-1 text-sm text-gray-500">Ajustá los filtros o creá nuevos productos</p>
    </div>
  ) : (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gradient-to-r from-indigo-600 to-indigo-700">
          <tr>
            <th className="w-14 px-6 py-4">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="w-5 h-5 text-indigo-600 bg-white border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
              />
            </th>
            <th
              className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-indigo-700 transition-colors select-none"
              onClick={() => {
                if (sortField === "name") {
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                } else {
                  setSortField("name");
                  setSortOrder("asc");
                }
              }}
            >
              <div className="flex items-center gap-2">
                Nombre
                {sortField === "name" && (
                  <span className="text-indigo-200">
                    {sortOrder === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </div>
            </th>
            <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">
              Categoría
            </th>
            <th
              className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-indigo-700 transition-colors select-none"
              onClick={() => {
                if (sortField === "price") {
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                } else {
                  setSortField("price");
                  setSortOrder("asc");
                }
              }}
            >
              <div className="flex items-center gap-2">
                Precio
                {sortField === "price" && (
                  <span className="text-indigo-200">
                    {sortOrder === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </div>
            </th>
            <th
              className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-indigo-700 transition-colors select-none"
              onClick={() => {
                if (sortField === "stock") {
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                } else {
                  setSortField("stock");
                  setSortOrder("asc");
                }
              }}
            >
              <div className="flex items-center gap-2">
                Stock
                {sortField === "stock" && (
                  <span className="text-indigo-200">
                    {sortOrder === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </div>
            </th>
            <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">
              Estado
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {filteredProducts.map((product, idx) => (
            <tr
              key={product.id}
              className={`transition-all duration-150 cursor-pointer ${
                idx % 2 === 0 ? "bg-white" : "bg-gray-50"
              } hover:bg-indigo-50 hover:shadow-md`}
              onClick={() => openEditPanel(product)}
            >
              <td
                className="px-6 py-4"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(product.id)}
                  onChange={() => toggleSelect(product.id)}
                  className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
                />
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-4">
                  {product.imageUrl && product.imageUrl !== null ? (
                    <img
                      src={resolveMediaUrl(product.imageUrl) || ""}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded-lg shadow-sm ring-2 ring-gray-100"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center shadow-sm ring-2 ring-gray-100">
                      <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <span className="font-semibold text-gray-900">{product.name}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                {product.category?.name ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                    {product.category.name}
                  </span>
                ) : (
                  <span className="text-gray-400 italic text-sm">Sin categoría</span>
                )}
              </td>
              <td className="px-6 py-4">
                <span className="text-lg font-bold text-gray-900">
                  ${Number(product.price || 0).toLocaleString()}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className="text-gray-700 font-medium">
                  {(product as any).stock ?? "-"}
                </span>
              </td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                    product.status === "ACTIVE"
                      ? "bg-green-100 text-green-800 ring-2 ring-green-200"
                      : "bg-gray-100 text-gray-800 ring-2 ring-gray-200"
                  }`}
                >
                  {product.status === "ACTIVE" ? (
                    <>
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Activo
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                      Inactivo
                    </>
                  )}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>
      

      {/* Panel lateral de edición */}
      {editingProduct && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end"
          onClick={closeEditPanel}
        >
          <div
            className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Editar Producto</h2>
                <button
                  onClick={closeEditPanel}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio *
                    </label>
                    <input
                      type="number"
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Costo
                    </label>
                    <input
                      type="number"
                      value={editForm.cost}
                      onChange={(e) => setEditForm({ ...editForm, cost: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <select
                    value={editForm.categoryId}
                    onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Sin categoría</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                    <input
                      type="number"
                      value={editForm.stock}
                      onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <select
                      value={editForm.status}
                      onChange={(e) =>
                        setEditForm({ ...editForm, status: e.target.value as any })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="ACTIVE">Activo</option>
                      <option value="INACTIVE">Inactivo</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL de Imagen
                  </label>
                  <input
                    type="text"
                    value={editForm.imageUrl}
                    onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {editForm.imageUrl && editForm.imageUrl !== null && (
                    <img
                      src={resolveMediaUrl(editForm.imageUrl) || ""}
                      alt="Preview"
                      className="mt-2 w-full h-32 object-cover rounded-lg"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Orden
                  </label>
                  <input
                    type="number"
                    value={editForm.sortOrder}
                    onChange={(e) => setEditForm({ ...editForm, sortOrder: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  Guardar Cambios
                </button>
                <button
                  onClick={closeEditPanel}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}