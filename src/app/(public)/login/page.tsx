"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await signIn("credentials", { email, password, redirect: false });
    setSubmitting(false);

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-col gap-6 px-4 py-20">
      <div>
        <div className="eyebrow mb-2">Admin</div>
        <h1 className="text-3xl leading-none">Sign in</h1>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-mono text-[11px] uppercase tracking-wide text-faint">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-[var(--radius-control)] border border-line bg-surface px-3 py-2 outline-none focus:border-brand"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-mono text-[11px] uppercase tracking-wide text-faint">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-[var(--radius-control)] border border-line bg-surface px-3 py-2 outline-none focus:border-brand"
          />
        </label>
        {error && <p className="text-sm text-loss">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-[var(--radius-control)] bg-brand px-3 py-2.5 font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
