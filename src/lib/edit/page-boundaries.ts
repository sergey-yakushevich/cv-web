/** A measured block, in CSS px relative to the top of the CV content. */
export interface MeasuredBox {
  top: number;
  bottom: number;
}

/**
 * Where would the PDF break pages?
 *
 * Walks down the content one printable-page height at a time. A block the
 * print CSS refuses to split (one job, one bullet) that straddles a boundary
 * pulls the boundary up to its own top — the same rule Chrome applies. A
 * block taller than a whole page cannot be kept together and is ignored,
 * exactly as break-inside gives up on it.
 *
 * Pure math over measured boxes, so it can be tested without a browser.
 */
export function computePageBoundaries(
  atoms: MeasuredBox[],
  total: number,
  pageHeight: number
): number[] {
  const boundaries: number[] = [];
  let start = 0;
  let guard = 0;
  while (start + pageHeight < total && guard++ < 30) {
    let end = start + pageHeight;
    const straddler = atoms.find(
      (a) =>
        a.top > start &&
        a.top < end &&
        a.bottom > end &&
        a.bottom - a.top < pageHeight
    );
    if (straddler) end = straddler.top;
    boundaries.push(end);
    start = end;
  }
  return boundaries;
}
