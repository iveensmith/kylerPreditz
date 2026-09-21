export type LinkType = "url" | "internal" | "email";
export type LinkFormValue = {
  type: LinkType;
  protocol: "https://" | "http://";
  url: string;
};

/** Build the final href from the dialog fields. Returns null when the address is empty. */
export function composeHref({ type, protocol, url }: LinkFormValue): string | null {
  const value = url.trim();
  if (!value) return null;
  if (type === "email") return `mailto:${value.replace(/^mailto:/i, "")}`;
  if (type === "internal") return value.startsWith("/") || value.startsWith("#") ? value : `/${value}`;
  // A pasted full address (or mailto:) is kept as-is; otherwise add the chosen protocol.
  if (/^(https?:\/\/|mailto:)/i.test(value)) return value;
  return `${protocol}${value.replace(/^\/+/, "")}`;
}

/** Split an existing href back into dialog fields (for editing a link). */
export function parseHref(href: string | null | undefined): LinkFormValue {
  const h = (href ?? "").trim();
  if (h.startsWith("mailto:")) return { type: "email", protocol: "https://", url: h.slice(7) };
  if ((h.startsWith("/") && !h.startsWith("//")) || h.startsWith("#")) {
    return { type: "internal", protocol: "https://", url: h };
  }
  const m = h.match(/^(https?:\/\/)(.*)$/i);
  if (m) return { type: "url", protocol: m[1].toLowerCase() as "https://" | "http://", url: m[2] };
  return { type: "url", protocol: "https://", url: h };
}
