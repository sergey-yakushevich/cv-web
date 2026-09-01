/**
 * The CV color themes. Each id matches an `html:has([data-cv-theme="id"])`
 * block in globals.css — the CSS is the theme, this module is only the menu:
 * label, and the four swatches the dropdown paints (primary, secondary,
 * accent, background — the same four tweakcn shows).
 *
 * "default" is the absence of the attribute: the stock palette from :root.
 */
export interface CvTheme {
  id: string;
  label: string;
  /** Four swatch colors, any valid CSS color. */
  swatches: [string, string, string, string];
}

export const DEFAULT_THEME_ID = "default";

export const CV_THEMES: CvTheme[] = [
  {
    id: DEFAULT_THEME_ID,
    label: "Default",
    swatches: ["#3280ff", "#f2f4f7", "#dff2ff", "#ffffff"],
  },
  {
    id: "graphite",
    label: "Graphite",
    swatches: [
      "oklch(0.4891 0 0)",
      "oklch(0.9067 0 0)",
      "oklch(0.8078 0 0)",
      "oklch(0.9551 0 0)",
    ],
  },
  {
    id: "mono",
    label: "Mono",
    swatches: [
      "oklch(0.5555 0 0)",
      "oklch(0.9702 0 0)",
      "oklch(0.9702 0 0)",
      "oklch(1 0 0)",
    ],
  },
  {
    id: "sunset-horizon",
    label: "Sunset Horizon",
    swatches: [
      "oklch(0.7357 0.1641 34.7091)",
      "oklch(0.9596 0.02 28.9029)",
      "oklch(0.8278 0.1131 57.9984)",
      "oklch(0.9856 0.0084 56.3169)",
    ],
  },
  {
    id: "elegant-luxury",
    label: "Elegant Luxury",
    swatches: [
      "oklch(0.465 0.147 24.9381)",
      "oklch(0.9625 0.0385 89.0943)",
      "oklch(0.9619 0.058 95.6174)",
      "oklch(0.9779 0.0042 56.3756)",
    ],
  },
];

export function isCvThemeId(value: unknown): value is string {
  return (
    typeof value === "string" && CV_THEMES.some((theme) => theme.id === value)
  );
}

/**
 * The attribute value for a stored theme id: the default renders as no
 * attribute at all, so a CV without a theme is byte-identical to before
 * themes existed.
 */
export function themeAttribute(
  themeId: string | undefined
): string | undefined {
  return themeId && themeId !== DEFAULT_THEME_ID && isCvThemeId(themeId)
    ? themeId
    : undefined;
}
