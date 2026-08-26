import Image from "next/image";

export function TeamBadge({ name, logoUrl, size = 20 }: { name: string; logoUrl: string | null; size?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 min-w-0">
      {logoUrl ? (
        <Image src={logoUrl} alt={`${name} logo`} width={size} height={size} className="shrink-0" />
      ) : (
        <span
          className="shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-700"
          style={{ width: size, height: size }}
          aria-hidden
        />
      )}
      <span className="truncate">{name}</span>
    </span>
  );
}
