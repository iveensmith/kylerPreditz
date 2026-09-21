"use client";

import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { X } from "lucide-react";
import { adminInput, adminLabel, adminLabelText } from "@/lib/admin-ui";
import { MAX_IMAGE_BYTES } from "@/lib/image-upload";
import { composeHref, parseHref, type LinkType } from "@/lib/link-form";

type Tab = "info" | "target" | "upload" | "advanced";
const TABS: [Tab, string][] = [["info", "Link Info"], ["target", "Target"], ["upload", "Upload"], ["advanced", "Advanced"]];
const INTERNAL_SUGGESTIONS = ["/", "/blog", "/leagues", "/results"];

/** Link dialog for the article editor: text, type (URL / internal page / email), target, upload, advanced. */
export function LinkDialog({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const existing = editor.getAttributes("link");
  const selection = editor.state.selection;
  const selectedText = selection.empty ? "" : editor.state.doc.textBetween(selection.from, selection.to, " ");
  const initial = parseHref(existing.href);

  const [tab, setTab] = useState<Tab>("info");
  const [text, setText] = useState(selectedText);
  const [type, setType] = useState<LinkType>(existing.href ? initial.type : "url");
  const [protocol, setProtocol] = useState(initial.protocol);
  const [url, setUrl] = useState(initial.url);
  const [target, setTarget] = useState<string>(existing.target ?? "");
  const [rel, setRel] = useState<string>(existing.rel ?? "");
  const [title, setTitle] = useState<string>(existing.title ?? "");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function upload(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (file.size > MAX_IMAGE_BYTES) return setError("File is larger than 2 MB");
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file, file.name);
      body.append("allowPdf", "1");
      const res = await fetch("/api/admin/upload-image", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setType("internal");
      setUrl(data.url);
      if (!text) setText(file.name);
      setTab("info");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function apply() {
    const href = composeHref({ type, protocol, url });
    if (!href) { setTab("info"); return setError("Enter the link address (URL)"); }
    const attrs = { href, target: target || null, rel: rel || null, title: title.trim() || null };
    const chain = editor.chain().focus();
    const inLink = editor.isActive("link");
    if (selection.empty && inLink) chain.extendMarkRange("link");

    const label = text.trim();
    const replacing = label && label !== selectedText;
    if (replacing || (selection.empty && !inLink)) {
      chain.insertContent({ type: "text", text: label || href, marks: [{ type: "link", attrs }] }).run();
    } else {
      chain.setLink(attrs).run();
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Link"
        onMouseDown={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-line bg-surface text-ink shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h3 className="text-sm font-semibold">Link</h3>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded p-1 hover:bg-line"><X size={16} /></button>
        </div>

        <div className="flex gap-1 border-b border-line px-3 pt-2" role="tablist">
          {TABS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`rounded-t-md border border-b-0 px-3 py-1.5 text-xs font-medium ${
                tab === id ? "border-line bg-surface text-ink" : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex min-h-[15rem] flex-col gap-4 overflow-y-auto p-4">
          {tab === "info" && (
            <>
              <label className={adminLabel}>
                <span className={adminLabelText}>Display text</span>
                <input value={text} onChange={(e) => setText(e.target.value)} className={adminInput} />
              </label>
              <label className={adminLabel}>
                <span className={adminLabelText}>Link type</span>
                <select value={type} onChange={(e) => setType(e.target.value as LinkType)} className={adminInput}>
                  <option value="url">URL (other website)</option>
                  <option value="internal">Internal page (this site)</option>
                  <option value="email">E-mail</option>
                </select>
              </label>
              <div className="flex gap-3">
                {type === "url" && (
                  <label className={`${adminLabel} w-28 shrink-0`}>
                    <span className={adminLabelText}>Protocol</span>
                    <select value={protocol} onChange={(e) => setProtocol(e.target.value as typeof protocol)} className={adminInput}>
                      <option value="https://">https://</option>
                      <option value="http://">http://</option>
                    </select>
                  </label>
                )}
                <label className={`${adminLabel} flex-1`}>
                  <span className={adminLabelText}>{type === "email" ? "E-mail address*" : type === "internal" ? "Page path*" : "URL*"}</span>
                  <input
                    autoFocus
                    list={type === "internal" ? "internal-pages" : undefined}
                    value={url}
                    onChange={(e) => { setUrl(e.target.value); setError(null); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); apply(); } }}
                    placeholder={type === "internal" ? "/blog/your-post" : type === "email" ? "name@example.com" : "example.com/page"}
                    className={adminInput}
                  />
                  <datalist id="internal-pages">
                    {INTERNAL_SUGGESTIONS.map((p) => <option key={p} value={p} />)}
                  </datalist>
                </label>
              </div>
            </>
          )}

          {tab === "target" && (
            <label className={adminLabel}>
              <span className={adminLabelText}>Target</span>
              <select value={target} onChange={(e) => setTarget(e.target.value)} className={adminInput}>
                <option value="">&lt;not set&gt; (other sites open in a new tab, our pages in the same tab)</option>
                <option value="_blank">New window (_blank)</option>
                <option value="_self">Same window (_self)</option>
              </select>
            </label>
          )}

          {tab === "upload" && (
            <div className="flex flex-col gap-3">
              <span className={adminLabelText}>Upload a file to link to</span>
              <input ref={fileRef} type="file" accept="application/pdf,image/jpeg,image/png,image/webp,image/gif" hidden onChange={(e) => upload(e.target.files?.[0])} />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="self-start rounded-md border border-line bg-surface-2 px-3 py-2 text-sm font-medium hover:bg-line disabled:opacity-50"
              >
                {uploading ? "Uploading…" : "Choose file"}
              </button>
              <p className="text-xs text-muted">PDF, JPG, PNG, WebP or GIF, up to 2 MB. The link address is filled in for you.</p>
            </div>
          )}

          {tab === "advanced" && (
            <>
              <label className={adminLabel}>
                <span className={adminLabelText}>Advisory title (tooltip)</span>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className={adminInput} />
              </label>
              <label className={adminLabel}>
                <span className={adminLabelText}>Relationship</span>
                <select value={rel} onChange={(e) => setRel(e.target.value)} className={adminInput}>
                  <option value="">&lt;not set&gt;</option>
                  <option value="nofollow">nofollow</option>
                  <option value="sponsored nofollow">sponsored nofollow (paid link)</option>
                  <option value="ugc nofollow">ugc nofollow (user content)</option>
                </select>
              </label>
            </>
          )}

          {error && <p role="alert" className="text-xs text-loss">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-line px-4 py-3">
          <button type="button" onClick={apply} className="rounded-md bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-hover">OK</button>
          <button type="button" onClick={onClose} className="rounded-md border border-line px-4 py-2 text-sm hover:bg-line">Cancel</button>
        </div>
      </div>
    </div>
  );
}
