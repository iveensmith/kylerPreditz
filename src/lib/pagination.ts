/**
 * Offset-based pagination. Every table this is used on (Prediction, Post,
 * Subscription, Fixture) stays comfortably under ~50k rows for the foreseeable
 * future, where `OFFSET`/`LIMIT` is fine and lets the UI jump to any page /
 * show a page count. Switch a call site to keyset/cursor only if its table
 * actually grows past that.
 */

export const PAGE_SIZE = 20;

export type PageMeta = {
  /** 1-based current page. */
  page: number;
  pageCount: number;
  total: number;
  hasPrev: boolean;
  hasNext: boolean;
};

/** Coerces a `?page=` search param to a 1-based page number (defaults to 1). */
export function parsePageParam(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

/** Prisma `skip`/`take` for a 1-based page. */
export function pageArgs(page: number, perPage: number = PAGE_SIZE): { skip: number; take: number } {
  return { skip: (Math.max(1, page) - 1) * perPage, take: perPage };
}

export function pageMeta(total: number, page: number, perPage: number = PAGE_SIZE): PageMeta {
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const clamped = Math.min(Math.max(1, page), pageCount);
  return {
    page: clamped,
    pageCount,
    total,
    hasPrev: clamped > 1,
    hasNext: clamped < pageCount,
  };
}

export type Paginated<T> = { items: T[]; meta: PageMeta };
