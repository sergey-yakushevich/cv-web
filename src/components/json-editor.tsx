"use client";

import { useEffect, useRef, useState } from "react";
import { codeToHtml } from "shiki";
import { cn } from "@/lib/utils";

interface JsonEditorProps {
  value: string;
  onChange: (next: string) => void;
  maxHeight?: number;
  className?: string;
}

/**
 * An editable, syntax-highlighted JSON field.
 *
 * A textarea cannot colour its own text, so this is the usual two-layer
 * arrangement: a highlighted <pre> underneath, and a transparent textarea on
 * top holding the real caret and selection. The two only stay aligned while
 * their font, size, line height, padding and wrapping match exactly, which is
 * why those values live in one shared constant rather than in two class lists.
 */
const SURFACE =
  "m-0 w-full whitespace-pre-wrap break-words p-4 font-mono text-sm leading-[1.6]";

export function JsonEditor({
  value,
  onChange,
  maxHeight = 720,
  className,
}: JsonEditorProps) {
  const [html, setHtml] = useState<string | null>(null);
  const preRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let cancelled = false;

    codeToHtml(value, {
      lang: "json",
      themes: { light: "github-light", dark: "github-dark-default" },
      tabindex: false,
      transformers: [
        {
          pre(node) {
            // Drop Shiki's own background and padding so the two layers line up.
            node.properties.style = "background-color:transparent";
            node.properties.class = SURFACE;
          },
        },
      ],
    }).then((result) => {
      if (!cancelled) setHtml(result);
    });

    return () => {
      cancelled = true;
    };
  }, [value]);

  // The highlighted layer does not scroll on its own; it follows the textarea.
  const syncScroll = () => {
    if (preRef.current && textareaRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ maxHeight }}
    >
      <div
        ref={preRef}
        aria-hidden="true"
        className="pointer-events-none overflow-hidden"
        style={{ maxHeight }}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Shiki output for JSON typed by the user in their own browser
        dangerouslySetInnerHTML={{
          __html: html ?? `<pre class="${SURFACE}">${escapeHtml(value)}</pre>`,
        }}
      />
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onScroll={syncScroll}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        aria-label="Resume JSON"
        className={cn(
          SURFACE,
          "absolute inset-0 resize-none overflow-auto border-0 bg-transparent text-transparent caret-foreground outline-none focus-visible:ring-0"
        )}
        style={{ maxHeight }}
      />
    </div>
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
