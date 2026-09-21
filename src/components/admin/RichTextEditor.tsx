"use client";

import { useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import { TableKit } from "@tiptap/extension-table";
import { adminInput } from "@/lib/admin-ui";
import { EditorToolbar } from "@/components/admin/EditorToolbar";

/**
 * WYSIWYG body editor. The HTML it produces is submitted as the `body` field and is
 * sanitized again with an allowlist on render (see renderPostBody), never trusted as-is.
 */
export function RichTextEditor({ initialHtml }: { initialHtml: string }) {
  const [html, setHtml] = useState(initialHtml);
  const [source, setSource] = useState(false);

  const editor = useEditor({
    immediatelyRender: false, // avoids an SSR hydration mismatch
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] }, link: { openOnClick: false } }),
      Image,
      Subscript,
      Superscript,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TableKit,
    ],
    content: initialHtml,
    editorProps: {
      attributes: {
        class:
          "prose prose-zinc max-w-none min-h-[22rem] px-4 py-3 outline-none focus:outline-none prose-img:rounded-lg prose-table:border prose-th:border prose-td:border prose-th:px-2 prose-td:px-2",
      },
    },
    // An empty editor reports "<p></p>"; send "" so the server's required-body check works.
    onUpdate: ({ editor: e }) => setHtml(e.isEmpty ? "" : e.getHTML()),
  });

  function toggleSource() {
    if (!editor) return;
    if (source) editor.commands.setContent(html, { emitUpdate: false });
    setSource(!source);
  }

  return (
    <div className="flex flex-col">
      <input type="hidden" name="body" value={html} />
      {editor ? (
        <EditorToolbar editor={editor} source={source} onToggleSource={toggleSource} />
      ) : (
        <div className="h-12 rounded-t-[var(--radius-control)] border border-line bg-surface-2" />
      )}
      {source ? (
        <textarea
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          rows={18}
          spellCheck={false}
          aria-label="Article HTML source"
          className={`${adminInput} rounded-t-none border-t-0 font-mono text-xs`}
        />
      ) : (
        <div className="rounded-b-[var(--radius-control)] border border-t-0 border-line bg-surface">
          <EditorContent editor={editor} />
        </div>
      )}
    </div>
  );
}
