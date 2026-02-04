"use client";

import React, { useMemo, useState } from "react";

type Id = string | number;

function moveItem<T>(arr: T[], fromIndex: number, toIndex: number) {
  const copy = [...arr];
  const [item] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, item);
  return copy;
}

export function SortableList<T>({
  items,
  getId,
  className,
  renderItem,
  onReorder,
  dragGroup,
}: {
  items: T[];
  getId: (item: T) => Id;
  className?: string;
  dragGroup: string; // para evitar drops cruzados
  renderItem: (args: {
    item: T;
    isDragging: boolean;
    draggableProps: React.HTMLAttributes<HTMLElement>;
    handleProps: React.HTMLAttributes<HTMLElement>;
  }) => React.ReactNode;
  onReorder: (nextItems: T[]) => void;
}) {
  const [dragId, setDragId] = useState<Id | null>(null);
  const [overId, setOverId] = useState<Id | null>(null);

  const idToIndex = useMemo(() => {
    const map = new Map<Id, number>();
    items.forEach((it, idx) => map.set(getId(it), idx));
    return map;
  }, [items, getId]);

  function onDropInternal(targetId: Id) {
    if (dragId == null) return;
    const from = idToIndex.get(dragId);
    const to = idToIndex.get(targetId);
    if (from == null || to == null) return;
    if (from === to) return;

    const next = moveItem(items, from, to);
    onReorder(next);

    setDragId(null);
    setOverId(null);
  }

  return (
    <div className={className}>
      {items.map((item) => {
        const id = getId(item);
        const isDragging = dragId === id;

        const draggableProps: React.HTMLAttributes<HTMLElement> = {
          draggable: true,
          onDragStart: (e) => {
            setDragId(id);
            e.dataTransfer.setData("text/plain", JSON.stringify({ id, dragGroup }));
            e.dataTransfer.effectAllowed = "move";
          },
          onDragOver: (e) => {
            // permitir drop
            e.preventDefault();
            setOverId(id);
          },
          onDrop: (e) => {
            e.preventDefault();
            try {
              const payload = JSON.parse(e.dataTransfer.getData("text/plain") || "{}");
              if (payload?.dragGroup !== dragGroup) return;
            } catch {}
            onDropInternal(id);
          },
        };

        const handleProps: React.HTMLAttributes<HTMLElement> = {
          title: "Arrastrar para reordenar",
          className:
            "cursor-grab select-none rounded-md border border-slate-800 bg-slate-900/40 px-2 py-1 text-slate-300 hover:bg-slate-900 active:cursor-grabbing",
          onMouseDown: () => {
            // solo UX; el drag lo hace el container igual
          },
        };

        return (
          <div
            key={String(id)}
            className={[
              overId === id && dragId !== id ? "ring-2 ring-indigo-600/40" : "",
              isDragging ? "opacity-60" : "",
            ].join(" ")}
          >
            {renderItem({ item, isDragging, draggableProps, handleProps })}
          </div>
        );
      })}
    </div>
  );
}
