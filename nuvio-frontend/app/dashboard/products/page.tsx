"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { SortableList } from "@/components/ui/SortableList";

import { resolveMediaUrl } from "@/lib/media";

import {
  listCategories,
  type Category,
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  type Product,
  listSections,
  type Section,
} from "@/lib/api";

import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { notify } from "@/lib/notify";
import { ImagePicker } from "@/components/ui/ImagePicker";

const MySwal = withReactContent(Swal);

type StoredUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  status?: string;
};

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export default function ProductsPage() {
  const router = useRouter();

  const [user, setUser] = useState<StoredUser | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [businessLabel, setBusinessLabel] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // filtros
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  // ✨ NUEVO: Secciones para crear
  const [newSections, setNewSections] = useState<Section[]>([]);
  const [loadingSections, setLoadingSections] = useState(false);

  // crear
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState<string>("");
  const [newCategoryId, setNewCategoryId] = useState<string>("");
  const [newSectionId, setNewSectionId] = useState<string>(""); // ✨ NUEVO
  const [newDescription, setNewDescription] = useState<string>("");
  const [newSortOrder, setNewSortOrder] = useState<string>("0");
  const [newImageUrl, setNewImageUrl] = useState<string>("");

  // ✨ NUEVO: Secciones para editar
  const [editSections, setEditSections] = useState<Section[]>([]);

  // edición (inline)
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState<string>("");
  const [editCategoryId, setEditCategoryId] = useState<string>("");
  const [editSectionId, setEditSectionId] = useState<string>(""); // ✨ NUEVO
  const [editDescription, setEditDescription] = useState<string>("");
  const [editSortOrder, setEditSortOrder] = useState<string>("0");
  const [editImageUrl, setEditImageUrl] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const raw = localStorage.getItem("nuvio_user");
    if (!raw) return router.replace("/login");

    try {
      const u = JSON.parse(raw) as StoredUser;
      setUser(u);

      if (u?.role === "SUPERADMIN") router.replace("/admin");
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

  // ✨ NUEVO: Cargar secciones cuando cambia la categoría (crear)
  useEffect(() => {
    if (!newCategoryId || newCategoryId === "") {
      setNewSections([]);
      setNewSectionId("");
      return;
    }

    const categoryId = Number(newCategoryId);
    if (isNaN(categoryId)) return;

    setLoadingSections(true);
    listSections(categoryId)
      .then((sections) => {
        setNewSections(sections);
        setNewSectionId(""); // Reset sección seleccionada
      })
      .catch((err) => {
        console.error("Error cargando secciones:", err);
        setNewSections([]);
      })
      .finally(() => setLoadingSections(false));
  }, [newCategoryId]);

  // ✨ NUEVO: Cargar secciones cuando cambia la categoría (editar)
  useEffect(() => {
    if (!editCategoryId || editCategoryId === "") {
      setEditSections([]);
      setEditSectionId("");
      return;
    }

    const categoryId = Number(editCategoryId);
    if (isNaN(categoryId)) return;

    setLoadingSections(true);
    listSections(categoryId)
      .then((sections) => {
        setEditSections(sections);
        // No resetear editSectionId aquí porque estamos editando
      })
      .catch((err) => {
        console.error("Error cargando secciones:", err);
        setEditSections([]);
      })
      .finally(() => setLoadingSections(false));
  }, [editCategoryId]);

  async function refresh() {
    try {
      setLoading(true);
      setError(null);

      const cats = await listCategories();
      setCategories(cats.categories ?? []);

      const prods = await listProducts();
      setProducts(prods.products ?? []);

      const biz = (cats as any).business ?? (prods as any).business ?? null;
      setBusinessLabel(biz ? `${biz.name} · ${biz.slug}` : null);
    } catch (e: any) {
      const msg = e?.message || "No se pudieron cargar productos/categorías.";
      console.error(e);
      setError(msg);
      notify.error(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const categoryNameById = useMemo(() => {
    const map = new Map<number, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();

    return [...products]
      .filter((p) => {
        if (statusFilter === "ALL") return true;
        return p.status === statusFilter;
      })
      .filter((p) => {
        if (!qq) return true;
        const cat = p.categoryId ? categoryNameById.get(p.categoryId) ?? "" : "";
        return (
          p.name.toLowerCase().includes(qq) ||
          (p.description ?? "").toLowerCase().includes(qq) ||
          cat.toLowerCase().includes(qq)
        );
      })
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id);
  }, [products, q, statusFilter, categoryNameById]);

  const activeList = useMemo(() => filtered.filter((p) => p.status === "ACTIVE"), [filtered]);
  const inactiveList = useMemo(() => filtered.filter((p) => p.status !== "ACTIVE"), [filtered]);

  const activeCount = useMemo(() => products.filter((p) => p.status === "ACTIVE").length, [products]);
  const inactiveCount = useMemo(() => products.filter((p) => p.status !== "ACTIVE").length, [products]);

  async function onCreate() {
    const name = newName.trim();
    if (!name) return;

    const priceNum = Number(newPrice);
    if (!newPrice.trim() || Number.isNaN(priceNum)) return notify.error("El precio debe ser un número.");

    const sortOrderNum = Number(newSortOrder);
    if (Number.isNaN(sortOrderNum)) return notify.error("El orden debe ser un número.");

    const catId = newCategoryId.trim() === "" ? null : Number(newCategoryId);
    if (newCategoryId.trim() !== "" && Number.isNaN(catId as any)) return notify.error("Categoría inválida.");

    // ✨ NUEVO: sectionId
    const secId = newSectionId.trim() === "" ? null : Number(newSectionId);
    if (newSectionId.trim() !== "" && Number.isNaN(secId as any)) return notify.error("Sección inválida.");

    try {
      setLoading(true);
      setError(null);

      await createProduct({
        name,
        price: priceNum,
        categoryId: catId,
        sectionId: secId, // ✨ NUEVO
        description: newDescription.trim() ? newDescription.trim() : null,
        sortOrder: sortOrderNum,
        imageUrl: newImageUrl.trim() ? newImageUrl.trim() : null,
      } as any);

      setNewName("");
      setNewPrice("");
      setNewCategoryId("");
      setNewSectionId(""); // ✨ NUEVO
      setNewDescription("");
      setNewSortOrder("0");
      setNewImageUrl("");

      notify.success("Producto creado ✅");
      await refresh();
    } catch (e: any) {
      console.error(e);
      const msg = e?.message || "No se pudo crear el producto.";
      setError(msg);
      notify.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(p: Product) {
    setEditingId(p.id);
    setEditName(p.name);
    setEditPrice(p.price == null ? "" : String(p.price));
    setEditCategoryId(p.categoryId == null ? "" : String(p.categoryId));
    setEditSectionId((p as any).sectionId == null ? "" : String((p as any).sectionId)); // ✨ NUEVO
    setEditDescription(p.description ?? "");
    setEditSortOrder(p.sortOrder == null ? "0" : String(p.sortOrder));
    setEditImageUrl((p.imageUrl as any) ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditPrice("");
    setEditCategoryId("");
    setEditSectionId(""); // ✨ NUEVO
    setEditDescription("");
    setEditSortOrder("0");
    setEditImageUrl("");
  }

  async function saveEdit(productId: number) {
    const name = editName.trim();
    if (!name) return notify.error("El nombre no puede quedar vacío.");

    const priceNum = Number(editPrice);
    if (!editPrice.trim() || Number.isNaN(priceNum)) return notify.error("El precio debe ser un número.");

    const sortOrderNum = Number(editSortOrder);
    if (Number.isNaN(sortOrderNum)) return notify.error("El orden debe ser un número.");

    const catId = editCategoryId.trim() === "" ? null : Number(editCategoryId);
    if (editCategoryId.trim() !== "" && Number.isNaN(catId as any)) return notify.error("Categoría inválida.");

    // ✨ NUEVO: sectionId
    const secId = editSectionId.trim() === "" ? null : Number(editSectionId);
    if (editSectionId.trim() !== "" && Number.isNaN(secId as any)) return notify.error("Sección inválida.");

    try {
      setLoading(true);
      setError(null);

      await updateProduct(productId, {
        name,
        price: priceNum,
        categoryId: catId,
        sectionId: secId, // ✨ NUEVO
        description: editDescription.trim() ? editDescription.trim() : null,
        sortOrder: sortOrderNum,
        imageUrl: editImageUrl.trim() ? editImageUrl.trim() : null,
      } as any);

      notify.success("Producto actualizado ✅");
      cancelEdit();
      await refresh();
    } catch (e: any) {
      console.error(e);
      const msg = e?.message || "No se pudo actualizar el producto.";
      setError(msg);
      notify.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(p: Product) {
    try {
      setLoading(true);
      setError(null);

      const next = p.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

      const maxActive = Math.max(0, ...products.filter((x) => x.status === "ACTIVE").map((x) => x.sortOrder ?? 0));

      await updateProduct(p.id, {
        status: next,
        sortOrder: next === "ACTIVE" ? maxActive + 1 : p.sortOrder,
      } as any);

      setProducts((prev) =>
        prev.map((x) =>
          x.id === p.id ? { ...x, status: next, sortOrder: next === "ACTIVE" ? maxActive + 1 : x.sortOrder } : x
        )
      );

      notify.success(next === "ACTIVE" ? "Producto activado ✅" : "Producto desactivado ✅");
      await refresh();
    } catch (e: any) {
      const msg = e?.message || "No se pudo cambiar el estado.";
      setError(msg);
      notify.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(p: Product) {
    const res = await MySwal.fire({
      title: "¿Eliminar producto definitivamente?",
      text: "Esto lo borra de la base de datos (no se puede deshacer).",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!res.isConfirmed) return;

    try {
      setLoading(true);
      setError(null);

      await deleteProduct(p.id);

      setProducts((prev) => prev.filter((x) => x.id !== p.id));

      notify.success("Producto eliminado ✅");
    } catch (e: any) {
      const msg = e?.message || "No se pudo eliminar.";
      setError(msg);
      notify.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function persistProductOrder(next: Product[]) {
    const normalized = next.map((p, idx) => ({ ...p, sortOrder: idx }));

    setProducts((prev) =>
      prev.map((p) => {
        const found = normalized.find((x) => x.id === p.id);
        return found ? { ...p, sortOrder: found.sortOrder } : p;
      })
    );

    const changed = normalized.filter((p) => {
      const old = products.find((x) => x.id === p.id);
      return (old?.sortOrder ?? 0) !== p.sortOrder;
    });

    if (changed.length === 0) return;

    try {
      await Promise.all(changed.map((p) => updateProduct(p.id, { sortOrder: p.sortOrder } as any)));
      notify.success("Orden actualizado ✅");
      await refresh();
    } catch (e: any) {
      notify.error(e?.message || "No se pudo guardar el orden");
      await refresh();
    }
  }

  if (!user) return null;

  return (
    <PageShell>
      <PageHeader
        title="ABM Productos"
        subtitle="Creá, editá, activá/desactivá, reordená y eliminá productos."
        user={{ name: user.name, email: user.email }}
        onLogout={handleLogout}
      />

      <main className="space-y-6">
        {/* top bar */}
        <div className="flex items-center justify-between gap-3">
          <Link href="/dashboard" className="text-sm text-indigo-300 hover:text-indigo-200 underline">
            ← Volver al dashboard
          </Link>

          <Link href="/dashboard/products/import">
            <button className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700">
              📥 Importar desde Excel
            </button>
          </Link>

          <div className="flex items-center gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar..."
              className="w-56 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
            >
              <option value="ALL">Todos</option>
              <option value="ACTIVE">Activos</option>
              <option value="INACTIVE">Inactivos</option>
            </select>
          </div>

          {businessLabel && (
            <div className="hidden md:block text-xs text-slate-400">
              Negocio: <span className="font-mono bg-slate-900 px-1 py-0.5 rounded">{businessLabel}</span>
            </div>
          )}
        </div>

        {error && (
          <Card>
            <p className="text-sm text-red-400">{error}</p>
          </Card>
        )}

        {/* stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <div className="text-xs text-slate-400">Total</div>
            <div className="text-2xl font-semibold text-slate-100">{products.length}</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-400">Activos</div>
            <div className="text-2xl font-semibold text-slate-100">{activeCount}</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-400">Inactivos</div>
            <div className="text-2xl font-semibold text-slate-100">{inactiveCount}</div>
          </Card>
        </div>

        {/* crear */}
        <Card>
          <div className="grid gap-3 md:grid-cols-12">
            <div className="md:col-span-4">
              <label className="block text-sm text-slate-300 mb-1">Nombre</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-slate-300 mb-1">Precio</label>
              <input
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm text-slate-300 mb-1">Categoría</label>
              <select
                value={newCategoryId}
                onChange={(e) => setNewCategoryId(e.target.value)}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
              >
                <option value="">(sin categoría)</option>
                {categories
                  .filter((c) => c.isActive !== false)
                  .map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* ✨ NUEVO: Dropdown de secciones */}
            {newCategoryId && newCategoryId !== "" && (
              <div className="md:col-span-3">
                <label className="block text-sm text-slate-300 mb-1">Sección</label>
                <select
                  value={newSectionId}
                  onChange={(e) => setNewSectionId(e.target.value)}
                  disabled={loadingSections}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 disabled:opacity-50"
                >
                  <option value="">(sin sección)</option>
                  {newSections.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="md:col-span-1">
              <label className="block text-sm text-slate-300 mb-1">Orden</label>
              <input
                value={newSortOrder}
                onChange={(e) => setNewSortOrder(e.target.value)}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-12">
              <label className="block text-sm text-slate-300 mb-1">Descripción</label>
              <input
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-12">
              <ImagePicker
                label="Imagen del producto (opcional)"
                value={newImageUrl}
                onChange={setNewImageUrl}
                hint="Subí una imagen o pegá un link (no mostramos la URL)."
              />
            </div>

            <div className="md:col-span-12 flex gap-2">
              <button
                onClick={onCreate}
                disabled={loading || !newName.trim()}
                className="rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 px-4 py-2 text-sm font-medium text-white"
              >
                {loading ? "Procesando..." : "Crear producto"}
              </button>

              <button
                onClick={refresh}
                disabled={loading}
                className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-60"
              >
                Refrescar
              </button>
            </div>
          </div>
        </Card>

        {/* listas 2 columnas */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-100">Activos ({activeList.length})</h2>
              <p className="text-xs text-slate-400">Arrastrá "≡" para reordenar.</p>
            </div>

            {activeList.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">No hay productos activos.</p>
            ) : (
              <SortableList
                dragGroup="products-active"
                items={activeList}
                getId={(p) => p.id}
                className="mt-3 space-y-2"
                onReorder={(next) => persistProductOrder(next)}
                renderItem={({ item: p, draggableProps, handleProps }) => (
                  <ProductRow
                    key={p.id}
                    product={p}
                    categoryLabel={
                      p.categoryId == null
                        ? "(sin categoría)"
                        : categoryNameById.get(p.categoryId) ?? `#${p.categoryId}`
                    }
                    categories={categories}
                    editing={editingId === p.id}
                    loading={loading}
                    loadingSections={loadingSections}
                    editSections={editSections} // ✨ NUEVO
                    onStartEdit={startEdit}
                    onCancelEdit={cancelEdit}
                    onSaveEdit={saveEdit}
                    onToggle={toggleStatus}
                    onDelete={onDelete}
                    editState={{
                      editName,
                      setEditName,
                      editPrice,
                      setEditPrice,
                      editCategoryId,
                      setEditCategoryId,
                      editSectionId, // ✨ NUEVO
                      setEditSectionId, // ✨ NUEVO
                      editDescription,
                      setEditDescription,
                      editSortOrder,
                      setEditSortOrder,
                      editImageUrl,
                      setEditImageUrl,
                    }}
                    draggableProps={draggableProps}
                    handleProps={handleProps}
                  />
                )}
              />
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-100">Inactivos ({inactiveList.length})</h2>
              <p className="text-xs text-slate-400">Arrastrá "≡" para reordenar.</p>
            </div>

            {inactiveList.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">No hay productos inactivos.</p>
            ) : (
              <SortableList
                dragGroup="products-inactive"
                items={inactiveList}
                getId={(p) => p.id}
                className="mt-3 space-y-2"
                onReorder={(next) => persistProductOrder(next)}
                renderItem={({ item: p, draggableProps, handleProps }) => (
                  <ProductRow
                    key={p.id}
                    product={p}
                    categoryLabel={
                      p.categoryId == null
                        ? "(sin categoría)"
                        : categoryNameById.get(p.categoryId) ?? `#${p.categoryId}`
                    }
                    categories={categories}
                    editing={editingId === p.id}
                    loading={loading}
                    loadingSections={loadingSections}
                    editSections={editSections} // ✨ NUEVO
                    onStartEdit={startEdit}
                    onCancelEdit={cancelEdit}
                    onSaveEdit={saveEdit}
                    onToggle={toggleStatus}
                    onDelete={onDelete}
                    editState={{
                      editName,
                      setEditName,
                      editPrice,
                      setEditPrice,
                      editCategoryId,
                      setEditCategoryId,
                      editSectionId, // ✨ NUEVO
                      setEditSectionId, // ✨ NUEVO
                      editDescription,
                      setEditDescription,
                      editSortOrder,
                      setEditSortOrder,
                      editImageUrl,
                      setEditImageUrl,
                    }}
                    draggableProps={draggableProps}
                    handleProps={handleProps}
                  />
                )}
              />
            )}
          </Card>
        </div>
      </main>
    </PageShell>
  );
}

function ProductRow({
  product: p,
  categoryLabel,
  categories,
  editing,
  loading,
  loadingSections,
  editSections,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onToggle,
  onDelete,
  editState,
  draggableProps,
  handleProps,
}: {
  product: Product;
  categoryLabel: string;
  categories: Category[];
  editing: boolean;
  loading: boolean;
  loadingSections: boolean;
  editSections: Section[];
  onStartEdit: (p: Product) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: number) => void;
  onToggle: (p: Product) => void;
  onDelete: (p: Product) => void;
  editState: {
    editName: string;
    setEditName: (v: string) => void;
    editPrice: string;
    setEditPrice: (v: string) => void;
    editCategoryId: string;
    setEditCategoryId: (v: string) => void;
    editSectionId: string; // ✨ NUEVO
    setEditSectionId: (v: string) => void; // ✨ NUEVO
    editDescription: string;
    setEditDescription: (v: string) => void;
    editSortOrder: string;
    setEditSortOrder: (v: string) => void;
    editImageUrl: string;
    setEditImageUrl: (v: string) => void;
  };
  draggableProps: React.HTMLAttributes<HTMLElement>;
  handleProps: React.HTMLAttributes<HTMLElement>;
}) {
  const badge =
    p.status === "ACTIVE"
      ? "border-emerald-800 bg-emerald-950/40 text-emerald-200"
      : "border-slate-700 bg-slate-900 text-slate-300";

  const imgSrc = p.imageUrl ? resolveMediaUrl(p.imageUrl) : null;

  const {
    editName,
    setEditName,
    editPrice,
    setEditPrice,
    editCategoryId,
    setEditCategoryId,
    editSectionId,
    setEditSectionId,
    editDescription,
    setEditDescription,
    editSortOrder,
    setEditSortOrder,
    editImageUrl,
    setEditImageUrl,
  } = editState;

  return (
    <div {...draggableProps} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
      {!editing ? (
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 flex items-start gap-3">
            <span {...handleProps}>≡</span>

            {imgSrc ? (
              <img
                src={imgSrc}
                alt={p.name}
                className="h-12 w-12 rounded-lg object-cover border border-slate-800"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="h-12 w-12 rounded-lg border border-slate-800 bg-slate-900/40" />
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-100 font-medium truncate">{p.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${badge}`}>{p.status}</span>
              </div>

              <div className="mt-1 text-xs text-slate-400 flex flex-wrap gap-3">
                <span>
                  Precio:{" "}
                  <span className="font-mono text-slate-300">{p.price == null ? "-" : `$${p.price}`}</span>
                </span>
                <span>
                  Categoría: <span className="font-mono text-slate-300">{categoryLabel}</span>
                </span>
                <span>
                  Orden: <span className="font-mono text-slate-300">{p.sortOrder ?? 0}</span>
                </span>
                <span>
                  ID: <span className="font-mono text-slate-300">{p.id}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onStartEdit(p)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
            >
              Editar
            </button>

            <button
              onClick={() => onToggle(p)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
            >
              {p.status === "ACTIVE" ? "Desactivar" : "Activar"}
            </button>

            <button
              onClick={() => onDelete(p)}
              className="rounded-lg border border-red-800 bg-red-950/40 px-3 py-1.5 text-sm text-red-200 hover:bg-red-950/60"
            >
              Eliminar
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-12">
            <div className="md:col-span-4">
              <label className="block text-xs text-slate-400 mb-1">Nombre</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Precio</label>
              <input
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs text-slate-400 mb-1">Categoría</label>
              <select
                value={editCategoryId}
                onChange={(e) => setEditCategoryId(e.target.value)}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
              >
                <option value="">(sin categoría)</option>
                {categories
                  .filter((c) => c.isActive !== false)
                  .map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* ✨ NUEVO: Dropdown de secciones al editar */}
            {editCategoryId && editCategoryId !== "" && (
              <div className="md:col-span-3">
                <label className="block text-xs text-slate-400 mb-1">Sección</label>
                <select
                  value={editSectionId}
                  onChange={(e) => setEditSectionId(e.target.value)}
                  disabled={loadingSections}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 disabled:opacity-50"
                >
                  <option value="">(sin sección)</option>
                  {editSections.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="md:col-span-1">
              <label className="block text-xs text-slate-400 mb-1">Orden</label>
              <input
                value={editSortOrder}
                onChange={(e) => setEditSortOrder(e.target.value)}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-12">
              <label className="block text-xs text-slate-400 mb-1">Descripción</label>
              <input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-12">
              <ImagePicker
                label="Imagen del producto"
                value={editImageUrl}
                onChange={setEditImageUrl}
                hint="Subí una imagen o pegá un link (no mostramos la URL)."
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="text-xs text-slate-500">
              Editando ID <span className="font-mono text-slate-300">{p.id}</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onSaveEdit(p.id)}
                disabled={loading}
                className="rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 px-3 py-1.5 text-sm font-medium text-white"
              >
                Guardar
              </button>
              <button
                onClick={onCancelEdit}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}