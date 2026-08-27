"use client";

import { ImagePlus, RotateCw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

/** Rendered size of the crop circle, and the size of the image written out. */
const VIEW = 300;
const OUTPUT = 448;

interface AvatarUploadDialogProps {
  open: boolean;
  onClose: () => void;
  /** Receives a JPEG data URL, ready to store in the CV's avatarUrl. */
  onConfirm: (dataUrl: string) => void;
  /**
   * A picture already chosen before the dialog opened (the CV photo click
   * goes straight to the file picker). Skips the drag-and-drop stage and
   * lands directly on the crop.
   */
  initialImage?: string | null;
}

/**
 * Picks and crops a profile picture.
 *
 * The result is a data URL rather than an uploaded file: CVs are stored as one
 * JSON blob per row and nothing else is persisted, so the picture travels with
 * the CV instead of needing storage, a serving route and a cleanup story of its
 * own. It is written at 448px JPEG, which lands around 40–80KB — small enough
 * to live in a JSON column, large enough for the 112px slot on a retina screen
 * and in print.
 */
export function AvatarUploadDialog({
  open,
  onClose,
  onConfirm,
  initialImage,
}: AvatarUploadDialogProps) {
  const [pending, setPending] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotate, setRotate] = useState(0);
  const [dragging, setDragging] = useState(false);
  /** Natural size of the pending image, for the cover-fit preview. */
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const last = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (open && initialImage) {
      setPending(initialImage);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setRotate(0);
    }
  }, [open, initialImage]);

  const reset = useCallback(() => {
    setPending(null);
    setNatural(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotate(0);
  }, []);

  const close = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const read = useCallback(
    (file: File | undefined) => {
      if (!file?.type.startsWith("image/")) return;

      const reader = new FileReader();
      reader.onload = () => {
        reset();
        setPending(reader.result as string);
      };
      reader.readAsDataURL(file);
    },
    [reset]
  );

  const browse = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => read(input.files?.[0]);
    input.click();
  }, [read]);

  /**
   * Replays what the preview shows onto a canvas.
   *
   * The preview is a CSS transform on an <img> that is object-fit: cover inside
   * the circle, so the canvas has to reproduce the same order — cover-fit base
   * scale, then pan, zoom and rotation about the centre — or the crop would not
   * match what was on screen.
   */
  const crop = useCallback(async (): Promise<string | null> => {
    if (!pending) return null;

    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = OUTPUT;
        canvas.height = OUTPUT;

        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);

        const upscale = OUTPUT / VIEW;
        const cover = Math.max(VIEW / image.width, VIEW / image.height);

        // A transparent PNG would otherwise come out black in JPEG.
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, OUTPUT, OUTPUT);

        ctx.translate(
          OUTPUT / 2 + pan.x * upscale,
          OUTPUT / 2 + pan.y * upscale
        );
        ctx.scale(zoom * cover * upscale, zoom * cover * upscale);
        ctx.rotate((rotate * Math.PI) / 180);
        ctx.drawImage(image, -image.width / 2, -image.height / 2);

        resolve(canvas.toDataURL("image/jpeg", 0.92));
      };
      image.src = pending;
    });
  }, [pending, pan, zoom, rotate]);

  if (!open) return null;

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Escape and the close button are the keyboard paths
    // biome-ignore lint/a11y/noStaticElementInteractions: a dialog backdrop is a click target, not a control
    <div
      onClick={close}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-6 backdrop-blur-md"
      onKeyDown={(event) => {
        if (event.key === "Escape") close();
      }}
    >
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: only stops backdrop clicks reaching the overlay */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: only stops backdrop clicks reaching the overlay */}
      <div
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Profile picture"
        className="relative w-[420px] max-w-full rounded-xl border bg-background p-6 shadow-lg"
      >
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 size-7"
        >
          <X className="size-3.5" />
        </Button>

        <div className="mb-4 text-sm font-semibold">Profile picture</div>

        {pending ? (
          <div className="mx-auto w-[300px]">
            {/* biome-ignore lint/a11y/noStaticElementInteractions: dragging to pan is the interaction; the sliders below give the same control from a keyboard */}
            <div
              className="relative size-[300px] overflow-hidden rounded-[32px] bg-secondary"
              style={{
                cursor: dragging ? "grabbing" : "grab",
                touchAction: "none",
              }}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                last.current = { x: event.clientX, y: event.clientY };
                setDragging(true);
              }}
              onPointerMove={(event) => {
                if (!dragging) return;
                setPan((p) => ({
                  x: p.x + event.clientX - last.current.x,
                  y: p.y + event.clientY - last.current.y,
                }));
                last.current = { x: event.clientX, y: event.clientY };
              }}
              onPointerUp={() => setDragging(false)}
              onWheel={(event) => {
                setZoom((z) =>
                  Math.min(4, Math.max(0.5, z - event.deltaY * 0.002))
                );
              }}
            >
              {/*
                Rendered at its cover-fitted size explicitly, whole image
                visible. The old min-w/min-h sizing let a large image render
                at its natural size, so the preview did not match the canvas
                replay (which always assumes cover fit) and the crop came out
                zoomed differently than shown.
              */}
              {/* biome-ignore lint/performance/noImgElement: a data URL cannot be optimised by next/image */}
              <img
                key={pending}
                src={pending}
                alt=""
                draggable={false}
                onLoad={(event) =>
                  setNatural({
                    w: event.currentTarget.naturalWidth,
                    h: event.currentTarget.naturalHeight,
                  })
                }
                className="absolute left-1/2 top-1/2 max-w-none"
                style={{
                  ...(natural
                    ? {
                        width:
                          natural.w *
                          Math.max(VIEW / natural.w, VIEW / natural.h),
                        height:
                          natural.h *
                          Math.max(VIEW / natural.w, VIEW / natural.h),
                      }
                    : { width: VIEW, height: VIEW, objectFit: "cover" }),
                  transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotate}deg)`,
                }}
              />
            </div>

            <div className="mt-3.5 flex items-center justify-center gap-3">
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="size-8"
                title="Zoom out"
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
              >
                −
              </Button>
              <input
                type="range"
                min={0.5}
                max={4}
                step={0.05}
                value={zoom}
                aria-label="Zoom"
                onChange={(event) => setZoom(Number(event.target.value))}
                className="w-[120px] accent-primary"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="size-8"
                title="Zoom in"
                onClick={() => setZoom((z) => Math.min(4, z + 0.2))}
              >
                +
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="size-8"
                title="Rotate 90°"
                onClick={() => setRotate((r) => (r + 90) % 360)}
              >
                <RotateCw className="size-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          // biome-ignore lint/a11y/useKeyWithClickEvents: the Browse Image button below is the keyboard path
          // biome-ignore lint/a11y/noStaticElementInteractions: the Browse Image button below is the keyboard path
          <div
            onClick={browse}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              read(event.dataTransfer.files?.[0]);
            }}
            className="relative mx-auto flex size-[300px] cursor-pointer flex-col items-center justify-center gap-3 rounded-[32px] border-2 border-dashed border-muted-foreground/25"
          >
            <div className="flex size-14 items-center justify-center rounded-lg border-[1.5px] border-dashed border-muted-foreground/40 text-muted-foreground">
              <ImagePlus className="size-[22px]" />
            </div>
            <div className="text-[15px] font-medium text-secondary-foreground">
              Drag &amp; drop an image
            </div>
          </div>
        )}

        <p className="my-4 text-center text-sm leading-relaxed text-muted-foreground">
          You&apos;ll be able to zoom, pan and rotate
          <br />
          before uploading.
        </p>

        <div className="flex justify-center gap-2">
          <Button type="button" variant="outline" onClick={browse}>
            Browse Image
          </Button>
          {pending && (
            <Button
              type="button"
              onClick={async () => {
                const url = await crop();
                if (url) onConfirm(url);
                close();
              }}
            >
              Use photo
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
