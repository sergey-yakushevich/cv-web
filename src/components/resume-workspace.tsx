"use client";

import { Braces, FileText, Frame, Layers } from "lucide-react";
import dynamic from "next/dynamic";
import { type ReactNode, useState } from "react";
import { DownloadCvButton } from "@/components/download-cv-button";
import { ResumeList, type ResumeListEntry } from "@/components/resume-list";
import {
  type AnimatedTabItem,
  AnimatedTabs,
} from "@/components/shadcn-space/tabs/tabs-08";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ResumeJsonPanel = dynamic(
  () =>
    import("@/components/resume-json-panel").then((mod) => mod.ResumeJsonPanel),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-40 items-center justify-center rounded-lg border">
        <div className="size-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      </div>
    ),
  }
);

interface ResumeWorkspaceProps {
  /** Owner of these CVs; every link and API call is scoped to it. */
  userId: string;
  cv: ReactNode;
  json: string;
  resumes: ResumeListEntry[];
  currentSlug: string;
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
  const currentLabel =
    resumes.find((entry) => entry.slug === currentSlug)?.label ?? currentSlug;

  /*
   * Guides draw the print layout on screen — dashed outlines around each block
   * that Chrome will try to keep on one sheet. They are screen-only twice over:
   * off by default, and the PDF is rendered from a fresh page load that never
   * runs this toggle.
   */
  const [guidesOn, setGuidesOn] = useState(false);

  const tabs: AnimatedTabItem[] = [
    {
      value: "cv",
      label: "CV",
      icon: FileText,
      content: (
        <div className={cn("print-passthrough", guidesOn && "cv-guides")}>
          {cv}
          <div className="mt-2 flex justify-center print:hidden">
            <span className="rounded-full border border-dashed border-muted-foreground/30 px-3 py-1 font-mono text-[11px] text-muted-foreground/70">
              dotted lines show print layout — they never reach the PDF
            </span>
          </div>
        </div>
      ),
    },
    {
      value: "json",
      label: "Edit",
      icon: Braces,
      content: (
        <ResumeJsonPanel
          key={`${currentSlug}:${json}`}
          initialJson={json}
          currentSlug={currentSlug}
          label={currentLabel}
          userId={userId}
        />
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
    <AnimatedTabs
      tabs={tabs}
      defaultValue="cv"
      // print:block drops the flex column so its gap-4 does not push the CV
      // down the printed page; print:overflow-visible stops the panel wrapper
      // clipping the CV where it breaks across sheets.
      className="print:block"
      contentClassName="mx-auto w-full max-w-2xl px-4 pb-16 print:max-w-none print:overflow-visible print:px-0 print:pb-0"
      // The bar is wider than the content column, so the wrapper spans the
      // viewport and the row itself is the fixed-width bar.
      rowWrapperClassName="sticky top-0 z-50 flex justify-center print:hidden"
      rowClassName="w-[700px] max-w-[calc(100%-2rem)] justify-center rounded-b-2xl border border-t-0 border-border bg-background/90 px-4 pb-3.5 pt-3 shadow-[0_1px_3px_0_hsl(0_0%_0%/0.05),0_6px_16px_-8px_hsl(0_0%_0%/0.12)] backdrop-blur"
      listAccessory={
        <>
          <DownloadCvButton slug={currentSlug} userId={userId} />
          <Button
            type="button"
            variant="outline"
            onClick={() => setGuidesOn((on) => !on)}
            aria-pressed={guidesOn}
            title="Show how the CV will render"
            className={cn(
              "h-11 shrink-0 gap-1.5 rounded-2xl px-3.5 text-sm font-medium shadow-none",
              guidesOn
                ? "border-dashed border-primary bg-accent text-accent-foreground hover:bg-accent"
                : "border-border bg-muted/40 hover:bg-muted"
            )}
          >
            <Frame className="size-4" />
            <span>Guides</span>
          </Button>
        </>
      }
    />
  );
}
