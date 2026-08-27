"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import "@/components/shadcn-space/dialog/dialog-07.css";

/*
 * Vendored from @shadcn-space/dialog-07, with three changes:
 *
 *  1. The upstream file is written for Tailwind v4 and Base UI (`render`
 *     props, `data-open:*` variants, `--color-*` variables). It is rewritten
 *     here for this project's Tailwind v3.4 and Radix dialog: `asChild`,
 *     arbitrary properties for the dotted backdrop, `var(--border)` /
 *     `var(--background)` directly.
 *  2. The demo connected two app icons with a stream of bubbles. This app's
 *     icon IS the mascot, so the two tiles became one — the waving-page
 *     mascot centred over the dot grid, with the bubbles drifting behind it.
 *     The amber bubbles turned coral to match the mascot's sparkles, the
 *     blue ones use the brand primary.
 *  3. The trigger was dropped. This renders open: the session route tags a
 *     brand-new user's redirect with ?welcome=1, the CV page mounts this
 *     once, and closing it strips the flag from the URL so it never comes
 *     back on refresh.
 */

const bubbles = [
  { top: 94, left: 1.3, size: 4.4, warm: true, duration: 3.6, delay: -0.05 },
  { top: 94, left: 11.3, size: 4.4, warm: false, duration: 4.2, delay: -3.72 },
  { top: 56, left: 1.3, size: 4.4, warm: true, duration: 3.9, delay: -0.05 },
  { top: 32, left: -0.8, size: 4.4, warm: false, duration: 4.6, delay: -4.64 },
  { top: 7, left: -0.3, size: 5.4, warm: false, duration: 4, delay: -4.01 },
  { top: 25, left: 0.8, size: 3.3, warm: false, duration: 3.7, delay: -3.67 },
  { top: 7, left: 12.8, size: 5.4, warm: true, duration: 3.6, delay: -0.46 },
  { top: 7, left: 31, size: 5.4, warm: false, duration: 4.2, delay: -2.9 },
  { top: 25, left: 4.8, size: 3.3, warm: false, duration: 3.9, delay: -3.71 },
  { top: 57, left: 10.8, size: 3.3, warm: true, duration: 4.6, delay: -0.5 },
  { top: 31, left: 23.9, size: 3.3, warm: false, duration: 4, delay: -3.04 },
  { top: 79, left: 1.3, size: 6.5, warm: false, duration: 3.7, delay: -3.65 },
  { top: 78, left: 7.8, size: 5.4, warm: false, duration: 3.6, delay: -3.32 },
  { top: 82, left: 66.8, size: 6.5, warm: false, duration: 4.2, delay: -1.4 },
  { top: 81, left: 100, size: 5.4, warm: false, duration: 3.9, delay: 0.02 },
  { top: 59, left: 85.9, size: 4.4, warm: false, duration: 4.6, delay: -0.65 },
  { top: 22, left: 99.5, size: 3.3, warm: false, duration: 4, delay: -0.02 },
  { top: 7, left: 92.4, size: 5.4, warm: true, duration: 3.7, delay: -3.42 },
  { top: 9, left: 99, size: 4.4, warm: false, duration: 3.6, delay: -0.04 },
  { top: 32, left: 93, size: 4.4, warm: true, duration: 4.2, delay: -3.9 },
  { top: 32, left: 100, size: 4.4, warm: false, duration: 3.9, delay: 0 },
  { top: 7, left: 61.2, size: 5.4, warm: true, duration: 4.6, delay: -2.82 },
  { top: 56, left: 55.7, size: 4.4, warm: true, duration: 4, delay: -2.23 },
  { top: 22, left: 66.2, size: 3.3, warm: true, duration: 3.7, delay: -2.45 },
] as const;

/**
 * The first-visit greeting: this is a free CV builder, no registration, and
 * this page is the visitor's own copy. Rendered open; closing it (button,
 * Esc, backdrop) deletes the cv_welcome cookie the session route set, so the
 * server stops rendering it.
 */
export function WelcomeDialog() {
  const [open, setOpen] = useState(true);

  const close = () => {
    setOpen(false);
    // biome-ignore lint/suspicious/noDocumentCookie: the suggested Cookie Store API is Chromium-only, and this is a one-line delete
    document.cookie = "cv_welcome=; Max-Age=0; path=/";
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[400px] sm:rounded-2xl">
        <div className="relative h-48 shrink-0 overflow-hidden bg-background bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:16px_16px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--background)_10%,transparent_70%)]" />

          <div className="absolute inset-x-8 top-1/2 h-9 -translate-y-1/2">
            {bubbles.map((bubble, index) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: a static decorative list
                key={index}
                className={`dialog-07-bubble absolute -translate-x-1/2 -translate-y-1/2 rounded-full ${
                  bubble.warm
                    ? "dialog-07-bubble-warm bg-red-400"
                    : "dialog-07-bubble-blue bg-primary"
                }`}
                style={{
                  top: `${bubble.top}%`,
                  left: `${bubble.left}%`,
                  width: `${bubble.size}px`,
                  height: `${bubble.size}px`,
                  animationDuration: `${bubble.duration}s`,
                  animationDelay: `${bubble.delay}s`,
                }}
              />
            ))}
          </div>

          <div className="dialog-07-mascot absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <span className="dialog-07-spark" />
            <span className="dialog-07-spark" />
            <span className="dialog-07-spark" />
            <Image
              src="/mascot.png"
              alt=""
              width={112}
              height={112}
              priority={true}
            />
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 px-8 py-6 text-center">
          <DialogHeader className="items-center gap-2 space-y-0 sm:text-center">
            <DialogTitle className="text-2xl font-semibold">
              Welcome to buildcv
            </DialogTitle>
            <DialogDescription className="text-base leading-relaxed">
              A free CV builder — no sign-up, no account. This page is your own
              copy: edit it, keep versions, and download a PDF that résumé
              parsers can actually read.
            </DialogDescription>
          </DialogHeader>
          <DialogClose asChild={true}>
            <Button className="h-10 w-full rounded-full hover:bg-primary/80">
              Start building
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
