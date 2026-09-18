import Link from "next/link";
import { confirmVerification } from "@/lib/actions/verify-email";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function VerifyEmailPage({ searchParams }: PageProps<"/verify-email">) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;

  const result = token ? await confirmVerification(token) : { ok: false as const, error: "Missing verification token." };

  return (
    <main className="mx-auto flex w-full max-w-sm flex-col gap-6 px-4 py-20">
      <PageHeader eyebrow="Account" title={result.ok ? "Email verified" : "Verification failed"} />
      {result.ok ? (
        <p className="text-sm text-muted">
          Your email is confirmed. Premium purchases are now unlocked on your{" "}
          <Link href="/dashboard" className="text-brand underline">
            dashboard
          </Link>
          .
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-loss">{result.error}</p>
          <p className="text-sm text-muted">
            Go to your{" "}
            <Link href="/dashboard" className="text-brand underline">
              dashboard
            </Link>{" "}
            to request a new verification link.
          </p>
        </div>
      )}
    </main>
  );
}
