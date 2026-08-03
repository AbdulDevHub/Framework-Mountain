import type { ReactNode } from "react";

export function PageContainer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main className={`mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 ${className ?? ""}`}>
      {children}
    </main>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}