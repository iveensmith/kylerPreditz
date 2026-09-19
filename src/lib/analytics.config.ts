/**
 * Google Analytics 4 measurement ID (the "G-..." value from Admin > Data streams).
 * Defaults to the production property; override with NEXT_PUBLIC_GA_ID to point at another
 * property, or set it to "off" to disable tracking (e.g. on local/preview builds).
 */
const fromEnv = process.env.NEXT_PUBLIC_GA_ID;

export const GA_MEASUREMENT_ID: string | null = fromEnv === "off" ? null : fromEnv || "G-0QZE360XEN";
