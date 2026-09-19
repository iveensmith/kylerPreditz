import { getActivePartners } from "@/lib/partners";

/** Sponsors / partners strip in the footer. Renders nothing when there are no active partners. */
export async function FooterPartners() {
  const partners = await getActivePartners();
  if (partners.length === 0) return null;

  return (
    <div className="mb-12 border-b border-white/10 pb-10">
      <h3 className="mb-5 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
        Our partners
      </h3>
      <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-5">
        {partners.map((p) => (
          <li key={p.id}>
            <a
              href={p.url}
              target="_blank"
              rel={p.sponsored ? "sponsored nofollow noopener noreferrer" : "noopener noreferrer"}
              title={p.description ?? p.name}
              className="flex flex-col items-center gap-1.5 text-white/60 transition-colors hover:text-white"
            >
              {p.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- arbitrary partner-hosted logo; not worth the image optimizer
                <img src={p.logoUrl} alt={p.name} loading="lazy" className="h-9 w-auto max-w-[9rem] object-contain" />
              ) : (
                <span className="text-sm font-semibold">{p.name}</span>
              )}
              {p.description && <span className="max-w-[11rem] text-center text-[11px] leading-snug text-white/40">{p.description}</span>}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
