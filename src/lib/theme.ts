export type Theme = "light" | "dark";

export const THEME_COOKIE = "theme";
export const THEME_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * Blocking script injected at the top of <body>. Runs before first paint so
 * there is no flash of the wrong theme: it reads the persisted choice from the
 * `theme` cookie, falls back to the OS preference, and stamps `data-theme` on
 * <html>. No localStorage (project rule) - the cookie is the source of truth.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|;\\s*)${THEME_COOKIE}=(light|dark)/);var t=m?m[1]:(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;
