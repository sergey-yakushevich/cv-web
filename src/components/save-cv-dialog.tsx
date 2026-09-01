"use client";

import { CopyPlus, Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SaveCvDialogProps {
  open: boolean;
  /** The CV's current name, prefilled so saving in place is one click. */
  currentLabel: string;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  /** Overwrite this CV, renaming it when the name was edited. */
  onSave: (label: string) => void;
  /** Create a new CV under the given name and switch to it. */
  onSaveAsNew: (label: string) => void;
}

/**
 * The save step between "Save" in the toolbar and the actual write: pick a
 * name, then either overwrite this CV or branch the edits off into a new one.
 */
export function SaveCvDialog({
  open,
  currentLabel,
  saving,
  error,
  onClose,
  onSave,
  onSaveAsNew,
}: SaveCvDialogProps) {
  const [label, setLabel] = useState(currentLabel);

  useEffect(() => {
    if (open) setLabel(currentLabel);
  }, [open, currentLabel]);

  const trimmed = label.trim();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save your edits</DialogTitle>
          <DialogDescription>
            Overwrite this CV, or keep it and save the edits as a new one.
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (trimmed) onSave(trimmed);
          }}
        >
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">
            Resume name
            <input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="My CV"
              autoFocus={true}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </label>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <Button type="submit" disabled={saving || !trimmed}>
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Save
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={saving || !trimmed}
              onClick={() => onSaveAsNew(trimmed)}
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CopyPlus className="size-4" />
              )}
              Save as new
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
