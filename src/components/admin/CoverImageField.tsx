"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { adminInput } from "@/lib/admin-ui";
import { MAX_IMAGE_BYTES } from "@/lib/image-upload";

const MAX_DIMENSION = 1600;

/** Shrink big photos in the browser (max 1600px, WebP) so uploads stay small. GIFs are left untouched. */
async function shrink(file: File): Promise<Blob> {
  if (file.type === "image/gif") return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
  return blob && blob.size < file.size ? blob : file;
}

/** Cover image: upload from your computer, or paste an image link. Submits as `coverImage`. */
export function CoverImageField({ defaultValue }: { defaultValue: string | null }) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPick(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const blob = await shrink(file);
      if (blob.size > MAX_IMAGE_BYTES) throw new Error("Image is still larger than 2 MB - choose a smaller one.");
      const body = new FormData();
      body.append("file", blob, file.name);
      const res = await fetch("/api/admin/upload-image", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setValue(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          name="coverImage"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Upload an image, or paste an image link (https://…)"
          className={`${adminInput} flex-1`}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          hidden
          onChange={(e) => onPick(e.target.files?.[0])}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="flex shrink-0 items-center gap-1.5 rounded-[var(--radius-control)] border border-line bg-surface-2 px-3 text-sm font-medium hover:bg-line disabled:opacity-50"
        >
          <ImagePlus size={16} /> {busy ? "Uploading…" : "Upload"}
        </button>
      </div>
      {error && <p role="alert" className="text-xs text-loss">{error}</p>}
      {value && (
        <div className="relative w-full max-w-xs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Cover preview" className="aspect-[16/9] w-full rounded-lg border border-line object-cover" />
          <button
            type="button"
            aria-label="Remove cover image"
            onClick={() => setValue("")}
            className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
