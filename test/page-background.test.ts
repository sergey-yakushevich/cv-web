import { describe, expect, it } from "vitest";
import {
  isWhite,
  paintPageBackground,
  parseCssColor,
} from "@/lib/pdf/page-background";

describe("parseCssColor", () => {
  it("parses rgb() and rgba() to 0..1 channels", () => {
    expect(parseCssColor("rgb(255, 249, 245)")).toEqual({
      r: 1,
      g: 249 / 255,
      b: 245 / 255,
    });
    expect(parseCssColor("rgba(0, 128, 255, 0.5)")).toEqual({
      r: 0,
      g: 128 / 255,
      b: 1,
    });
  });

  it("parses color(srgb ...) — what oklch theme values resolve to", () => {
    expect(parseCssColor("color(srgb 0.9999 0.9765 0.9607)")).toEqual({
      r: 0.9999,
      g: 0.9765,
      b: 0.9607,
    });
  });

  it("returns null for anything else", () => {
    expect(parseCssColor("transparent")).toBeNull();
    expect(parseCssColor("oklch(0.98 0.004 56)")).toBeNull();
    expect(parseCssColor("")).toBeNull();
  });
});

describe("isWhite", () => {
  it("treats pure white as white and a warm cream as not", () => {
    expect(isWhite({ r: 1, g: 1, b: 1 })).toBe(true);
    expect(isWhite({ r: 0.9999, g: 0.9765, b: 0.9607 })).toBe(false);
  });
});

describe("paintPageBackground", () => {
  it("prepends a background rect to every page without breaking the PDF", async () => {
    // A minimal but real two-page PDF, produced with pdf-lib itself.
    const { PDFDocument } = await import("pdf-lib");
    const doc = await PDFDocument.create();
    doc.addPage([595, 842]).drawText("page one", { x: 50, y: 800 });
    doc.addPage([595, 842]).drawText("page two", { x: 50, y: 800 });
    const original = await doc.save();

    const painted = await paintPageBackground(new Uint8Array(original), {
      r: 0.98,
      g: 0.95,
      b: 0.93,
    });

    const reloaded = await PDFDocument.load(painted);
    expect(reloaded.getPageCount()).toBe(2);
    // The painted file still parses and grew by the two background streams.
    expect(painted.byteLength).toBeGreaterThan(original.byteLength);
  });
});
