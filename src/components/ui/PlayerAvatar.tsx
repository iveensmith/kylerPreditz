import Image from "next/image";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** Circular player headshot with an initials fallback. Photos come from API-Football. */
export function PlayerAvatar({ name, photoUrl, size = 28 }: { name: string; photoUrl: string | null; size?: number }) {
  if (photoUrl) {
    return (
      <Image
        src={photoUrl}
        alt={name}
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover bg-surface-2 ring-1 ring-line"
      />
    );
  }

  return (
    <span
      className="shrink-0 inline-flex items-center justify-center rounded-full bg-surface-2 text-muted ring-1 ring-line font-medium"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
