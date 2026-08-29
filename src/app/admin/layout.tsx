import { requireAdmin } from "@/lib/auth-guard";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { AdminNav } from "@/components/admin/AdminNav";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-white/10 bg-[#08110D] px-4 py-2.5 text-white">
        <div className="flex items-center gap-5">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
            Admin
          </span>
          <AdminNav />
        </div>
        <div className="flex items-center gap-3 text-sm text-white/55">
          <ThemeToggle className="text-white/55 hover:text-white hover:!bg-white/8" />
          <span className="hidden font-mono text-xs sm:inline">{session.user.email}</span>
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
}
