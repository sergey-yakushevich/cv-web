import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/*
 * Every theme font must be a true static instance. Google Fonts serves
 * variable-font subsets for families it has upgraded (Montserrat, Geist
 * Mono, ...) even when specific weights are requested — and Chrome's PDF
 * writer cannot embed a variable instance, so it silently falls back to
 * Type 3 glyph drawing: heavier-looking text and a corrupted text layer.
 * That shipped once; this test makes it impossible to ship twice.
 *
 * The two screen families (Inter, Source Serif 4) are variable on purpose —
 * @media print swaps them for their static/ faces — so only files with
 * "Variable" in the name may carry an fvar table.
 */

const FONTS_DIR = join(__dirname, "..", "public", "fonts");

/**
 * True when the WOFF2 carries an fvar table. The WOFF2 table directory
 * encodes known tags as a 6-bit index (fvar = 48) rather than literal
 * bytes, so this walks the directory for real instead of grepping.
 */
function woff2HasFvar(path: string): boolean {
  const data = readFileSync(path);
  expect(data.subarray(0, 4).toString("latin1")).toBe("wOF2");

  const numTables = data.readUInt16BE(12);
  let offset = 48; // fixed-size WOFF2 header

  const readBase128 = (): number => {
    let value = 0;
    for (let i = 0; i < 5; i++) {
      const byte = data[offset++];
      value = value * 128 + (byte & 0x7f);
      if ((byte & 0x80) === 0) return value;
    }
    throw new Error("bad UIntBase128");
  };

  const GLYF = 10;
  const LOCA = 11;
  const HMTX = 3;
  const FVAR = 48;

  for (let i = 0; i < numTables; i++) {
    const flags = data[offset++];
    const tagIndex = flags & 0x3f;
    const transform = (flags >> 6) & 0x03;
    if (tagIndex === 0x3f) offset += 4; // arbitrary tag follows

    readBase128(); // origLength
    const transformed =
      tagIndex === GLYF || tagIndex === LOCA
        ? transform === 0
        : tagIndex === HMTX && transform === 1;
    if (transformed) readBase128(); // transformLength

    if (tagIndex === FVAR) return true;
  }

  return false;
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return walk(path);
    return path.endsWith(".woff2") ? [path] : [];
  });
}

describe("theme fonts are static instances", () => {
  const files = walk(FONTS_DIR);

  it("finds the font files at all", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  for (const file of files) {
    const relative = file.slice(FONTS_DIR.length + 1);
    const intentionallyVariable = /Variable/i.test(relative);

    it(`${relative} is ${intentionallyVariable ? "variable (screen font)" : "static"}`, () => {
      expect(woff2HasFvar(file)).toBe(intentionallyVariable);
    });
  }
});
