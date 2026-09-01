import { PlusIcon, XIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import type { ResumeData } from "@/lib/types";

type Education = ResumeData["education"][number];

interface EducationPeriodProps {
  start: Education["start"];
  end: Education["end"];
  /** JSON path of this entry, e.g. "education.0". */
  editPathPrefix: string;
}

function EducationPeriod({ start, end, editPathPrefix }: EducationPeriodProps) {
  return (
    <div
      className="text-sm tabular-nums text-foreground/80"
      title={`Period: ${start} to ${end}`}
    >
      <span data-edit-path={`${editPathPrefix}.start`}>{start}</span> -{" "}
      <span data-edit-path={`${editPathPrefix}.end`}>{end}</span>
    </div>
  );
}

interface EducationItemProps {
  education: Education;
  /** Position of this entry in the CV's education array. */
  index: number;
}

function EducationItem({ education, index }: EducationItemProps) {
  const { school, start, end, degree } = education;
  const prefix = `education.${index}`;

  return (
    <Card className="print-avoid-break">
      <CardHeader>
        <div className="flex items-center justify-between gap-x-2 text-base">
          <h3
            className="font-semibold leading-none"
            id={`education-${school.toLowerCase().replace(/\s+/g, "-")}`}
            data-edit-path={`${prefix}.school`}
          >
            {school}
          </h3>
          <EducationPeriod start={start} end={end} editPathPrefix={prefix} />
        </div>
      </CardHeader>
      <CardContent
        className="mt-2 font-serif text-base text-foreground"
        aria-labelledby={`education-${school
          .toLowerCase()
          .replace(/\s+/g, "-")}`}
      >
        <span data-edit-path={`${prefix}.degree`}>{degree}</span>
      </CardContent>
    </Card>
  );
}

interface EducationListProps {
  heading?: string;
  education: readonly Education[];
}

export function Education({
  education,
  heading = "Education",
}: EducationListProps) {
  return (
    <Section className="font-sans">
      <h2 className="text-xl font-bold" id="education-section">
        {heading}
      </h2>
      <div
        className="space-y-4"
        role="feed"
        aria-labelledby="education-section"
      >
        {education.map((item, index) => (
          <article
            key={item.school}
            data-entry="education"
            data-entry-index={index}
            className="relative"
          >
            <EducationItem education={item} index={index} />
            <button
              type="button"
              data-remove-entry=""
              aria-label={`Remove ${item.school}`}
              className="entry-remove absolute -right-3.5 -top-3.5 hidden size-5 cursor-pointer items-center justify-center rounded-full bg-[#ffdede] text-destructive shadow-sm hover:bg-destructive hover:text-destructive-foreground print:hidden"
            >
              <XIcon className="size-3" aria-hidden="true" />
            </button>
          </article>
        ))}
        <div className="add-entry hidden print:hidden">
          <button
            type="button"
            data-add-entry="education"
            className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-dashed border-muted-foreground/40 bg-transparent px-3 py-1 text-sm font-medium text-muted-foreground hover:border-primary/60 hover:text-primary"
          >
            <PlusIcon className="size-4" aria-hidden="true" />
            Add education
          </button>
        </div>
      </div>
    </Section>
  );
}
