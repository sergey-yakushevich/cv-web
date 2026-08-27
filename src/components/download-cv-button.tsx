"use client";

import { Download, Loader2 } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { fireConfettiFrom } from "@/components/ui/confetti-button";
import { cn } from "@/lib/utils";

type DownloadState = "idle" | "working" | "failed";

/**
 * Pulls the filename out of a Content-Disposition header.
 *
 * `filename*` has to win. Setting `anchor.download` bypasses the browser's own
 * header parsing, so reading the plain `filename` would save the ASCII fallback
 * — and that fallback replaces every non-ASCII character with an underscore,
 * turning the em dash in "Name — Role.pdf" into "Name _ Role.pdf".
 */
function fileNameFromDisposition(disposition: string): string {
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (encoded) {
    try {
      return decodeURIComponent(encoded[1]);
    } catch {
      // Malformed percent-encoding: fall through to the ASCII form.
    }
  }

  return disposition.match(/filename="([^"]+)"/)?.[1] ?? "resume.pdf";
}

/**
 * Fetches the rendered PDF for one CV version and saves it.
 *
 * Shared by the toolbar button and the command menu so there is one copy of
 * the download behaviour. Returns the state so each caller can render its own
 * label: the toolbar shows a spinner, the command menu shows text.
 */
export function useCvDownload(userId: string, slug: string | undefined) {
  const [state, setState] = React.useState<DownloadState>("idle");

  const download = React.useCallback(async () => {
    if (state === "working" || !slug) {
      return;
    }

    setState("working");

    try {
      const response = await fetch(`/api/pdf/${userId}/${slug}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // The server names the file; read it back rather than guessing here.
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = fileNameFromDisposition(disposition);
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
  }, [userId, slug, state]);

  // Stable identity: the command menu clears the state from an effect, and a
  // fresh function each render would make that effect loop.
  const reset = React.useCallback(() => setState("idle"), []);

  return { state, download, reset };
}

interface DownloadCvButtonProps {
  slug: string;
  userId: string;
}

const FAILURE_HOLD_MS = 3000;

/**
 * Toolbar download button: Download, then Preparing… while the PDF renders.
 *
 * The confetti fires on the click rather than on the file arriving, so the
 * feedback is immediate — the render takes a second or two, and a celebration
 * that late reads as a delayed reaction. There is no success state: the browser
 * showing the saved file is the confirmation.
 */
export function DownloadCvButton({ slug, userId }: DownloadCvButtonProps) {
  const { state, download, reset } = useCvDownload(userId, slug);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const run = React.useCallback(() => {
    fireConfettiFrom(buttonRef.current);
    void download();
  }, [download]);

  React.useEffect(() => {
    if (state !== "failed") return;
    const timer = setTimeout(reset, FAILURE_HOLD_MS);
    return () => clearTimeout(timer);
  }, [state, reset]);

  const isWorking = state === "working";

  return (
    <Button
      ref={buttonRef}
      type="button"
      variant="outline"
      onClick={run}
      disabled={isWorking}
      aria-label="Download this CV as a PDF"
      title={
        state === "failed"
          ? "Download failed. Press CMD+J and choose Print instead."
          : "Download this CV as a PDF"
      }
      className={cn(
        "h-11 shrink-0 gap-1.5 rounded-2xl border-border bg-muted/40 px-3.5 text-sm font-medium shadow-none hover:bg-muted",
        isWorking && "text-muted-foreground"
      )}
    >
      {isWorking ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}
      <span>
        {isWorking ? "Preparing…" : state === "failed" ? "Failed" : "Download"}
      </span>
    </Button>
  );
}
