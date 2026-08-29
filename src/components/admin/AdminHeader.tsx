import type { ReactNode } from "react";

export function AdminHeader({
  eyebrow = "Admin",
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-end justify-between gap-4 border-b border-line pb-4">
      <div>
        <div className="eyebrow mb-1.5">{eyebrow}</div>
        <h1 className="text-[1.75rem] leading-none sm:text-3xl">{title}</h1>
      </div>
      {action && <div className="shrink-0 pb-0.5">{action}</div>}
    </header>
  );
}
