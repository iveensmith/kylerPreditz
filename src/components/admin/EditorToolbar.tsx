"use client";

import { useState, type ReactNode } from "react";
import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Code2, Eraser, Image as ImageIcon,
  Italic, Link2, Link2Off, List, ListOrdered, Minus, Quote, Redo2, Strikethrough, Subscript,
  Superscript, Table as TableIcon, Underline, Undo2,
} from "lucide-react";
import { adminInput } from "@/lib/admin-ui";

function Btn({ label, active, disabled, onClick, children }: {
  label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      // mousedown keeps the editor selection; click then runs the command
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`grid h-8 w-8 place-items-center rounded-md transition-colors disabled:opacity-30 ${
        active ? "bg-brand text-white" : "text-ink hover:bg-line"
      }`}
    >
      {children}
    </button>
  );
}

const Sep = () => <span className="mx-1 h-5 w-px bg-line" aria-hidden />;

export function EditorToolbar({ editor, source, onToggleSource }: {
  editor: Editor; source: boolean; onToggleSource: () => void;
}) {
  const [urlMode, setUrlMode] = useState<"link" | "image" | null>(null);
  const [url, setUrl] = useState("");

  // Re-render the toolbar when the selection or formatting changes.
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"), italic: e.isActive("italic"), underline: e.isActive("underline"),
      strike: e.isActive("strike"), sub: e.isActive("subscript"), sup: e.isActive("superscript"),
      bullet: e.isActive("bulletList"), ordered: e.isActive("orderedList"), quote: e.isActive("blockquote"),
      link: e.isActive("link"), table: e.isActive("table"),
      heading: e.isActive("heading", { level: 2 }) ? "2" : e.isActive("heading", { level: 3 }) ? "3"
        : e.isActive("heading", { level: 4 }) ? "4" : "0",
      canUndo: e.can().undo(), canRedo: e.can().redo(),
    }),
  });

  const chain = () => editor.chain().focus();
  const off = source;

  function applyUrl() {
    const value = url.trim();
    if (value) {
      if (urlMode === "link") chain().extendMarkRange("link").setLink({ href: value }).run();
      else if (urlMode === "image") chain().setImage({ src: value }).run();
    }
    setUrl("");
    setUrlMode(null);
  }

  return (
    <div className="flex flex-col gap-2 rounded-t-[var(--radius-control)] border border-line bg-surface-2 p-2">
      <div className="flex flex-wrap items-center gap-0.5">
        <button
          type="button"
          onClick={onToggleSource}
          aria-pressed={source}
          className={`mr-1 flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium ${source ? "bg-brand text-white" : "hover:bg-line"}`}
        >
          <Code2 size={16} /> Source
        </button>
        <Sep />
        <Btn label="Undo" disabled={off || !s.canUndo} onClick={() => chain().undo().run()}><Undo2 size={16} /></Btn>
        <Btn label="Redo" disabled={off || !s.canRedo} onClick={() => chain().redo().run()}><Redo2 size={16} /></Btn>
        <Sep />
        <Btn label="Bold" active={s.bold} disabled={off} onClick={() => chain().toggleBold().run()}><Bold size={16} /></Btn>
        <Btn label="Italic" active={s.italic} disabled={off} onClick={() => chain().toggleItalic().run()}><Italic size={16} /></Btn>
        <Btn label="Underline" active={s.underline} disabled={off} onClick={() => chain().toggleUnderline().run()}><Underline size={16} /></Btn>
        <Btn label="Strikethrough" active={s.strike} disabled={off} onClick={() => chain().toggleStrike().run()}><Strikethrough size={16} /></Btn>
        <Btn label="Subscript" active={s.sub} disabled={off} onClick={() => chain().toggleSubscript().run()}><Subscript size={16} /></Btn>
        <Btn label="Superscript" active={s.sup} disabled={off} onClick={() => chain().toggleSuperscript().run()}><Superscript size={16} /></Btn>
        <Btn label="Clear formatting" disabled={off} onClick={() => chain().unsetAllMarks().clearNodes().run()}><Eraser size={16} /></Btn>
        <Sep />
        <select
          aria-label="Text format"
          disabled={off}
          value={s.heading}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "0") chain().setParagraph().run();
            else chain().toggleHeading({ level: Number(v) as 2 | 3 | 4 }).run();
          }}
          className="h-8 rounded-md border border-line bg-surface px-1.5 text-xs disabled:opacity-30"
        >
          <option value="0">Paragraph</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
          <option value="4">Heading 4</option>
        </select>
        <Sep />
        <Btn label="Bulleted list" active={s.bullet} disabled={off} onClick={() => chain().toggleBulletList().run()}><List size={16} /></Btn>
        <Btn label="Numbered list" active={s.ordered} disabled={off} onClick={() => chain().toggleOrderedList().run()}><ListOrdered size={16} /></Btn>
        <Btn label="Quote" active={s.quote} disabled={off} onClick={() => chain().toggleBlockquote().run()}><Quote size={16} /></Btn>
        <Sep />
        <Btn label="Align left" disabled={off} onClick={() => chain().setTextAlign("left").run()}><AlignLeft size={16} /></Btn>
        <Btn label="Align center" disabled={off} onClick={() => chain().setTextAlign("center").run()}><AlignCenter size={16} /></Btn>
        <Btn label="Align right" disabled={off} onClick={() => chain().setTextAlign("right").run()}><AlignRight size={16} /></Btn>
        <Btn label="Justify" disabled={off} onClick={() => chain().setTextAlign("justify").run()}><AlignJustify size={16} /></Btn>
        <Sep />
        <Btn label="Add link" active={s.link} disabled={off} onClick={() => setUrlMode("link")}><Link2 size={16} /></Btn>
        <Btn label="Remove link" disabled={off || !s.link} onClick={() => chain().extendMarkRange("link").unsetLink().run()}><Link2Off size={16} /></Btn>
        <Btn label="Insert image" disabled={off} onClick={() => setUrlMode("image")}><ImageIcon size={16} /></Btn>
        <Btn label="Insert table" disabled={off} onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><TableIcon size={16} /></Btn>
        <Btn label="Horizontal line" disabled={off} onClick={() => chain().setHorizontalRule().run()}><Minus size={16} /></Btn>
      </div>

      {s.table && !off && (
        <div className="flex flex-wrap gap-1 text-xs">
          {[
            ["Add row", () => chain().addRowAfter().run()],
            ["Add column", () => chain().addColumnAfter().run()],
            ["Delete row", () => chain().deleteRow().run()],
            ["Delete column", () => chain().deleteColumn().run()],
            ["Delete table", () => chain().deleteTable().run()],
          ].map(([label, run]) => (
            <button key={label as string} type="button" onClick={run as () => void} className="rounded-md border border-line bg-surface px-2 py-1 hover:bg-line">
              {label as string}
            </button>
          ))}
        </div>
      )}

      {urlMode && (
        <div className="flex gap-2">
          <input
            autoFocus
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); applyUrl(); }
              if (e.key === "Escape") { setUrl(""); setUrlMode(null); }
            }}
            placeholder={urlMode === "link" ? "https://… or /blog/your-post (internal)" : "Image URL (https://…)"}
            className={`${adminInput} flex-1`}
          />
          <button type="button" onClick={applyUrl} className="rounded-md bg-brand px-3 text-xs font-semibold text-white">
            {urlMode === "link" ? "Add link" : "Insert"}
          </button>
          <button type="button" onClick={() => { setUrl(""); setUrlMode(null); }} className="rounded-md border border-line px-3 text-xs">
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
