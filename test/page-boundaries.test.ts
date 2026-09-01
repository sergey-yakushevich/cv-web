import { describe, expect, it } from "vitest";
import { computePageBoundaries } from "@/lib/edit/page-boundaries";

describe("computePageBoundaries", () => {
  it("returns no boundary when everything fits one page", () => {
    expect(computePageBoundaries([], 500, 1000)).toEqual([]);
  });

  it("cuts at exact page height with no straddlers", () => {
    expect(computePageBoundaries([], 2500, 1000)).toEqual([1000, 2000]);
  });

  it("pulls a boundary up to the top of a straddling block", () => {
    const atoms = [{ top: 900, bottom: 1100 }];
    expect(computePageBoundaries(atoms, 1500, 1000)).toEqual([900]);
  });

  it("ignores a block taller than a page", () => {
    const atoms = [{ top: 500, bottom: 1700 }];
    expect(computePageBoundaries(atoms, 2500, 1000)).toEqual([1000, 2000]);
  });

  it("chains: the moved boundary starts the next page", () => {
    const atoms = [
      { top: 900, bottom: 1100 },
      { top: 1800, bottom: 2000 },
    ];
    // First cut moves 1000 -> 900. Second page spans 900..1900 and the
    // second block straddles it, so the next cut lands at its top, 1800.
    expect(computePageBoundaries(atoms, 2800, 1000)).toEqual([900, 1800]);
  });

  it("terminates on pathological input (guard)", () => {
    // A zero page height would loop forever without the guard.
    const boundaries = computePageBoundaries([], 1000, 1);
    expect(boundaries.length).toBeLessThanOrEqual(30);
  });
});
