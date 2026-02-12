// components/modals/ManageSectionsModal.tsx
"use client";

import { useEffect, useState } from "react";
import { notify } from "@/lib/notify";
import {
  listSections,
  createSection,
  updateSection,
  deleteSection,
  type Section,
} from "@/lib/api";

type Props = {
  categoryId: number;
  categoryName: string;
  isOpen: boolean;
  onClose: () => void;
};

export function ManageSectionsModal({ categoryId, categoryName, isOpen, onClose }: Props) {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(false);

  // Crear nueva sección
  const [newName, setNewName] = useState("");
  const [newSortOrder, setNewSortOrder] = useState("0");

  // Edición inline
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editSortOrder, setEditSortOrder] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadSections();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, categoryId]);

  async function loadSections() {
    try {
      setLoading(true);
      const data = await listSections(categoryId);
      setSections(data);
    } catch (err: any) {
      notify.error(err.message || "Error cargando secciones");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newName.trim()) {
      notify.error("El nombre es obligatorio");
      return;
    }

    try {
      setLoading(true);
      await createSection(categoryId, {
        name: newName.trim(),
        sortOrder: Number(newSortOrder) || 0,
      });
      setNewName("");
      setNewSortOrder("0");
      notify.success("Sección creada ✅");
      await loadSections();
    } catch (err: any) {
      notify.error(err.message || "Error creando sección");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(sectionId: number) {
    try {
      setLoading(true);
      await updateSection(sectionId, {
        name: editName.trim(),
        sortOrder: Number(editSortOrder) || 0,
      });
      setEditingId(null);
      notify.success("Sección actualizada ✅");
      await loadSections();
    } catch (err: any) {
      notify.error(err.message || "Error actualizando sección");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(sectionId: number) {
    if (!confirm("¿Eliminar esta sección? Los productos quedarán sin sección.")) return;

    try {
      setLoading(true);
      await deleteSection(sectionId);
      notify.success("Sección eliminada ✅");
      await loadSections();
    } catch (err: any) {
      notify.error(err.message || "Error eliminando sección");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(section: Section) {
    setEditingId(section.id);
    setEditName(section.name);
    setEditSortOrder(String(section.sortOrder));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditSortOrder("");
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-100">Gestionar Secciones</h2>
              <p className="text-sm text-slate-400 mt-1">Categoría: {categoryName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Crear nueva sección */}
          <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-200">Nueva Sección</h3>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-8">
                <label className="block text-xs text-slate-400 mb-1">Nombre</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej: Gaseosas"
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div className="col-span-4">
                <label className="block text-xs text-slate-400 mb-1">Orden</label>
                <input
                  type="number"
                  value={newSortOrder}
                  onChange={(e) => setNewSortOrder(e.target.value)}
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <button
              onClick={handleCreate}
              disabled={loading || !newName.trim()}
              className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2 text-sm font-medium text-white"
            >
              {loading ? "Creando..." : "Crear Sección"}
            </button>
          </div>

          {/* Lista de secciones */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-200">
              Secciones ({sections.length})
            </h3>

            {sections.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">
                No hay secciones creadas. Creá una para organizar tus productos.
              </p>
            ) : (
              <div className="space-y-2">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    className="bg-slate-800/50 rounded-lg border border-slate-700 p-3"
                  >
                    {editingId === section.id ? (
                      // Modo edición
                      <div className="space-y-3">
                        <div className="grid grid-cols-12 gap-3">
                          <div className="col-span-8">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div className="col-span-4">
                            <input
                              type="number"
                              value={editSortOrder}
                              onChange={(e) => setEditSortOrder(e.target.value)}
                              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdate(section.id)}
                            className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Modo vista
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-100">
                              {section.name}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                section.isActive
                                  ? "bg-emerald-950/40 text-emerald-200 border border-emerald-800"
                                  : "bg-slate-900 text-slate-300 border border-slate-700"
                              }`}
                            >
                              {section.isActive ? "ACTIVA" : "INACTIVA"}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            Orden: {section.sortOrder} · ID: {section.id}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(section)}
                            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(section.id)}
                            className="rounded-lg border border-red-800 bg-red-950/40 px-3 py-1.5 text-sm text-red-200 hover:bg-red-950/60"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}