"use client";

import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* overlay */}
      <button
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />

      {/* dialog */}
      <div className="relative w-[92vw] max-w-xl rounded-2xl border border-slate-800 bg-slate-950 shadow-xl">
        {(title ?? "").length > 0 && (
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
            <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
            >
              Cerrar
            </button>
          </div>
        )}

        <div className="px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}
