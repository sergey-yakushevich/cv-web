import { existsSync } from "node:fs";
import type { Browser } from "puppeteer-core";
import puppeteer from "puppeteer-core";

/**
 * Where to find a Chrome to print with.
 *
 * We use puppeteer-core rather than full puppeteer on purpose: it drives the
 * Chrome that is already installed instead of downloading a second one. That is
 * the same binary behind CMD+P, so the generated PDF matches what the print
 * dialog produces today.
 *
 * CHROME_PATH wins when it is set. The Docker image sets it; see Dockerfile.
 */
const CANDIDATE_PATHS = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome",
].filter((path): path is string => Boolean(path));

export function resolveChromePath(): string {
  const found = CANDIDATE_PATHS.find((path) => existsSync(path));

  if (!found) {
    throw new Error(
      `No Chrome found for PDF rendering. Set CHROME_PATH to a Chrome or Chromium binary. Looked in:\n  ${CANDIDATE_PATHS.join("\n  ")}`
    );
  }

  return found;
}

/**
 * One browser, reused across requests.
 *
 * A cold Chrome launch costs about a second, which is the whole latency budget
 * of the Download action. Holding the instance at module scope means only the
 * first download pays it. Next keeps the module across hot reloads in dev, so
 * editing the CV does not restart Chrome either.
 */
let browserPromise: Promise<Browser> | null = null;

export async function getBrowser(): Promise<Browser> {
  const existing = await browserPromise?.catch(() => null);

  if (existing?.connected) {
    return existing;
  }

  // Either we never launched, or Chrome died or was killed. Start over.
  browserPromise = puppeteer.launch({
    executablePath: resolveChromePath(),
    headless: true,
    args: [
      // Required in Docker, harmless on a desktop.
      "--no-sandbox",
      "--disable-dev-shm-usage",
      // Keeps glyph rasterisation identical between machines.
      "--font-render-hinting=none",
    ],
  });

  return browserPromise;
}

/** Used by the batch script, which should not leave a Chrome running. */
export async function closeBrowser(): Promise<void> {
  const existing = await browserPromise?.catch(() => null);
  browserPromise = null;
  await existing?.close();
}
