/**
 * Writes every CV version to generated-cvs/ as a PDF.
 *
 * Usage:
 *   pnpm dev            # in one terminal
 *   pnpm cv:pdf         # here
 *
 * Point it somewhere else with CV_ORIGIN=http://localhost:3001 pnpm cv:pdf
 *
 * It drives the running app rather than importing the render module directly,
 * because that module is TypeScript with "@/..." imports that plain Node does
 * not resolve. The server already owns the same code path the Download button
 * uses, so this stays a thin client of the API route.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const origin = process.env.CV_ORIGIN ?? "http://localhost:3000";
const outDir = join(process.cwd(), "generated-cvs");

async function slugsFromSitemap() {
  const response = await fetch(`${origin}/sitemap.xml`);

  if (!response.ok) {
    throw new Error(`Could not read ${origin}/sitemap.xml (HTTP ${response.status})`);
  }

  const xml = await response.text();
  const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (match) => new URL(match[1]).pathname,
  );

  // "/" is the default version, and it is also listed under its own slug.
  return [...new Set(paths.map((path) => path.replace(/^\//, "")))].filter(Boolean);
}

async function main() {
  try {
    await fetch(origin);
  } catch {
    console.error(`No app at ${origin}. Start it with "pnpm dev" first.`);
    process.exit(1);
  }

  const slugs = await slugsFromSitemap();
  await mkdir(outDir, { recursive: true });

  for (const slug of slugs) {
    const response = await fetch(`${origin}/api/pdf/${slug}`);

    if (!response.ok) {
      const detail = await response.text();
      console.error(`  ${slug}: FAILED — ${detail}`);
      process.exitCode = 1;
      continue;
    }

    const disposition = response.headers.get("Content-Disposition") ?? "";
    const fileName = disposition.match(/filename="([^"]+)"/)?.[1] ?? `${slug}.pdf`;
    const bytes = Buffer.from(await response.arrayBuffer());

    await writeFile(join(outDir, fileName), bytes);
    console.log(`  ${fileName}  (${(bytes.length / 1024).toFixed(0)} KB)`);
  }

  console.log(`\nWritten to ${outDir}`);
}

await main();
