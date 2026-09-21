export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

/** Path prefix cover images are served from. */
export const BLOG_IMAGE_PREFIX = "/api/blog-image/";

/**
 * Identify an image by its magic bytes (never trust the browser-supplied type).
 * Only raster formats - SVG is excluded because it can carry script.
 */
export function sniffImageType(b: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | "image/gif" | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b.length >= 6 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return "image/gif";
  if (
    b.length >= 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) return "image/webp";
  return null;
}

/** A cover image must be an https/http URL or one of our own uploaded-image paths. */
export function isValidCoverImage(value: string): boolean {
  return /^https?:\/\/\S+$/i.test(value) || new RegExp(`^${BLOG_IMAGE_PREFIX}[a-z0-9]+$`, "i").test(value);
}
