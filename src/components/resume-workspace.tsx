"use client";

import { BoxSelect, FileText, Layers, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { AvatarUploadDialog } from "@/components/avatar-upload-dialog";
import { DownloadCvButton } from "@/components/download-cv-button";
import { ResumeList, type ResumeListEntry } from "@/components/resume-list";
import {
  type AnimatedTabItem,
  AnimatedTabs,
} from "@/components/shadcn-space/tabs/tabs-08";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/** Shared look for the add-entry dialog inputs. */
const FIELD_CLASS =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring";

interface ResumeWorkspaceProps {
  /** Owner of these CVs; every link and API call is scoped to it. */
  userId: string;
  cv: ReactNode;
  json: string;
  resumes: ResumeListEntry[];
  currentSlug: string;
}

/**
 * Writes `value` at a dot path like "work.0.description.1" inside the parsed
 * CV. Numeric segments index arrays. A path that no longer resolves — the CV
 * shrank under the editor — is skipped rather than invented.
 */
function setByPath(target: unknown, path: string, value: unknown) {
  const keys = path.split(".");
  let node = target as Record<string, unknown> | null;
  for (let i = 0; i < keys.length - 1; i++) {
    const next = node?.[keys[i]];
    if (next == null || typeof next !== "object") return;
    node = next as Record<string, unknown>;
  }
  if (node) node[keys[keys.length - 1]] = value;
}

/**
 * The screen chrome around the CV: three tabs plus the download button.
 *
 * None of this reaches the PDF: the tab row is print:hidden, and globals.css
 * keeps the tab panel free of transforms so pagination still works. The PDF is
 * rendered from a fresh load of this page, so it always gets the CV tab no
 * matter which tab is selected on screen — and always the CV as saved on disk,
 * not whatever is currently typed into the JSON editor.
 */
export function ResumeWorkspace({
  userId,
  cv,
  json,
  resumes,
  currentSlug,
}: ResumeWorkspaceProps) {
  const router = useRouter();

  /*
   * Guides draw the print layout on screen — dashed outlines around each block
   * that Chrome will try to keep on one sheet — and they are also the edit
   * mode: every element carrying data-edit-path becomes contenteditable, and
   * the photo becomes clickable. They are screen-only twice over: off by
   * default, and the PDF is rendered from a fresh page load that never runs
   * this toggle.
   */
  const [guidesOn, setGuidesOn] = useState(false);
  /**
   * Controlled here rather than inside AnimatedTabs so the guides effect can
   * re-run when the CV tab comes back: switching tabs unmounts the CV panel,
   * which throws away the injected page gaps and the contenteditable marks.
   */
  const [activeTab, setActiveTab] = useState("cv");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pendingAvatar, setPendingAvatar] = useState<string | null>(null);
  /** The file picked from the CV photo click, handed to the crop dialog. */
  const [pickedImage, setPickedImage] = useState<string | null>(null);
  /** One entry per PDF page: where its dashed sheet sits over the CV. */
  const [pageGuides, setPageGuides] = useState<
    { top: number; height: number }[]
  >([]);
  /** How far the sheets extend past the content column (the page margins). */
  const [pageMarginX, setPageMarginX] = useState(48);
  /** Pushes the caption below the last sheet's empty tail. */
  const [tailSpace, setTailSpace] = useState(0);
  /** Which "add entry" dialog is open, and its form. */
  const [entryKind, setEntryKind] = useState<"work" | "education" | null>(null);
  const [entryForm, setEntryForm] = useState({
    primary: "",
    secondary: "",
    link: "",
    start: "",
    end: "",
  });
  const [entryError, setEntryError] = useState<string | null>(null);
  const cvRef = useRef<HTMLDivElement>(null);

  /*
   * contenteditable is applied by hand rather than through React because the
   * CV subtree is a server-rendered prop — there is no client component per
   * field to own the attribute. The MutationObserver re-applies it when the
   * server swaps the subtree in (after a save, or a Suspense boundary
   * resolving). It observes childList only: watching attributes would loop on
   * its own setAttribute calls.
   */
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
     * Where would the PDF break pages? An A4 sheet at the print margins
     * leaves a 186x273mm printable box (273mm ~ 1032 CSS px), and the print
     * CSS drops the root font from 16px to 14px. Tailwind sizes are all
     * rem-based, so on screen the same content is roughly root/14 times
     * taller than in print — the print column being a little wider (186mm vs
     * 640px) absorbs most of the wrapping difference, which is what a
     * comparison against a real generated PDF showed. Blocks the print CSS
     * refuses to split (one job, one bullet) get pushed whole onto the next
     * page, so a boundary that lands inside one moves up to its top — the
     * same rule Chrome applies. An approximation of real pagination, but an
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
  }, [guidesOn, activeTab]);

  /** Shows the freshly cropped photo in place before it is saved. */
  const previewAvatar = useCallback((dataUrl: string) => {
    const slot =
      cvRef.current?.querySelector<HTMLElement>("[data-avatar-slot]");
    if (!slot) return;

    const img = slot.querySelector("img");
    if (img) {
      // next/image sets srcset, which would win over a plain src swap.
      img.srcset = "";
      img.src = dataUrl;
      return;
    }

    // No photo yet: paint the ghost circle with the picture.
    const ghost = slot.querySelector<HTMLElement>(".avatar-ghost");
    if (!ghost) return;
    ghost.style.backgroundImage = `url(${dataUrl})`;
    ghost.style.backgroundSize = "cover";
    ghost.style.backgroundPosition = "center";
    ghost.style.borderStyle = "solid";
    for (const child of Array.from(ghost.children)) {
      (child as HTMLElement).style.visibility = "hidden";
    }
  }, []);

  /**
   * Collects every edited element back into the CV JSON. The DOM is the
   * form: each data-edit-path element contributes its text at that path, so
   * untouched fields round-trip unchanged from the `json` prop. Used by
   * Save, Save-as-new and Copy alike.
   */
  const collectResume = useCallback(() => {
    const root = cvRef.current;
    if (!root) return null;

    {
      const parsed = JSON.parse(json);

      /*
       * Entries can be added in the DOM (the "Add job" / "Add education"
       * controls), so the arrays must be grown to cover every original index
       * present before the indexed paths below can land in them.
       */
      const grow = (kind: "work" | "education", blank: () => unknown) => {
        const arr = parsed[kind];
        if (!Array.isArray(arr)) return;
        for (const el of root.querySelectorAll<HTMLElement>(
          `[data-entry="${kind}"]`
        )) {
          const index = Number(el.dataset.entryIndex) || 0;
          while (arr.length <= index) arr.push(blank());
        }
      };
      grow("work", () => ({
        company: "",
        link: "",
        badges: [],
        title: "",
        start: "",
        end: null,
        description: [],
      }));
      grow("education", () => ({ school: "", degree: "", start: "", end: "" }));

      for (const el of root.querySelectorAll<HTMLElement>("[data-edit-path]")) {
        const path = el.dataset.editPath;
        if (!path) continue;

        let value: string | null = (el.textContent ?? "")
          .replace(/\s+/g, " ")
          .trim();

        const format = el.dataset.editFormat;
        // Link text is shown bare (github.com/...); stored with a scheme.
        if (format === "url" && value && !/^https?:\/\//i.test(value)) {
          value = `https://${value}`;
        }
        // An open-ended job renders as "Present" but is stored as null.
        if (format === "present") {
          value = value === "" || /^present$/i.test(value) ? null : value;
        }

        setByPath(parsed, path, value);
      }

      /*
       * Badge lists are rebuilt wholesale rather than written by index:
       * badges can be added and deleted in the DOM, so the list itself — in
       * DOM order, blanks dropped — is the truth.
       */
      for (const list of root.querySelectorAll<HTMLElement>(
        "[data-edit-list]"
      )) {
        const path = list.dataset.editList;
        if (!path) continue;

        const values = Array.from(
          list.querySelectorAll<HTMLElement>("[data-edit-item]")
        )
          .map((el) => (el.textContent ?? "").replace(/\s+/g, " ").trim())
          .filter(Boolean);

        setByPath(parsed, path, values);
      }

      /*
       * Deletions are absences: a contact item removed from the DOM takes
       * its field with it. Email and phone blank out; a social entry is
       * dropped — but only the socials the header actually renders can be
       * deleted this way, so anything else (an icon the contact line does
       * not show) is left untouched.
       */
      if (parsed.contact && typeof parsed.contact === "object") {
        if (!root.querySelector('[data-edit-path="contact.email"]')) {
          parsed.contact.email = "";
        }
        if (!root.querySelector('[data-edit-path="contact.tel"]')) {
          parsed.contact.tel = "";
        }
        if (Array.isArray(parsed.contact.social)) {
          const rendered = new Set(["globe", "github", "linkedin"]);
          const surviving = new Set(
            Array.from(
              root.querySelectorAll<HTMLElement>("[data-edit-path]"),
              (el) =>
                el.dataset.editPath?.match(/^contact\.social\.(\d+)\.url$/)?.[1]
            ).filter(Boolean)
          );
          parsed.contact.social = parsed.contact.social.filter(
            (social: { icon?: string }, index: number) =>
              !rendered.has(social?.icon ?? "") || surviving.has(String(index))
          );
        }
      }

      /*
       * Jobs and education are rebuilt from the DOM: surviving entries in
       * their on-screen order, keyed by the original index each article
       * carries — a deleted entry simply is not in the list any more.
       */
      for (const kind of ["work", "education"] as const) {
        const arr = parsed[kind];
        if (!Array.isArray(arr)) continue;
        parsed[kind] = Array.from(
          root.querySelectorAll<HTMLElement>(`[data-entry="${kind}"]`),
          (el) => arr[Number(el.dataset.entryIndex) || 0]
        ).filter(Boolean);
      }

      if (pendingAvatar) parsed.avatarUrl = pendingAvatar;

      return parsed;
    }
  }, [json, pendingAvatar]);

  /** Writes the collected CV over this version. */
  const save = useCallback(async () => {
    if (saving) return;
    const payload = collectResume();
    if (!payload) return;

    setSaving(true);
    setSaveError(null);

    try {
      const response = await fetch(`/api/cvs/${userId}/${currentSlug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? `HTTP ${response.status}`);
      }

      setDirty(false);
      setPendingAvatar(null);
      router.refresh();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }, [saving, collectResume, userId, currentSlug, router]);

  /**
   * Appends an empty, focused badge to the clicked "+"'s list. The new badge
   * is cloned from a sibling so it always matches the real markup; a list
   * that is empty gets the same structure built by hand.
   */
  const addBadge = (button: HTMLElement) => {
    const list = button.closest("[data-edit-list]");
    const addItem = button.closest("li");
    if (!list || !addItem) return;

    let item: HTMLElement;
    const prototype = list.querySelector("[data-edit-item]")?.closest("li");
    if (prototype) {
      item = prototype.cloneNode(true) as HTMLElement;
      const badge = item.querySelector<HTMLElement>("[data-edit-item]");
      if (badge) {
        badge.textContent = "";
        badge.removeAttribute("aria-label");
      }
    } else {
      item = document.createElement("li");
      item.className = "relative";
      item.innerHTML =
        '<span data-edit-item="" class="inline-flex items-center rounded-md border border-transparent bg-secondary px-2.5 py-0.5 align-middle text-xs font-semibold text-secondary-foreground"></span>' +
        '<button type="button" data-remove-badge="" aria-label="Remove badge" class="badge-remove absolute -right-1.5 -top-1.5 hidden size-4 cursor-pointer items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm hover:text-foreground print:hidden">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-2.5" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>' +
        "</button>";
    }

    list.insertBefore(item, addItem);
    const badge = item.querySelector<HTMLElement>("[data-edit-item]");
    badge?.setAttribute("contenteditable", "plaintext-only");
    badge?.focus();
    setDirty(true);
  };

  /**
   * Adds the entry from the dialog form and saves right away: the current
   * in-place state is collected (unsaved edits included), the new job or
   * education is appended, and the whole CV is written back — the refresh
   * then renders the entry with real edit paths, ready for inline editing.
   */
  const submitEntry = useCallback(async () => {
    if (!entryKind || saving) return;
    const payload = collectResume();
    if (!payload) return;

    setSaving(true);
    setEntryError(null);

    try {
      if (entryKind === "work") {
        if (!Array.isArray(payload.work)) payload.work = [];
        payload.work.push({
          company: entryForm.primary.trim(),
          title: entryForm.secondary.trim(),
          link: entryForm.link.trim(),
          badges: [],
          start: entryForm.start.trim(),
          end: entryForm.end.trim() || null,
          description: [],
        });
      } else {
        if (!Array.isArray(payload.education)) payload.education = [];
        payload.education.push({
          school: entryForm.primary.trim(),
          degree: entryForm.secondary.trim(),
          start: entryForm.start.trim(),
          end: entryForm.end.trim(),
        });
      }

      const response = await fetch(`/api/cvs/${userId}/${currentSlug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? `HTTP ${response.status}`);
      }

      setEntryKind(null);
      setDirty(false);
      setPendingAvatar(null);
      router.refresh();
    } catch (error) {
      setEntryError(error instanceof Error ? error.message : "Could not add");
    } finally {
      setSaving(false);
    }
  }, [
    entryKind,
    entryForm,
    saving,
    collectResume,
    userId,
    currentSlug,
    router,
  ]);

  const tabs: AnimatedTabItem[] = [
    {
      value: "cv",
      label: "CV",
      icon: FileText,
      content: (
        // biome-ignore lint/a11y/useKeyWithClickEvents: the capture handler only reroutes clicks while editing; every control keeps its own keyboard path
        // biome-ignore lint/a11y/noStaticElementInteractions: same — this is delegation, not a control
        <div
          ref={cvRef}
          className={cn(
            "print-passthrough relative",
            // Headroom for the first sheet's top margin above the content.
            guidesOn && "cv-guides pt-16"
          )}
          onInput={() => {
            if (guidesOn) setDirty(true);
          }}
          onClickCapture={(event) => {
            if (!guidesOn) return;
            const target = event.target as HTMLElement;
            // The photo goes straight to the file picker — no intermediate
            // dialog. The crop dialog opens once a file is chosen.
            if (target.closest("[data-avatar-slot]")) {
              event.preventDefault();
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.onchange = () => {
                const file = input.files?.[0];
                if (!file?.type.startsWith("image/")) return;
                const reader = new FileReader();
                reader.onload = () => {
                  setPickedImage(reader.result as string);
                  setUploadOpen(true);
                };
                reader.readAsDataURL(file);
              };
              input.click();
              return;
            }
            const removeButton = target.closest("[data-remove-badge]");
            if (removeButton) {
              event.preventDefault();
              removeButton.closest("li, [data-removable]")?.remove();
              setDirty(true);
              return;
            }
            const removeEntryButton = target.closest("[data-remove-entry]");
            if (removeEntryButton) {
              event.preventDefault();
              removeEntryButton.closest("[data-entry]")?.remove();
              setDirty(true);
              return;
            }
            const addButton = target.closest("[data-add-badge]");
            if (addButton) {
              event.preventDefault();
              addBadge(addButton as HTMLElement);
              return;
            }
            const addEntryButton =
              target.closest<HTMLElement>("[data-add-entry]");
            if (addEntryButton) {
              event.preventDefault();
              const kind = addEntryButton.dataset.addEntry;
              if (kind === "work" || kind === "education") {
                setEntryForm({
                  primary: "",
                  secondary: "",
                  link: "",
                  start: "",
                  end: "",
                });
                setEntryError(null);
                setEntryKind(kind);
              }
              return;
            }
            // Links stay put so their text can be edited in place.
            if (target.closest("a")) event.preventDefault();
          }}
        >
          {cv}
          {/*
            The PDF pages, drawn over the CV: one dashed box per page, with a
            label on every boundary. Decorative and untouchable — clicks fall
            through to the text underneath.
          */}
          {guidesOn &&
            pageGuides.map((page, index) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: the index IS the page number
                key={index}
                aria-hidden="true"
                className="pointer-events-none absolute rounded-lg border-2 border-dashed print:hidden"
                style={{
                  top: page.top,
                  height: page.height,
                  left: -pageMarginX,
                  right: -pageMarginX,
                  borderColor: "hsl(var(--guide-line))",
                }}
              >
                {index > 0 && (
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 rounded-full border border-dashed border-muted-foreground/30 bg-background px-2 py-0.5 font-mono text-[10px] text-muted-foreground/70">
                    page {index + 1}
                  </span>
                )}
              </div>
            ))}
          {guidesOn && (
            <div
              className="flex justify-center print:hidden"
              style={{ marginTop: tailSpace }}
            >
              <span className="rounded-full border border-dashed border-muted-foreground/30 px-3 py-1 font-mono text-[11px] text-muted-foreground/70">
                dotted boxes show the PDF pages — click any text to edit it
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      value: "resumes",
      label: "My resumes",
      icon: Layers,
      content: (
        <ResumeList
          resumes={resumes}
          currentSlug={currentSlug}
          userId={userId}
        />
      ),
    },
  ];

  return (
    <>
      <AnimatedTabs
        tabs={tabs}
        value={activeTab}
        onValueChange={(next) => {
          // Unmounting the CV panel discards any unsaved in-place edits.
          if (next !== "cv" && dirty) {
            setDirty(false);
            setPendingAvatar(null);
          }
          setActiveTab(next);
        }}
        // print:block drops the flex column so its gap-4 does not push the CV
        // down the printed page; print:overflow-visible stops the panel wrapper
        // clipping the CV where it breaks across sheets.
        className="print:block"
        contentClassName="mx-auto w-full max-w-2xl px-4 pb-16 pt-4 print:max-w-none print:overflow-visible print:px-0 print:pb-0"
        // The bar is wider than the content column, so the wrapper spans the
        // viewport and the row itself is the fixed-width bar.
        rowWrapperClassName="sticky top-0 z-50 flex justify-center print:hidden"
        rowClassName="w-[700px] max-w-[calc(100%-2rem)] justify-center rounded-b-2xl border border-t-0 border-border bg-background px-4 pb-3.5 pt-3 shadow-[0_1px_3px_0_hsl(0_0%_0%/0.05),0_6px_16px_-8px_hsl(0_0%_0%/0.12)]"
        listAccessory={
          <>
            <DownloadCvButton slug={currentSlug} userId={userId} />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (dirty) {
                  save();
                } else {
                  setSaveError(null);
                  setGuidesOn((on) => !on);
                }
              }}
              disabled={saving}
              aria-pressed={guidesOn}
              title={
                dirty
                  ? "Save the edits into this CV"
                  : "Edit the CV in place, with the print layout drawn over it"
              }
              className={cn(
                "h-11 shrink-0 gap-1.5 rounded-2xl px-3.5 text-sm font-medium shadow-none",
                dirty
                  ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                  : guidesOn
                    ? "border-dashed border-primary bg-accent text-accent-foreground hover:bg-accent"
                    : "border-border bg-muted/40 hover:bg-muted"
              )}
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : dirty ? (
                <Save className="size-4" />
              ) : (
                <BoxSelect className="size-4" />
              )}
              <span>{dirty ? "Save" : "Edit"}</span>
            </Button>
            {saveError && (
              <span className="max-w-40 truncate text-xs text-destructive">
                {saveError}
              </span>
            )}
          </>
        }
      />

      <AvatarUploadDialog
        open={uploadOpen}
        initialImage={pickedImage}
        onClose={() => {
          setUploadOpen(false);
          setPickedImage(null);
        }}
        onConfirm={(dataUrl) => {
          setPendingAvatar(dataUrl);
          setDirty(true);
          previewAvatar(dataUrl);
        }}
      />

      {/*
        "Add job" / "Add education": a small form instead of editing a blank
        entry inline. Submitting also saves any pending in-place edits — the
        whole current state is written in one PUT.
      */}
      <Dialog
        open={entryKind !== null}
        onOpenChange={(next) => {
          if (!next) setEntryKind(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {entryKind === "education" ? "Add education" : "Add job"}
            </DialogTitle>
            <DialogDescription>
              It is added at the end of the section — every field stays editable
              on the page afterwards.
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              submitEntry();
            }}
          >
            <label className="grid gap-1 text-xs font-medium text-muted-foreground">
              {entryKind === "education" ? "School" : "Company"}
              <input
                value={entryForm.primary}
                onChange={(event) =>
                  setEntryForm((f) => ({ ...f, primary: event.target.value }))
                }
                placeholder={
                  entryKind === "education" ? "Your University" : "Acme Inc."
                }
                // biome-ignore lint/a11y/noAutofocus: the dialog exists to take this form
                autoFocus={true}
                className={FIELD_CLASS}
              />
            </label>
            <label className="grid gap-1 text-xs font-medium text-muted-foreground">
              {entryKind === "education" ? "Degree" : "Title"}
              <input
                value={entryForm.secondary}
                onChange={(event) =>
                  setEntryForm((f) => ({ ...f, secondary: event.target.value }))
                }
                placeholder={
                  entryKind === "education"
                    ? "BSc in Computer Science"
                    : "Senior Engineer"
                }
                className={FIELD_CLASS}
              />
            </label>
            {entryKind === "work" && (
              <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                Company website
                <input
                  value={entryForm.link}
                  onChange={(event) =>
                    setEntryForm((f) => ({ ...f, link: event.target.value }))
                  }
                  placeholder="https://acme.com"
                  className={FIELD_CLASS}
                />
              </label>
            )}
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                Start
                <input
                  value={entryForm.start}
                  onChange={(event) =>
                    setEntryForm((f) => ({ ...f, start: event.target.value }))
                  }
                  placeholder={entryKind === "education" ? "2016" : "Jan 2024"}
                  className={FIELD_CLASS}
                />
              </label>
              <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                End
                <input
                  value={entryForm.end}
                  onChange={(event) =>
                    setEntryForm((f) => ({ ...f, end: event.target.value }))
                  }
                  placeholder={
                    entryKind === "education" ? "2020" : "empty = Present"
                  }
                  className={FIELD_CLASS}
                />
              </label>
            </div>
            {entryError && (
              <p className="text-xs text-destructive">{entryError}</p>
            )}
            <Button
              type="submit"
              disabled={saving || !entryForm.primary.trim()}
              className="mt-1"
            >
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : null}
              {entryKind === "education" ? "Add education" : "Add job"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
