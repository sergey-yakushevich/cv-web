"use client";

import { type RefObject, useEffect, useState } from "react";
import { computePageBoundaries } from "@/lib/edit/page-boundaries";

/** One entry per PDF page: where its dashed sheet sits over the CV. */
export interface PageGuide {
  top: number;
  height: number;
}

interface UsePageGuidesResult {
  pageGuides: PageGuide[];
  /** How far the sheets extend past the content column (the page margins). */
  pageMarginX: number;
  /** Pushes the caption below the last sheet's empty tail. */
  tailSpace: number;
}

/**
 * Everything Guides mode does to the live DOM, in one place:
 *
 *  - marks every data-edit-path / data-edit-item element contenteditable
 *    (and unmarks them when guides go off);
 *  - measures the CV, predicts where the PDF will break pages, and injects
 *    margin so each page's content starts exactly at its sheet's origin;
 *  - keeps all of it fresh through DOM swaps (MutationObserver) and
 *    reflows (ResizeObserver, fonts.ready).
 *
 * contenteditable is applied by hand rather than through React because the CV
 * subtree is a server-rendered prop — there is no client component per field
 * to own the attribute. The observer watches childList only: watching
 * attributes would loop on its own setAttribute calls.
 */
export function usePageGuides(
  cvRef: RefObject<HTMLDivElement>,
  guidesOn: boolean,
  activeTab: string
): UsePageGuidesResult {
  const [pageGuides, setPageGuides] = useState<PageGuide[]>([]);
  const [pageMarginX, setPageMarginX] = useState(48);
  const [tailSpace, setTailSpace] = useState(0);

  useEffect(() => {
    // Leaving the CV tab unmounts the panel (and with it the injected page
    // gaps); drop the stale sheet boxes so nothing misdrawn flashes when the
    // tab comes back and this effect rebuilds everything.
    if (activeTab !== "cv") {
      setPageGuides([]);
      setTailSpace(0);
      return;
    }

    const root = cvRef.current;
    if (!root) return;

    const apply = () => {
      for (const el of root.querySelectorAll(
        "[data-edit-path], [data-edit-item]"
      )) {
        if (guidesOn) el.setAttribute("contenteditable", "plaintext-only");
        else el.removeAttribute("contenteditable");
      }
    };
    apply();

    /* The visual gap between two sheets, like a PDF viewer's. */
    const PAGE_GAP = 24;

    const clearPageGaps = () => {
      for (const el of root.querySelectorAll<HTMLElement>("[data-page-gap]")) {
        el.style.marginTop = "";
        el.style.removeProperty("--natural-margin");
        el.removeAttribute("data-page-gap");
      }
    };

    if (!guidesOn) {
      clearPageGaps();
      setPageGuides([]);
      setTailSpace(0);
      return;
    }

    /*
     * An A4 sheet at the print margins leaves a 186x273mm printable box
     * (273mm ~ 1032 CSS px), and the print CSS drops the root font from 16px
     * to 14px. Tailwind sizes are all rem-based, so on screen the same
     * content is roughly root/14 times taller than in print — the print
     * column being a little wider (186mm vs 640px) absorbs most of the
     * wrapping difference, which is what a comparison against a real
     * generated PDF showed. An approximation of real pagination, but an
     * honest one.
     */
    const computePages = () => {
      const section = root.querySelector('[aria-label="Resume Content"]');
      if (!section) return;

      // Measure the natural flow — the layout print would see.
      clearPageGaps();
      const rect = section.getBoundingClientRect();

      const PRINT_HEIGHT = (273 / 25.4) * 96;
      const PRINT_FONT = 14;
      const screenFont =
        Number.parseFloat(
          getComputedStyle(document.documentElement).fontSize
        ) || 16;
      const pageHeight = (PRINT_HEIGHT * screenFont) / PRINT_FONT;
      const total = rect.height;

      const measure = (el: Element) => {
        const r = el.getBoundingClientRect();
        return {
          el: el as HTMLElement,
          top: r.top - rect.top,
          bottom: r.bottom - rect.top,
        };
      };
      const atoms = Array.from(
        section.querySelectorAll(".print-avoid-break, li")
      )
        .map(measure)
        .sort((a, b) => a.top - b.top);
      // Anything a visual page gap can be attached to: the unsplittable
      // blocks plus whole sections, for boundaries that fall between them.
      const anchors = Array.from(
        section.querySelectorAll(".print-avoid-break, li, section")
      )
        .map(measure)
        .sort((a, b) => a.top - b.top);

      const boundaries = computePageBoundaries(atoms, total, pageHeight);

      /*
       * Turn the boundaries into real sheets, the way a PDF viewer shows
       * them: each page is a fixed-height box with the 12mm margins around
       * the printable area, content on a page ends where print would end it,
       * and the unused remainder of the sheet stays empty. To make room, the
       * block that starts each page is pushed down with extra margin so it
       * lands exactly at the next sheet's content origin; the natural margin
       * is preserved for print (see globals.css).
       */
      const marginY = (12 / 273) * pageHeight;
      const marginX = (12 / 186) * rect.width;
      const sheetHeight = pageHeight + 2 * marginY;

      let injected = 0;
      let contentStart = 0; // final position of the current page's content
      const sheetTops = [contentStart - marginY];
      const claimed: HTMLElement[] = [];
      for (const boundary of boundaries) {
        const anchor = anchors.find(
          (a) => a.top >= boundary - 1 && !claimed.includes(a.el)
        );
        if (!anchor) continue;

        const nextContentStart = contentStart + sheetHeight + PAGE_GAP;
        const push = nextContentStart - (anchor.top + injected);
        if (push <= 0) continue;

        const natural =
          Number.parseFloat(getComputedStyle(anchor.el).marginTop) || 0;
        anchor.el.style.setProperty("--natural-margin", `${natural}px`);
        anchor.el.style.marginTop = `${natural + push}px`;
        anchor.el.setAttribute("data-page-gap", "");
        claimed.push(anchor.el);

        injected += push;
        contentStart = nextContentStart;
        sheetTops.push(contentStart - marginY);
      }

      // Position the sheets over the re-laid-out content.
      const rootRect = root.getBoundingClientRect();
      const rect2 = section.getBoundingClientRect();
      const offsetTop = rect2.top - rootRect.top;
      setPageMarginX(marginX);
      setPageGuides(
        sheetTops.map((top) => ({
          top: offsetTop + top,
          height: sheetHeight,
        }))
      );
      // The last sheet extends past the content into its empty remainder;
      // the caption pill moves below it.
      const lastBottom =
        sheetTops[sheetTops.length - 1] + sheetHeight - rect2.height;
      setTailSpace(Math.max(8, lastBottom + 12));
    };

    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(computePages);
    };

    schedule();
    document.fonts?.ready.then(schedule);

    const observer = new MutationObserver(() => {
      apply();
      schedule();
    });
    observer.observe(root, { childList: true, subtree: true });

    const resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(root);

    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
      cancelAnimationFrame(frame);
      clearPageGaps();
    };
  }, [guidesOn, activeTab, cvRef]);

  return { pageGuides, pageMarginX, tailSpace };
}
