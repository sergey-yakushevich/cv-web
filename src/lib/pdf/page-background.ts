import { PDFArray, PDFDocument, PDFName, type PDFRef } from "pdf-lib";

/**
 * Paints the @page margins in the CV's own background color.
 *
 * Chrome cannot do this: the print engine clips every paint — the canvas
 * background included — to the page area inside the @page margins (visible in
 * the emitted content stream as a `re W* n` clip at the margin box). A themed
 * CV therefore came out framed in printer-white. Since no CSS can reach that
 * area, the margins are painted here instead: a full-page rectangle in the
 * body's computed background color, prepended under each page's existing
 * content so nothing Chrome drew is covered.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/**
 * Parses the two shapes getComputedStyle backgroundColor actually returns —
 * "rgb(255, 249, 245)" / "rgba(...)" and "color(srgb 0.99 0.97 0.96)" (what
 * oklch theme values resolve to). Returns channels in 0..1, or null for
 * anything else (a transparent body has nothing worth painting).
 */
export function parseCssColor(value: string): Rgb | null {
  const rgb = value.match(
    /^rgba?\(\s*(\d+(?:\.\d+)?)[,\s]+(\d+(?:\.\d+)?)[,\s]+(\d+(?:\.\d+)?)/
  );
  if (rgb) {
    return {
      r: Number(rgb[1]) / 255,
      g: Number(rgb[2]) / 255,
      b: Number(rgb[3]) / 255,
    };
  }

  const srgb = value.match(/^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  if (srgb) {
    return { r: Number(srgb[1]), g: Number(srgb[2]), b: Number(srgb[3]) };
  }

  return null;
}

/** True when the color is so close to white the paint would be invisible. */
export function isWhite({ r, g, b }: Rgb): boolean {
  return r > 0.999 && g > 0.999 && b > 0.999;
}

/** Prepends a full-page background rectangle to every page of the PDF. */
export async function paintPageBackground(
  pdf: Uint8Array,
  color: Rgb
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdf);
  const fill = [color.r, color.g, color.b]
    .map((channel) => Math.min(1, Math.max(0, channel)).toFixed(4))
    .join(" ");

  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    const stream = doc.context.stream(
      `q ${fill} rg 0 0 ${width.toFixed(2)} ${height.toFixed(2)} re f Q`
    );
    const backgroundRef = doc.context.register(stream);

    const contents = page.node.get(PDFName.of("Contents"));
    if (contents instanceof PDFArray) {
      contents.insert(0, backgroundRef);
    } else {
      // A single stream ref: replace with [background, existing].
      page.node.set(
        PDFName.of("Contents"),
        doc.context.obj([backgroundRef, contents as PDFRef])
      );
    }
  }

  return doc.save();
}
