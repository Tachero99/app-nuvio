import { ReactNode } from "react";

interface CardProps {
  title?: string;
  right?: ReactNode;   // contenido alineado a la derecha (precio, acciones, etc)
  children: ReactNode;
}

/**
 * Tarjeta básica reutilizable para secciones del dashboard.
 */
export function Card({ title, right, children }: CardProps) {
  return (
    <section className="border border-slate-800 rounded-xl bg-slate-900/40 px-4 py-3">
      {(title || right) && (
        <header className="mb-2 flex items-center justify-between gap-2">
          {title && (
            <h2 className="text-sm font-semibold text-slate-100">
              {title}
            </h2>
          )}
          {right && <div className="text-xs text-slate-400">{right}</div>}
        </header>
      )}
      {children}
    </section>
  );
}
