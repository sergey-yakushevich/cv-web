import { getBrowser } from "./browser";
import { isWhite, paintPageBackground, parseCssColor } from "./page-background";

interface RenderOptions {
  /** Page path to print, without a leading slash, e.g. "<userId>/<slug>". */
  path: string;
  /** Origin the CV is served from, e.g. "http://localhost:3000". */
  origin: string;
}

/**
 * The only place that knows how to turn a CV page into a PDF.
 *
 * Both the download route and the batch script call this, so the settings
 * below cannot drift apart. Every one of them was needed to match what CMD+P
 * produces; dropping any of them changes the output:
 *
 *  - networkidle0     the avatar and the font files must have arrived
 *  - print media      otherwise the @media print block never applies, and with
 *                     it go the page-break rules and the Inter Static swap
 *  - document.fonts.ready
 *                     without this Chrome prints before the four Inter Static
 *                     faces load and silently falls back to Arial. This is the
 *                     step the plain `chrome --print-to-pdf` flag skips.
 *  - printBackground  keeps the avatar and the skill badges
 *  - preferCSSPageSize honours `@page { margin: 12mm }` from globals.css
 *  - format A4        Chrome defaults to Letter, and Letter spills to 3 pages
 */
export async function renderResumePdf({
  path,
  origin,
}: RenderOptions): Promise<Uint8Array> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // The browser is reused between renders, so it arrives with a warm HTTP
    // cache. In production the CV pages are static and carry an ETag, so the
    // second render would be answered with 304 and, worse, could print a copy
    // of the CV from before you last edited resume-data. Always refetch.
    await page.setCacheEnabled(false);

    const response = await page.goto(`${origin}/${path}`, {
      waitUntil: "networkidle0",
      timeout: 60_000,
    });

    const status = response?.status();

    if (!response || (!response.ok() && status !== 304)) {
      throw new Error(
        `Could not load /${path} for printing (HTTP ${status ?? "no response"}).`
      );
    }

    await page.emulateMediaType("print");

    /*
     * Fail loudly rather than shipping an Arial CV: a résumé parser reads the
     * text layer, and the static faces are what keep that layer clean.
     *
     * "error" is the signal, not "not loaded". A @font-face is fetched lazily,
     * only once some text actually needs that family and weight, so a face left
     * "unloaded" means nothing on the page used it — which is ordinary. A CV
     * with no work history renders nothing in semibold, and treating that as a
     * failure made those CVs impossible to download at all.
     */
    const failed = await page.evaluate(async () => {
      await document.fonts.ready;
      return [...document.fonts]
        .filter((face) => face.status === "error")
        .map((face) => `${face.family} ${face.weight}`);
    });

    if (failed.length > 0) {
      throw new Error(
        `Print fonts failed to load: ${failed.join(", ")}. The PDF would fall back to a system font.`
      );
    }

    /*
     * The themed page background, read from the live page so it is always
     * the exact color Chrome painted. Chrome clips every paint to the area
     * inside the @page margins, so a themed CV comes out of page.pdf framed
     * in white; paintPageBackground below fills the margins to match.
     */
    const bodyBackground = await page.evaluate(
      () => getComputedStyle(document.body).backgroundColor
    );

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });

    const background = parseCssColor(bodyBackground);
    if (!background || isWhite(background)) {
      return pdf;
    }

    return await paintPageBackground(pdf, background);
  } finally {
    await page.close();
  }
}
