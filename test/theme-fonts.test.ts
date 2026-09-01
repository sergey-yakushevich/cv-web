import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CV_THEMES, DEFAULT_THEME_ID } from "@/lib/themes";
import { THEME_FONT_PRELOADS, themeFontPreloads } from "@/lib/theme-fonts";

const ROOT = join(__dirname, "..");

/*
 * Fonts are referenced from CSS by URL, which no compiler checks — a typo or
 * a file missing from public/fonts ships fine and only breaks in the built
 * image, where the PDF route then prints in the wrong face. These tests make
 * that a test failure instead.
 */

describe("font files", () => {
  it("every font URL in globals.css points at a real file", () => {
    const css = readFileSync(join(ROOT, "src/app/globals.css"), "utf8");
    const urls = [...css.matchAll(/url\("(\/fonts\/[^"]+)"\)/g)].map(
      (match) => match[1]
    );

    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) {
      expect(existsSync(join(ROOT, "public", url)), `${url} is missing`).toBe(
        true
      );
    }
  });

  it("every preload names a real file", () => {
    for (const files of Object.values(THEME_FONT_PRELOADS)) {
      for (const url of files) {
        expect(existsSync(join(ROOT, "public", url)), `${url} is missing`).toBe(
          true
        );
      }
    }
  });
});

describe("themeFontPreloads", () => {
  it("covers every non-default theme", () => {
    for (const theme of CV_THEMES) {
      if (theme.id === DEFAULT_THEME_ID) continue;
      expect(
        THEME_FONT_PRELOADS[theme.id],
        `no preload entry for ${theme.id}`
      ).toBeDefined();
    }
  });

  it("returns nothing for the default theme or no theme", () => {
    expect(themeFontPreloads(undefined)).toEqual([]);
    expect(themeFontPreloads(DEFAULT_THEME_ID)).toEqual([]);
  });

  it("returns the theme's files for a known theme", () => {
    expect(themeFontPreloads("mono")).toContain("/fonts/Geist_Mono/400.woff2");
  });
});
