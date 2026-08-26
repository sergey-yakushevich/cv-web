"use client";

import { Download, Loader2 } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";

type DownloadState = "idle" | "working" | "failed";

/**
 * Fetches the rendered PDF for one CV version and saves it.
 *
 * Shared by the toolbar button and the command menu so there is one copy of
 * the download behaviour. Returns the state so each caller can render its own
 * label: the toolbar shows a spinner, the command menu shows text.
 */
export function useCvDownload(slug: string | undefined) {
  const [state, setState] = React.useState<DownloadState>("idle");

  const download = React.useCallback(async () => {
    if (state === "working" || !slug) {
      return;
    }

    setState("working");

    try {
      const response = await fetch(`/api/pdf/${slug}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // The server names the file; read it back rather than guessing here.
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = match?.[1] ?? "resume.pdf";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);

      setState("idle");
      return true;
    } catch (error) {
      console.error("CV download failed:", error);
      setState("failed");
      return false;
    }
  }, [slug, state]);

  // Stable identity: the command menu clears the state from an effect, and a
  // fresh function each render would make that effect loop.
  const reset = React.useCallback(() => setState("idle"), []);

  return { state, download, reset };
}

interface DownloadCvButtonProps {
  slug: string;
}

/**
 * Toolbar download button. Sized to match the tab triggers next to it, so the
 * row reads as one control strip.
 */
export function DownloadCvButton({ slug }: DownloadCvButtonProps) {
  const { state, download } = useCvDownload(slug);

  return (
    <Button
      type="button"
      variant="outline"
      onClick={download}
      disabled={state === "working"}
      aria-label="Download this CV as a PDF"
      title={
        state === "failed"
          ? "Download failed. Press CMD+J and choose Print instead."
          : "Download this CV as a PDF"
      }
      className="h-11 shrink-0 gap-1.5 rounded-2xl border-border bg-muted/40 px-3.5 text-sm font-medium shadow-none hover:bg-muted"
    >
      {state === "working" ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}
      <span>
        {state === "working"
          ? "Preparing…"
          : state === "failed"
            ? "Failed"
            : "Download"}
      </span>
    </Button>
  );
}
