"use client";

import { useEffect } from "react";
import { useSyncExternalStore } from "react";
import { useSession } from "next-auth/react";
import type { RevealedPick } from "@/lib/premium";

// Shared across every locked pick on the page: one request to /api/premium/reveal,
// its result cached at module scope. Non-members and logged-out visitors never
// make the call, so the static HTML they got (locked) is all they ever see.
const EMPTY: Record<string, RevealedPick> = {};
let store: Record<string, RevealedPick> = EMPTY;
let started = false;
const listeners = new Set<() => void>();

function load() {
  if (started) return;
  started = true;
  fetch("/api/premium/reveal")
    .then((r) => (r.ok ? r.json() : {}))
    .then((data: Record<string, RevealedPick>) => {
      store = data ?? {};
    })
    .catch(() => {
      store = {};
    })
    .finally(() => listeners.forEach((l) => l()));
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** The real values for one locked pick, or null until (and unless) they load. */
export function useRevealedPick(fixtureId: string): RevealedPick | null {
  const { status } = useSession();
  const snapshot = useSyncExternalStore(
    subscribe,
    () => store,
    () => EMPTY,
  );

  useEffect(() => {
    if (status === "authenticated") load();
  }, [status]);

  return snapshot[fixtureId] ?? null;
}
