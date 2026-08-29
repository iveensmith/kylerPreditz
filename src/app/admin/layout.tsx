import Link from "next/link";
import { requireAdmin } from "@/lib/auth-guard";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/tips", label: "Tips" },
  { href: "/admin/leagues", label: "Leagues" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/subscribers", label: "Subscribers" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

  return (
    <div className="flex flex-col min-h-full">
      <header className="border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between">
        <nav className="flex gap-4 text-sm">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:underline">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
          <ThemeToggle />
          <span>{session.user.email}</span>
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">{children}</main>
    </div>
  );
}
