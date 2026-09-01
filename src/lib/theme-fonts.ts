/**
 * The font files worth preloading per theme: the faces the first paint uses
 * above the fold — body sans (400), the bold name (700), and the serif the
 * prose sections read in. Everything else (500/600, italics) loads lazily
 * via @font-face without visible jank.
 *
 * The default theme's Inter and Source Serif are preloaded by the root
 * layout already, so "default" — and graphite, which keeps Inter — list
 * only what they add.
 */
export const THEME_FONT_PRELOADS: Record<string, string[]> = {
  graphite: ["/fonts/Gelasio/400.woff2"],
  mono: ["/fonts/Geist_Mono/400.woff2", "/fonts/Geist_Mono/700.woff2"],
  "sunset-horizon": [
    "/fonts/Montserrat/400.woff2",
    "/fonts/Montserrat/700.woff2",
    "/fonts/Merriweather/400.woff2",
  ],
  "elegant-luxury": [
    "/fonts/Poppins/400.woff2",
    "/fonts/Poppins/700.woff2",
    "/fonts/Libre_Baskerville/400.woff2",
  ],
};

export function themeFontPreloads(themeId: string | undefined): string[] {
  return themeId ? (THEME_FONT_PRELOADS[themeId] ?? []) : [];
}
