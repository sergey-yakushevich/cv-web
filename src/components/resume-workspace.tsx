"use client";

import { Braces, FileText, Layers } from "lucide-react";
import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { DownloadCvButton } from "@/components/download-cv-button";
import { ResumeList, type ResumeListEntry } from "@/components/resume-list";
import {
  type AnimatedTabItem,
  AnimatedTabs,
} from "@/components/shadcn-space/tabs/tabs-08";

const CodeBlock = dynamic(
  () => import("@/components/ui/code-block").then((mod) => mod.CodeBlock),
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
  cv: ReactNode;
  json: string;
  resumes: ResumeListEntry[];
  currentSlug: string;
}

/**
 * The screen chrome around the CV: three tabs plus the download button.
 *
 * None of this reaches the PDF. The tab list and the download button are
 * print:hidden, and the print rules in globals.css undo the tab panel's
 * animation, which would otherwise break pagination. The PDF is rendered from
 * a fresh load of this page, so it always gets the CV tab no matter which tab
 * is selected on screen.
 */
export function ResumeWorkspace({
  cv,
  json,
  resumes,
  currentSlug,
}: ResumeWorkspaceProps) {
  const tabs: AnimatedTabItem[] = [
    {
      value: "cv",
      label: "CV",
      icon: FileText,
      content: <div className="print-passthrough">{cv}</div>,
    },
    {
      value: "json",
      label: "JSON",
      icon: Braces,
      content: (
        <CodeBlock
          code={json}
          language="json"
          showHeader={false}
          showLineNumbers={true}
          scrollable={true}
          maxHeight={720}
        />
      ),
    },
    {
      value: "resumes",
      label: "My resumes",
      icon: Layers,
      content: <ResumeList resumes={resumes} currentSlug={currentSlug} />,
    },
  ];

  return (
    <AnimatedTabs
      tabs={tabs}
      defaultValue="cv"
      // print:block drops the flex column so its gap-4 does not push the CV
      // down the printed page; print:overflow-visible stops the panel wrapper
      // clipping the CV where it breaks across sheets.
      className="mx-auto max-w-2xl print:block print:max-w-none"
      contentClassName="print:overflow-visible"
      listClassName="print:hidden"
      listAccessory={
        <div className="print:hidden">
          <DownloadCvButton slug={currentSlug} />
        </div>
      }
    />
  );
}
