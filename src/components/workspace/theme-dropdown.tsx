"use client";

import { Check, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CV_THEMES, DEFAULT_THEME_ID } from "@/lib/themes";
import { cn } from "@/lib/utils";

/*
 * Adapted from @shadcn-space/dropdown-menu-04: the animated popover shell
 * (spring, outside-click dismiss) is kept, the multi-panel demo content is
 * replaced by a flat theme list — four swatches and a name per row, the way
 * tweakcn's picker draws its presets.
 */

const SPRING = { type: "spring", bounce: 0.1, duration: 0.38 } as const;

function Swatches({ colors }: { colors: readonly string[] }) {
  return (
    <span className="flex shrink-0 gap-1">
      {colors.map((color, index) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed 4-swatch strip
          key={index}
          className="size-3 rounded-[4px] border border-black/10"
          style={{ backgroundColor: color }}
        />
      ))}
    </span>
  );
}

interface ThemeDropdownProps {
  value: string;
  /** Called with the picked theme id. The caller owns apply + persist. */
  onChange: (themeId: string) => void;
}

export function ThemeDropdown({ value, onChange }: ThemeDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const current = CV_THEMES.find((theme) => theme.id === value) ?? CV_THEMES[0];

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Color theme"
        className="h-11 shrink-0 gap-2 rounded-2xl border-border bg-muted/40 px-3.5 text-sm font-medium shadow-none hover:bg-muted"
      >
        <Swatches colors={current.swatches} />
        <span className="hidden sm:inline">{current.label}</span>
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label="Color theme"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={SPRING}
            className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-popover shadow-lg"
          >
            {CV_THEMES.map((theme) => {
              const isActive = theme.id === current.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isActive}
                  onClick={() => {
                    setOpen(false);
                    if (!isActive) onChange(theme.id);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-2.5 text-sm text-popover-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                    isActive && "bg-accent/50"
                  )}
                >
                  <Swatches colors={theme.swatches} />
                  <span className="flex-1 text-left">{theme.label}</span>
                  {isActive && (
                    <Check className="size-4 shrink-0 text-muted-foreground" />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Applies a theme to the live page the way tweakcn does — no reload, one
 * synchronous DOM write. tweakcn sets every --token inline on <html>; here
 * the tokens already live in per-theme CSS blocks keyed by data-cv-theme,
 * so the write is the attribute itself. The swap is wrapped in a View
 * Transition (also tweakcn's trick) for a soft cross-fade where supported.
 */
export function applyCvTheme(themeId: string) {
  const target = document.querySelector<HTMLElement>("[data-cv-theme-root]");
  if (!target) return;

  const write = () => {
    if (themeId === DEFAULT_THEME_ID) {
      delete target.dataset.cvTheme;
    } else {
      target.dataset.cvTheme = themeId;
    }
  };

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (document.startViewTransition && !reduceMotion) {
    /*
     * The router.refresh() that follows the save can interrupt the
     * transition mid-flight; the browser then rejects these promises with
     * InvalidStateError. The attribute write itself always lands — the
     * abort only cancels the cross-fade — so the rejection is noise.
     */
    const swallow = () => undefined;
    const transition = document.startViewTransition(write);
    transition.ready.catch(swallow);
    transition.finished.catch(swallow);
  } else {
    write();
  }
}
