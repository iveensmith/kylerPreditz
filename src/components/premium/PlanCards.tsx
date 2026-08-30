import Link from "next/link";
import { PLAN_LIST, formatNaira } from "@/lib/plans.config";

/**
 * The three subscription plans with prices. When `subscribable` is true each
 * card links to the checkout route (which 303s to Paystack); otherwise it
 * points the visitor at registration first.
 */
export function PlanCards({ subscribable }: { subscribable: boolean }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {PLAN_LIST.map((p) => (
        <div key={p.plan} className="flex flex-col gap-2 rounded-xl border border-line p-4">
          <div className="font-semibold text-ink">{p.label}</div>
          <div className="font-mono text-xl font-semibold tabular-nums text-ink">
            {formatNaira(p.priceNaira)}
            {p.durationDays && (
              <span className="ml-1 text-xs font-normal text-muted">
                / {p.durationDays === 7 ? "week" : "month"}
              </span>
            )}
          </div>
          <p className="text-xs text-muted">{p.blurb}</p>
          <div className="mt-auto pt-2">
            {subscribable ? (
              <a
                href={`/api/paystack/checkout?plan=${p.plan}`}
                className="block w-full rounded-[var(--radius-control)] bg-brand px-3 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
              >
                Subscribe
              </a>
            ) : (
              <Link
                href="/register?next=/vip"
                className="block w-full rounded-[var(--radius-control)] bg-brand px-3 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
              >
                Get started
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
