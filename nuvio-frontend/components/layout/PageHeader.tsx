"use client";

type HeaderUser = {
  name: string;
  email: string;
};

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  user?: HeaderUser;
  onLogout?: () => void;
};

export function PageHeader({ title, subtitle, user, onLogout }: PageHeaderProps) {
  return (
    <header className="border-b border-slate-800 pb-4">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
        </div>

        {user && (
          <div className="flex items-center gap-3 text-sm">
            <div className="text-right">
              <div className="font-medium text-slate-100">{user.name}</div>
              <div className="text-slate-400">{user.email}</div>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-slate-200 hover:bg-slate-800"
              >
                Cerrar sesión
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
