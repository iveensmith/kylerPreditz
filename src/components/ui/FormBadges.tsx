import { formLetters } from "@/lib/format";

const COLOR: Record<"W" | "D" | "L", string> = {
  W: "bg-win/15 text-win",
  D: "bg-surface-2 text-muted",
  L: "bg-loss/15 text-loss",
};

export function FormBadges({ form }: { form: string | null | undefined }) {
  const letters = formLetters(form);
  if (letters.length === 0) return null;

  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Recent form: ${letters.join(", ")}`}>
      {letters.map((letter, i) => (
        <span
          key={i}
          className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-[3px] text-[9px] font-bold leading-none ${COLOR[letter]}`}
        >
          {letter}
        </span>
      ))}
    </span>
  );
}
