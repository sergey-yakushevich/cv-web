"use client";

import { Check, Copy, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { JsonEditor } from "@/components/json-editor";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ResumeJsonPanelProps {
  /** The CV as JSON, exactly as the server rendered it. */
  initialJson: string;
  currentSlug: string;
  /** Which CV is being edited, shown in the header. */
  label: string;
  /**
   * False on a deployed instance. The save endpoints answer 403 there, so the
   * buttons are hidden and the editor is read-only rather than offering
   * controls that can only fail.
   */
  canEdit: boolean;
  /** Owner of the CV; the save endpoints are scoped to it. */
  userId: string;
}

const NAME_LIMIT = 50;

function truncate(value: string): string {
  return value.length > NAME_LIMIT
    ? `${value.slice(0, NAME_LIMIT).trimEnd()}…`
    : value;
}

type SaveState = "idle" | "saving" | "saved" | "error";

/**
 * The JSON tab: an editable copy of the CV data, with the two ways to keep it.
 *
 * Save          overwrites this version   -> PUT  /api/resumes/<slug>
 * Save as new   creates another version   -> POST /api/resumes
 *
 * Both endpoints write into src/data. After a successful save the router is
 * refreshed so the CV tab re-renders from the file on disk rather than from the
 * copy React already has.
 */
export function ResumeJsonPanel({
  initialJson,
  currentSlug,
  label,
  canEdit,
  userId,
}: ResumeJsonPanelProps) {
  const router = useRouter();
  const [json, setJson] = useState(initialJson);
  const [state, setState] = useState<SaveState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [newName, setNewName] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);

  const isDirty = json !== initialJson;

  // Parsing on every keystroke is cheap next to re-highlighting, and it gives
  // the buttons an honest disabled state: unparseable JSON can never be saved.
  const parseError = useMemo(() => {
    if (!isDirty) return null;
    try {
      JSON.parse(json);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "Invalid JSON";
    }
  }, [json, isDirty]);

  const canSave = isDirty && !parseError && state !== "saving";

  const copy = useCallback(() => {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [json]);

  const save = useCallback(async () => {
    if (!canSave) return;

    setState("saving");
    setMessage(null);

    try {
      const response = await fetch(`/api/cvs/${currentSlug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: json,
      });
      const result = await response.json();

      if (!response.ok)
        throw new Error(result.error ?? `HTTP ${response.status}`);

      setState("saved");
      setMessage("Saved");
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Could not save");
    }
  }, [canSave, currentSlug, json, router]);

  const saveAsNew = useCallback(async () => {
    if (!canSave || !newName.trim()) return;

    setState("saving");
    setMessage(null);

    try {
      const response = await fetch("/api/cvs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newName.trim(), data: JSON.parse(json) }),
      });
      const result = await response.json();

      if (!response.ok)
        throw new Error(result.error ?? `HTTP ${response.status}`);

      setPopoverOpen(false);
      setNewName("");
      setState("idle");
      router.push(`/${userId}/${result.slug}`);
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Could not create");
    }
  }, [canSave, json, newName, router, userId]);

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="flex h-12 items-center gap-2 border-b bg-muted/50 px-3">
        <div className="flex min-w-0 shrink items-center gap-2">
          {!canEdit && (
            <span className="whitespace-nowrap text-xs text-muted-foreground">
              Read-only
            </span>
          )}
          {canEdit && (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!canSave}
                onClick={save}
                className="h-8 gap-1.5"
              >
                {state === "saving" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Save className="size-3.5" />
                )}
                Save
              </Button>

              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild={true}>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!canSave}
                    className="h-8"
                  >
                    Save as new CV
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-80">
                  <div className="grid gap-3">
                    <div className="space-y-1">
                      <div className="text-sm font-semibold">
                        Save as new CV
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Creates another version. The name becomes its URL.
                      </p>
                    </div>
                    <input
                      value={newName}
                      onChange={(event) => setNewName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") saveAsNew();
                      }}
                      placeholder="EN / Batumi / 10y / Go"
                      aria-label="Name for the new CV"
                      // biome-ignore lint/a11y/noAutofocus: the popover exists only to take this one value
                      autoFocus={true}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={!newName.trim() || state === "saving"}
                      onClick={saveAsNew}
                    >
                      {state === "saving" ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : null}
                      Save
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              {(parseError || message) && (
                <span
                  className={
                    parseError || state === "error"
                      ? "truncate text-xs text-destructive"
                      : "truncate text-xs text-muted-foreground"
                  }
                >
                  {parseError ?? message}
                </span>
              )}
            </>
          )}
        </div>

        {/* flex-1 puts the name in the middle of whatever space the two
            button groups leave, so it stays centred as they change width. */}
        <span
          title={label}
          className="min-w-0 flex-1 truncate text-center text-xs font-medium text-muted-foreground"
        >
          {truncate(label)}
        </span>

        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={copy}
          aria-label="Copy JSON"
          className="size-8 shrink-0"
        >
          {copied ? (
            <Check className="size-3.5 text-teal-500" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </Button>
      </div>

      <JsonEditor
        value={json}
        onChange={setJson}
        readOnly={!canEdit}
        maxHeight={720}
      />
    </div>
  );
}
