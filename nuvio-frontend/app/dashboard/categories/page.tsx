"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/Card";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { SortableList } from "@/components/ui/SortableList";
import { ImagePicker } from "@/components/ui/ImagePicker";

import { resolveMediaUrl } from "@/lib/media";

import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type Category,
  listProducts,
} from "@/lib/api";

import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { notify } from "@/lib/notify";

const MySwal = withReactContent(Swal);

type StoredUser = { name: string; email: string; role?: string };
type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export default function CategoriesPage() {
  const router = useRouter();

  const [user, setUser] = useState<StoredUser | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [catProductCount, setCatProductCount] = useState<Record<number, number>>({});

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // filtros
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  // crear
  const [newName, setNewName] = useState("");
  const [newSortOrder, setNewSortOrder] = useState("0");
  const [newImageUrl, setNewImageUrl] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const raw = localStorage.getItem("nuvio_user");
    if (!raw) return router.replace("/login");

    try {
      const u = JSON.parse(raw);
      setUser({ name: u.name, email: u.email, role: u.role });

      // si es superadmin, lo sacamos del panel cliente
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

  async function refresh() {
    try {
      setLoading(true);
      setErr(null);

      const data = await listCategories();
      setCategories(data.categories ?? []);

      // warning de delete: contar productos por categoria
      const prods = await listProducts();
      const map: Record<number, number> = {};
      (prods.products ?? []).forEach((p: any) => {
        if (p.categoryId != null) map[p.categoryId] = (map[p.categoryId] ?? 0) + 1;
      });
      setCatProductCount(map);
    } catch (e: any) {
      const msg = e?.message || "No se pudieron cargar las categorías";
      setErr(msg);
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


  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();

    return [...categories]
      .filter((c) => {
        if (statusFilter === "ALL") return true;
        if (statusFilter === "ACTIVE") return !!c.isActive;
        return !c.isActive;
      })
      .filter((c) => (qq ? c.name.toLowerCase().includes(qq) : true))
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id);
  }, [categories, q, statusFilter]);

  const activeList = useMemo(() => filtered.filter((c) => c.isActive), [filtered]);
  const inactiveList = useMemo(() => filtered.filter((c) => !c.isActive), [filtered]);

  const activeCount = useMemo(() => categories.filter((c) => c.isActive).length, [categories]);
  const inactiveCount = useMemo(() => categories.filter((c) => !c.isActive).length, [categories]);

  async function onCreate() {
    const name = newName.trim();
    if (!name) return;

    const sortOrderNum = Number(newSortOrder);
    if (Number.isNaN(sortOrderNum)) return notify.error("El orden debe ser un número.");

    try {
      setLoading(true);
      setErr(null);

      await createCategory({
        name,
        sortOrder: sortOrderNum,
        imageUrl: newImageUrl.trim() ? newImageUrl.trim() : null,
      } as any);

      setNewName("");
      setNewSortOrder("0");
      setNewImageUrl("");

      notify.success("Categoría creada ✅");
      await refresh();
    } catch (e: any) {
      const msg = e?.message || "Error creando categoría.";
      setErr(msg);
      notify.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function onPatch(
    id: number,
    patch: Partial<Pick<Category, "name" | "imageUrl" | "sortOrder" | "isActive">>
  ) {
    try {
      setErr(null);
      const updated = await updateCategory(id, patch);
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
      notify.success("Categoría actualizada ✅");
    } catch (e: any) {
      const msg = e?.message || "Error actualizando categoría.";
      setErr(msg);
      notify.error(msg);
    }
  }

  async function onToggle(cat: Category) {
    await onPatch(cat.id, { isActive: !cat.isActive });
  }

  async function onDelete(cat: Category) {
    const count = catProductCount[cat.id] ?? 0;

    const result = await MySwal.fire({
      title: "¿Eliminar categoría definitivamente?",
      html:
        count > 0
          ? `Esta categoría tiene <b>${count}</b> productos. Al borrarla, quedarán <b>sin categoría</b>.`
          : "Se eliminará de forma permanente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      setErr(null);
      await deleteCategory(cat.id);

      // optimista
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      setCatProductCount((prev) => {
        const copy = { ...prev };
        delete copy[cat.id];
        return copy;
      });

      notify.success("Categoría eliminada ✅");
    } catch (e: any) {
      const msg = e?.message || "Error eliminando categoría";
      setErr(msg);
      notify.error(msg);
    }
  }

  async function persistCategoryOrder(next: Category[]) {
    // seteo sortOrder 0..n SOLO para esta lista
    const normalized = next.map((c, idx) => ({ ...c, sortOrder: idx }));

    // optimistic
    setCategories((prev) =>
      prev.map((c) => {
        const found = normalized.find((x) => x.id === c.id);
        return found ? { ...c, sortOrder: found.sortOrder } : c;
      })
    );

    // persist solo los que cambiaron vs snapshot actual
    const changed = normalized.filter((c) => {
      const old = categories.find((x) => x.id === c.id);
      return (old?.sortOrder ?? 0) !== c.sortOrder;
    });

    if (changed.length === 0) return;

    try {
      await Promise.all(changed.map((c) => updateCategory(c.id, { sortOrder: c.sortOrder })));
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
        title="ABM Categorías"
        subtitle="Creá, editá, activá/desactivá, reordená y eliminá categorías."
        user={user}
        onLogout={handleLogout}
      />

      <main className="space-y-6">
        {/* top bar */}
        <div className="flex items-center justify-between gap-3">
          <Link href="/dashboard" className="text-sm text-indigo-300 hover:text-indigo-200 underline">
            ← Volver al dashboard
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
              <option value="ALL">Todas</option>
              <option value="ACTIVE">Activas</option>
              <option value="INACTIVE">Inactivas</option>
            </select>
          </div>
        </div>

        {err && (
          <Card>
            <p className="text-sm text-red-400">{err}</p>
          </Card>
        )}

        {/* stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <div className="text-xs text-slate-400">Total</div>
            <div className="text-2xl font-semibold text-slate-100">{categories.length}</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-400">Activas</div>
            <div className="text-2xl font-semibold text-slate-100">{activeCount}</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-400">Inactivas</div>
            <div className="text-2xl font-semibold text-slate-100">{inactiveCount}</div>
          </Card>
        </div>

        {/* crear */}
        <Card>
          <div className="grid gap-3 md:grid-cols-12">
            <div className="md:col-span-6">
              <label className="block text-sm text-slate-300 mb-1">Nombre</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej: Cafetería"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-slate-300 mb-1">Orden</label>
              <input
                value={newSortOrder}
                onChange={(e) => setNewSortOrder(e.target.value)}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-12">
              <ImagePicker
                label="Imagen de categoría (opcional)"
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
                {loading ? "Procesando..." : "Crear categoría"}
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
              <h2 className="text-sm font-semibold text-slate-100">Activas ({activeList.length})</h2>
              <p className="text-xs text-slate-400">Arrastrá “≡” para reordenar.</p>
            </div>

            {activeList.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">No hay categorías activas.</p>
            ) : (
              <SortableList
                dragGroup="categories-active"
                items={activeList}
                getId={(c) => c.id}
                className="mt-3 space-y-2"
                onReorder={(next) => persistCategoryOrder(next)}
                renderItem={({ item: c, draggableProps, handleProps }) => (
                  <CategoryRow
                    key={c.id}
                    category={c}
                    onPatch={onPatch}
                    onToggle={onToggle}
                    onDelete={onDelete}
                    productCount={catProductCount[c.id] ?? 0}
                    draggableProps={draggableProps}
                    handleProps={handleProps}
                  />
                )}
              />
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-100">Inactivas ({inactiveList.length})</h2>
              <p className="text-xs text-slate-400">Arrastrá “≡” para reordenar.</p>
            </div>

            {inactiveList.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">No hay categorías inactivas.</p>
            ) : (
              <SortableList
                dragGroup="categories-inactive"
                items={inactiveList}
                getId={(c) => c.id}
                className="mt-3 space-y-2"
                onReorder={(next) => persistCategoryOrder(next)}
                renderItem={({ item: c, draggableProps, handleProps }) => (
                  <CategoryRow
                    key={c.id}
                    category={c}
                    onPatch={onPatch}
                    onToggle={onToggle}
                    onDelete={onDelete}
                    productCount={catProductCount[c.id] ?? 0}
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

function CategoryRow({
  category,
  onPatch,
  onToggle,
  onDelete,
  productCount,
  draggableProps,
  handleProps,
}: {
  category: Category;
  onPatch: (
    id: number,
    patch: Partial<Pick<Category, "name" | "imageUrl" | "sortOrder" | "isActive">>
  ) => void;
  onToggle: (c: Category) => void;
  onDelete: (c: Category) => void;
  productCount: number;
  draggableProps: React.HTMLAttributes<HTMLElement>;
  handleProps: React.HTMLAttributes<HTMLElement>;
}) {
  const [editing, setEditing] = useState(false);

  const [name, setName] = useState(category.name);
  const [imageUrl, setImageUrl] = useState(category.imageUrl ?? "");
  const [sortOrder, setSortOrder] = useState(String(category.sortOrder ?? 0));

  // ✅ preview dentro de la fila
  const imgSrc = category.imageUrl ? resolveMediaUrl(category.imageUrl) : null;

  function save() {
    setEditing(false);
    onPatch(category.id, {
      name: name.trim(),
      imageUrl: imageUrl.trim() ? imageUrl.trim() : null,
      sortOrder: Number(sortOrder) || 0,
    });
  }

  const badge =
    category.isActive
      ? "border-emerald-800 bg-emerald-950/40 text-emerald-200"
      : "border-slate-700 bg-slate-900 text-slate-300";

  return (
    <div {...draggableProps} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 space-y-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex items-start gap-3">
          <span {...handleProps}>≡</span>

          {imgSrc ? (
            <img
              src={imgSrc}
              alt={category.name}
              className="h-12 w-12 rounded-lg object-cover border border-slate-800"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="h-12 w-12 rounded-lg border border-slate-800 bg-slate-900/40" />
          )}

          <div className="min-w-0">
            {!editing ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-100 font-medium truncate">{category.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${badge}`}>
                  {category.isActive ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>
            ) : (
              <input
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}

            <div className="mt-1 text-xs text-slate-400 flex flex-wrap gap-3">
              <span>
                Orden: <span className="font-mono text-slate-300">{category.sortOrder ?? 0}</span>
              </span>
              <span>
                ID: <span className="font-mono text-slate-300">{category.id}</span>
              </span>
              {productCount > 0 ? <span className="text-amber-300">· {productCount} productos</span> : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
            >
              Editar
            </button>
          ) : (
            <>
              <button
                onClick={save}
                className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white"
              >
                Guardar
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setName(category.name);
                  setImageUrl(category.imageUrl ?? "");
                  setSortOrder(String(category.sortOrder ?? 0));
                }}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
              >
                Cancelar
              </button>
            </>
          )}

          <button
            onClick={() => onToggle(category)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
          >
            {category.isActive ? "Desactivar" : "Activar"}
          </button>

          <button
            onClick={() => onDelete(category)}
            className="rounded-lg border border-red-800 bg-red-950/40 px-3 py-1.5 text-sm text-red-200 hover:bg-red-950/60"
          >
            Eliminar
          </button>
        </div>
      </div>

      {editing ? (
        <div className="grid gap-3 md:grid-cols-12">
          <div className="md:col-span-3">
            <label className="block text-xs text-slate-400 mb-1">Orden</label>
            <input
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div className="md:col-span-9">
            <ImagePicker
              label="Imagen de categoría (opcional)"
              value={imageUrl}
              onChange={setImageUrl}
              hint="Subí una imagen o pegá un link (no mostramos la URL)."
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
