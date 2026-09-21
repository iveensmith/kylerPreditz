import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { UserRole } from "@/generated/prisma/enums";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { BLOG_IMAGE_PREFIX, MAX_IMAGE_BYTES, sniffImageType, sniffUploadType } from "@/lib/image-upload";

export const dynamic = "force-dynamic";

// Admin-only. Stores the image bytes in Postgres and returns the public path to use as a cover image.
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  // Link dialog uploads may also be PDFs; cover images stay image-only.
  const allowPdf = form.get("allowPdf") === "1";
  if (!(file instanceof File)) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "File is larger than 2 MB" }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const contentType = allowPdf ? sniffUploadType(bytes) : sniffImageType(bytes);
  if (!contentType) {
    return NextResponse.json({ error: allowPdf ? "Use a PDF, JPG, PNG, WebP or GIF file" : "Use a JPG, PNG, WebP or GIF image" }, { status: 415 });
  }

  const image = await prisma.postImage.create({ data: { contentType, data: bytes }, select: { id: true } });
  return NextResponse.json({ url: `${BLOG_IMAGE_PREFIX}${image.id}` });
}
