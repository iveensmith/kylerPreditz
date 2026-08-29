import { THEME_INIT_SCRIPT } from "@/lib/theme";

/** Renders the blocking theme-init script. Must be the first child of <body>. */
export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />;
}
