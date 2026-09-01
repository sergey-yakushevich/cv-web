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
import {
  appendBadge,
  previewAvatarInSlot,
} from "@/components/workspace/dom-edit";
import {
  applyCvTheme,
  ThemeDropdown,
} from "@/components/workspace/theme-dropdown";
import { usePageGuides } from "@/components/workspace/use-page-guides";
import { collectResumeFromDom } from "@/lib/edit/collect-resume";
import { DEFAULT_THEME_ID } from "@/lib/themes";
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
  /** Color theme id stored in the CV, undefined for the default palette. */
  theme?: string;
}

/**
 * The screen chrome around the CV: the tabs plus the download button.
 *
 * None of this reaches the PDF: the tab row is print:hidden, and globals.css
 * keeps the tab panel free of transforms so pagination still works. The PDF is
 * rendered from a fresh load of this page, so it always gets the CV tab no
 * matter which tab is selected on screen — and always the CV as saved on disk,
 * not whatever is currently typed into the editor.
 *
 * The component itself is orchestration only. The pieces with real logic live
 * elsewhere: reading edits back out of the DOM is lib/edit/collect-resume,
 * the page-guide overlay is workspace/use-page-guides, and the direct DOM
 * edits are workspace/dom-edit.
 */
export function ResumeWorkspace({
  userId,
  cv,
  json,
  resumes,
  currentSlug,
  theme,
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
   * Controlled here rather than inside AnimatedTabs so the guides hook can
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
  /*
   * The dropdown's value. Local state so the label flips the instant a theme
   * is picked; the server prop catches up on the refresh after the save.
   */
  const [themeId, setThemeId] = useState(theme ?? DEFAULT_THEME_ID);
  const cvRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setThemeId(theme ?? DEFAULT_THEME_ID);
  }, [theme]);

  const { pageGuides, pageMarginX, tailSpace } = usePageGuides(
    cvRef,
    guidesOn,
    activeTab
  );

  const collectResume = useCallback(() => {
    const root = cvRef.current;
    if (!root) return null;
    return collectResumeFromDom(root, json, pendingAvatar);
  }, [json, pendingAvatar]);

  /** PUTs the collected CV over this version and refreshes the page. */
  const writeResume = useCallback(
    async (
      payload: unknown,
      onError: (message: string) => void,
      onDone?: () => void
    ) => {
      setSaving(true);

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
        onDone?.();
        router.refresh();
      } catch (error) {
        onError(error instanceof Error ? error.message : "Could not save");
      } finally {
        setSaving(false);
      }
    },
    [userId, currentSlug, router]
  );

  /**
   * Picks a theme: the page re-colors immediately (a data-attribute write,
   * optionally inside a View Transition — see applyCvTheme), and the choice
   * is persisted into the CV JSON so a fresh load and the PDF render carry
   * it. Any unsaved in-place edits ride along in the same PUT.
   */
  const changeTheme = useCallback(
    (next: string) => {
      setThemeId(next);
      applyCvTheme(next);

      const payload = collectResume();
      if (!payload) return;
      if (next === DEFAULT_THEME_ID) {
        delete payload.theme;
      } else {
        payload.theme = next;
      }
      setSaveError(null);
      void writeResume(payload, setSaveError);
    },
    [collectResume, writeResume]
  );

  /** Writes the collected CV over this version. */
  const save = useCallback(() => {
    if (saving) return;
    const payload = collectResume();
    if (!payload) return;

    setSaveError(null);
    void writeResume(payload, setSaveError);
  }, [saving, collectResume, writeResume]);

  /**
   * Adds the entry from the dialog form and saves right away: the current
   * in-place state is collected (unsaved edits included), the new job or
   * education is appended, and the whole CV is written back — the refresh
   * then renders the entry with real edit paths, ready for inline editing.
   */
  const submitEntry = useCallback(() => {
    if (!entryKind || saving) return;
    const payload = collectResume();
    if (!payload) return;

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

    setEntryError(null);
    void writeResume(payload, setEntryError, () => setEntryKind(null));
  }, [entryKind, entryForm, saving, collectResume, writeResume]);

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
              if (appendBadge(addButton as HTMLElement)) setDirty(true);
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
                  borderColor: "var(--guide-line)",
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
            <ThemeDropdown value={themeId} onChange={changeTheme} />
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
          if (cvRef.current) previewAvatarInSlot(cvRef.current, dataUrl);
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
