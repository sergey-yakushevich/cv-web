"use client";

import { Check, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface ResumeListEntry {
  slug: string;
  label: string;
  note: string;
  location: string;
  experience: string;
}

interface ResumeListProps {
  resumes: ResumeListEntry[];
  currentSlug: string;
}

export function ResumeList({ resumes, currentSlug }: ResumeListProps) {
  const router = useRouter();

  return (
    <ul className="flex flex-col gap-2">
      {resumes.map((resume) => {
        const isCurrent = resume.slug === currentSlug;

        return (
          <li key={resume.slug}>
            <button
              type="button"
              onClick={() => router.push(`/${resume.slug}`)}
              aria-current={isCurrent ? "page" : undefined}
              className={cn(
                "group flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors",
                isCurrent
                  ? "border-foreground/20 bg-muted/60"
                  : "border-border bg-card hover:bg-muted/40"
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {resume.label}
                  </span>
                  {isCurrent && (
                    <Badge
                      variant="outline"
                      className="gap-1 border-accent-foreground/20 bg-accent text-accent-foreground"
                    >
                      <Check className="size-3" />
                      Open
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {resume.location} · {resume.experience}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {resume.note}
                </p>
              </div>
              <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
