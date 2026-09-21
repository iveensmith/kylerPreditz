"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { adminInput } from "@/lib/admin-ui";
import { MAX_TAGS, MAX_TAG_LENGTH, parseTags } from "@/lib/tags";

/** Type a tag and press comma (or Enter) to add it. Submits as a comma-separated `tags` field. */
export function TagInput({ defaultTags = [] }: { defaultTags?: string[] }) {
  const [tags, setTags] = useState<string[]>(defaultTags);
  const [draft, setDraft] = useState("");

  function commit(raw: string) {
    setTags((prev) => parseTags([...prev, raw].join(",")));
    setDraft("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "," || e.key === "Enter") {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Backspace" && !draft) {
      setTags((prev) => prev.slice(0, -1));
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name="tags" value={tags.join(",")} />
      {tags.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li key={tag} className="flex items-center gap-1 rounded-full border border-line bg-surface-2 py-0.5 pl-2.5 pr-1 text-xs">
              {tag}
              <button
                type="button"
                aria-label={`Remove tag ${tag}`}
                onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                className="rounded-full p-0.5 text-muted hover:bg-line hover:text-ink"
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value.replace(",", ""))}
        onKeyDown={onKeyDown}
        onBlur={() => draft.trim() && commit(draft)}
        maxLength={MAX_TAG_LENGTH}
        disabled={tags.length >= MAX_TAGS}
        placeholder={tags.length >= MAX_TAGS ? `Maximum ${MAX_TAGS} tags` : "Type tag and press comma"}
        className={adminInput}
      />
      <p className="text-xs text-muted">Type a tag and press comma to add it.</p>
    </div>
  );
}
