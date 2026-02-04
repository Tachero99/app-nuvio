import { ReactNode } from "react";

interface PageShellProps {
  children: ReactNode;
}

/**
 * Contenedor general de páginas del panel:
 * fondo oscuro + color de texto base.
 */
export function PageShell({ children }: PageShellProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {children}
    </div>
  );
}
