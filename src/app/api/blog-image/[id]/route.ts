import { prisma } from "@/lib/db/prisma";

// Public. Uploaded images never change once stored, so the CDN and browsers can keep them
// for a year - repeat views never touch the database.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const image = /^[a-z0-9]+$/i.test(id)
    ? await prisma.postImage.findUnique({ where: { id }, select: { contentType: true, data: true } })
    : null;
  if (!image) return new Response("Not found", { status: 404 });

  return new Response(Buffer.from(image.data), {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
