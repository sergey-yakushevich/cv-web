"use client";

import { Check, Copy, ImagePlus, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { AvatarUploadDialog } from "@/components/avatar-upload-dialog";
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
  /** Owner of the CV; the save endpoints are scoped to it. */
  userId: string;
}

const NAME_LIMIT = 50;

/*
 * A cropped photo is a ~60KB data URL. Dumping that into the editor would bury
 * the CV under one unreadable line and invite someone to mangle it by hand, so
 * the editor shows this placeholder instead and the real value is put back on
 * save. Only data URLs are hidden — an ordinary path like /default-avatar.jpg
 * is short, meaningful and stays editable.
 */
const AVATAR_PLACEHOLDER = "(uploaded image)";

const isDataUrl = (value: unknown): value is string =>
  typeof value === "string" && value.startsWith("data:");

/** Swaps a data-URL avatar for the placeholder, and reports what it hid. */
function hideAvatar(json: string): { text: string; hidden: string | null } {
  try {
    const parsed = JSON.parse(json);
    if (!isDataUrl(parsed?.avatarUrl)) return { text: json, hidden: null };

    const hidden = parsed.avatarUrl;
    parsed.avatarUrl = AVATAR_PLACEHOLDER;
    return { text: JSON.stringify(parsed, null, 2), hidden };
  } catch {
    return { text: json, hidden: null };
  }
}

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
  userId,
}: ResumeJsonPanelProps) {
  const router = useRouter();
  const initial = useMemo(() => hideAvatar(initialJson), [initialJson]);
  const [json, setJson] = useState(initial.text);
  const [avatar, setAvatar] = useState<string | null>(initial.hidden);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [state, setState] = useState<SaveState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [newName, setNewName] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);

  // The photo can change without the text changing, so both count as edits.
  const isDirty = json !== initial.text || avatar !== initial.hidden;

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

  /** The JSON as it should be stored: placeholder swapped back for the photo. */
  const payload = useCallback(() => {
    const parsed = JSON.parse(json);
    if (parsed?.avatarUrl === AVATAR_PLACEHOLDER) {
      parsed.avatarUrl = avatar ?? "";
    }
    return parsed;
  }, [json, avatar]);

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
      const response = await fetch(`/api/cvs/${userId}/${currentSlug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload()),
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
  }, [canSave, currentSlug, payload, router, userId]);

  const saveAsNew = useCallback(async () => {
    if (!canSave || !newName.trim()) return;

    setState("saving");
    setMessage(null);

    try {
      const response = await fetch(`/api/cvs/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newName.trim(), data: payload() }),
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
  }, [canSave, payload, newName, router, userId]);

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="flex h-12 items-center gap-2 border-b bg-muted/50 px-3">
        <div className="flex min-w-0 shrink items-center gap-2">
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
                  <div className="text-sm font-semibold">Save as new CV</div>
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

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setUploadOpen(true)}
            className="h-8 gap-1.5"
          >
            <ImagePlus className="size-3.5" />
            {avatar ? "Change photo" : "Add photo"}
          </Button>

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

      <AvatarUploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onConfirm={(dataUrl) => {
          setAvatar(dataUrl);
          // Keep the editor readable: the JSON records that a photo exists,
          // and save() puts the real data URL back.
          setJson((current) => {
            try {
              const parsed = JSON.parse(current);
              parsed.avatarUrl = AVATAR_PLACEHOLDER;
              return JSON.stringify(parsed, null, 2);
            } catch {
              return current;
            }
          });
        }}
      />

      <JsonEditor value={json} onChange={setJson} maxHeight={720} />
    </div>
  );
}
