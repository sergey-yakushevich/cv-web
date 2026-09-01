"use client";

import { Check, Copy, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CodeEditorDialogProps {
  open: boolean;
  /** The full editor text: prompt comment + resume JSON. Set on open. */
  code: string;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  /** Called with the current editor text; the caller parses and saves. */
  onApply: (text: string) => void;
}

/**
 * The "{} Code" modal: the CV as editable JSON, with an AI-prompt comment on
 * top. Copy takes the whole text (comment included — it is the prompt); Apply
 * hands the text back to the workspace, which parses it, PUTs it, and lets the
 * refreshed page re-render the CV from it.
 */
export function CodeEditorDialog({
  open,
  code,
  saving,
  error,
  onClose,
  onApply,
}: CodeEditorDialogProps) {
  const [text, setText] = useState(code);
  const [copied, setCopied] = useState(false);
  const copyResetTimer = useRef<ReturnType<typeof setTimeout>>();

  // A fresh snapshot arrives each time the dialog opens; edits in between
  // belong to that session and are dropped with it.
  useEffect(() => {
    if (open) {
      setText(code);
      setCopied(false);
    }
  }, [open, code]);

  useEffect(() => () => clearTimeout(copyResetTimer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      clearTimeout(copyResetTimer.current);
      copyResetTimer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      // The textarea is right there; manual copy still works.
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>CV as JSON</DialogTitle>
          <DialogDescription>
            Copy it into your AI together with your old resume to get a new one
            in this exact format — then paste the result back and apply.
          </DialogDescription>
        </DialogHeader>

        <div className="relative min-h-0 flex-1">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            spellCheck={false}
            aria-label="Resume JSON"
            className="h-[55vh] w-full resize-none rounded-md border border-input bg-muted/30 p-3 pr-12 font-mono text-xs leading-relaxed text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={copy}
            title="Copy the JSON"
            aria-label="Copy the JSON"
            className="absolute right-2 top-2 size-8 rounded-lg bg-background/90 shadow-sm"
          >
            {copied ? (
              <Check className="size-3.5 text-primary" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </Button>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="flex justify-center">
          <Button
            type="button"
            onClick={() => onApply(text)}
            disabled={saving}
            className="min-w-40"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Apply changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
