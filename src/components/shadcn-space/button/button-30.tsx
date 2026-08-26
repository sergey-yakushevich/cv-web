"use client";

import { Check, Loader2, type LucideIcon, Send } from "lucide-react";
import { AnimatePresence, type HTMLMotionProps, motion } from "motion/react";
import * as React from "react";
import { cn } from "@/lib/utils";

/*
 * Vendored from @shadcn-space/button-30, with three changes:
 *
 *  1. The status can be driven from outside. Upstream fakes the work with a
 *     `sendDuration` timer, which cannot represent a real request: the CV render
 *     takes a second or two and can fail. Passing `status` puts the caller in
 *     charge; leaving it out keeps the original self-timing behaviour.
 *  2. The idle icon is a prop. This button downloads rather than sends.
 *  3. Tailwind v4 syntax rewritten for this project's v3.4 — `cursor-not-allowed!`
 *     and `dark:hover:bg-input/50` compile to nothing there.
 *
 * The demo default export was removed.
 */

export type SendButtonStatus = "idle" | "loading" | "success";

interface MultiStateSendButtonProps
  extends Omit<HTMLMotionProps<"button">, "children" | "onAnimationStart"> {
  idleLabel?: string;
  loadingLabel?: string;
  successLabel?: string;
  idleIcon?: LucideIcon;
  sendDuration?: number;
  autoResetDelay?: number;
  onSend?: () => void;
  /** Controlled mode: the caller owns the status and the timers are skipped. */
  status?: SendButtonStatus;
}

const MultiStateSendButton = React.forwardRef<
  HTMLButtonElement,
  MultiStateSendButtonProps
>(
  (
    {
      idleLabel = "Send Message",
      loadingLabel = "Sending...",
      successLabel = "Sent Successfully!",
      idleIcon: IdleIcon = Send,
      sendDuration = 1800,
      autoResetDelay = 3000,
      onSend,
      status: controlledStatus,
      className,
      onClick,
      disabled,
      ...props
    },
    ref
  ) => {
    const [internalStatus, setInternalStatus] =
      React.useState<SendButtonStatus>("idle");
    const status = controlledStatus ?? internalStatus;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (status !== "idle") return;

      if (controlledStatus === undefined) {
        setInternalStatus("loading");

        setTimeout(() => {
          setInternalStatus("success");
          onSend?.();

          if (autoResetDelay > 0) {
            setTimeout(() => setInternalStatus("idle"), autoResetDelay);
          }
        }, sendDuration);
      } else {
        onSend?.();
      }

      onClick?.(e);
    };

    return (
      <motion.button
        ref={ref}
        type="button"
        onClick={handleClick}
        disabled={disabled || status !== "idle"}
        whileHover={{ scale: status === "idle" ? 1.02 : 1 }}
        whileTap={{ scale: status === "idle" ? 0.97 : 1 }}
        className={cn(
          "group relative inline-flex select-none items-center justify-center gap-2.5 overflow-hidden rounded-xl border px-6 py-3 text-sm font-medium outline-none transition-all duration-300",
          status === "idle"
            ? "cursor-pointer border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
            : status === "success"
              ? "!cursor-not-allowed border-primary bg-primary text-primary-foreground"
              : "!cursor-not-allowed border-border bg-background text-foreground",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:!cursor-not-allowed",
          disabled && "opacity-60",
          className
        )}
        {...props}
      >
        <AnimatePresence mode="wait" initial={false}>
          {status === "idle" && (
            <motion.span
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 flex items-center gap-2 font-medium"
            >
              <IdleIcon className="size-4 transition-all group-hover:translate-y-0.5" />
              <span>{idleLabel}</span>
            </motion.span>
          )}

          {status === "loading" && (
            <motion.span
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 flex items-center gap-2 font-medium text-primary"
            >
              <Loader2 className="size-4 animate-spin" />
              <span>{loadingLabel}</span>
            </motion.span>
          )}

          {status === "success" && (
            <motion.span
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 350, damping: 22 }}
              className="relative z-10 flex items-center gap-2 font-medium"
            >
              <Check className="size-4 stroke-[2.5]" />
              <span>{successLabel}</span>
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    );
  }
);

MultiStateSendButton.displayName = "MultiStateSendButton";

export { MultiStateSendButton, type MultiStateSendButtonProps };
