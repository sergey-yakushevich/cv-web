"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { useCvDownload } from "@/components/download-cv-button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

interface Props {
  links: { url: string; title: string }[];
  variants?: { slug: string; label: string }[];
  currentSlug?: string;
  userId: string;
}

const DOWNLOAD_LABEL = {
  idle: "Download PDF",
  working: "Preparing PDF…",
  failed: "Download failed — use Print instead",
} as const;

export const CommandMenu = ({
  links,
  variants = [],
  currentSlug,
  userId,
}: Props) => {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const {
    state: download,
    download: runDownload,
    reset,
  } = useCvDownload(userId, currentSlug);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const downloadPdf = React.useCallback(async () => {
    const ok = await runDownload();
    if (ok) {
      setOpen(false);
    }
  }, [runDownload]);

  React.useEffect(() => {
    if (open) {
      reset();
    }
  }, [open, reset]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Actions">
          {currentSlug && (
            <CommandItem
              value="Download PDF save resume"
              disabled={download === "working"}
              onSelect={downloadPdf}
            >
              <span>{DOWNLOAD_LABEL[download]}</span>
            </CommandItem>
          )}
          <CommandItem
            value="Print"
            onSelect={() => {
              setOpen(false);
              window.print();
            }}
          >
            <span>Print</span>
          </CommandItem>
        </CommandGroup>
        {variants.length > 0 && (
          <CommandGroup heading="Resume versions">
            {variants.map(({ slug, label }) => (
              <CommandItem
                key={slug}
                value={`${label} ${slug}`}
                onSelect={() => {
                  setOpen(false);
                  router.push(`/${userId}/${slug}`);
                }}
              >
                <span>
                  {label}
                  {slug === currentSlug ? " (current)" : ""}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        <CommandGroup heading="Links">
          {links.map(({ url, title }) => (
            <CommandItem
              key={url}
              onSelect={() => {
                setOpen(false);
                // "noreferrer" is load-bearing: the current URL contains the
                // id that grants edit access to this CV, and without it the
                // browser would send that whole address to the site being
                // opened, in its Referer header and its logs.
                window.open(url, "_blank", "noopener,noreferrer");
              }}
            >
              <span>{title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
      </CommandList>
    </CommandDialog>
  );
};
