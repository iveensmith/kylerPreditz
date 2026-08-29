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
        className="shrink-0 rounded-full object-cover bg-zinc-100 dark:bg-zinc-800 ring-1 ring-zinc-200 dark:ring-zinc-700"
      />
    );
  }

  return (
    <span
      className="shrink-0 inline-flex items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 ring-1 ring-zinc-200 dark:ring-zinc-700 font-medium"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
