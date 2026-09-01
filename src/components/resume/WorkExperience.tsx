import { PlusIcon, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import type { ResumeData } from "@/lib/types";
import { cn } from "@/lib/utils";

type WorkExperience = ResumeData["work"][number];
type WorkBadges = readonly string[];

interface BadgeListProps {
  className?: string;
  badges: WorkBadges;
  /** JSON path of the badges array, e.g. "work.0.badges". */
  editPathPrefix: string;
}

/*
 * The list is also the editor — same contract as SkillsList: data-edit-list on
 * the ul, data-edit-item on each badge, plus the guides-only "+" and "x"
 * controls the workspace drives by delegation. Rendered even when empty so a
 * job with no badges still offers the "+" in Guides mode.
 */
function BadgeList({ className, badges, editPathPrefix }: BadgeListProps) {
  return (
    <ul
      className={cn("inline-flex list-none gap-x-1 p-0", className)}
      aria-label="Technologies used"
      data-edit-list={editPathPrefix}
    >
      {badges.map((badge, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: badges may repeat, and the index is what disambiguates them
        <li key={`${badge}-${index}`} className="relative">
          <Badge
            variant="secondary"
            className="align-middle text-xs"
            data-edit-item=""
          >
            {badge}
          </Badge>
          <button
            type="button"
            data-remove-badge=""
            aria-label={`Remove ${badge}`}
            className="badge-remove absolute -right-3 -top-3 hidden size-4 cursor-pointer items-center justify-center rounded-full bg-[#ffdede] text-destructive shadow-sm hover:bg-destructive hover:text-destructive-foreground print:hidden"
          >
            <XIcon className="size-2.5" aria-hidden="true" />
          </button>
        </li>
      ))}
      <li className="add-badge hidden print:hidden">
        <button
          type="button"
          data-add-badge=""
          aria-label="Add a badge"
          className="inline-flex h-[22px] cursor-pointer items-center rounded-md border border-dashed border-muted-foreground/40 bg-transparent px-2.5 py-0.5 text-xs font-semibold text-muted-foreground hover:border-primary/60 hover:text-primary"
        >
          <PlusIcon className="size-4" aria-hidden="true" />
        </button>
      </li>
    </ul>
  );
}

interface WorkPeriodProps {
  start: WorkExperience["start"];
  end?: WorkExperience["end"];
  /** JSON path of this job, e.g. "work.0". */
  editPathPrefix: string;
}

function WorkPeriod({ start, end, editPathPrefix }: WorkPeriodProps) {
  return (
    <div
      className="text-sm tabular-nums text-foreground/80"
      title={`Employment period: ${start} to ${end ?? "Present"}`}
    >
      <span data-edit-path={`${editPathPrefix}.start`}>{start}</span> -{" "}
      <span data-edit-path={`${editPathPrefix}.end`} data-edit-format="present">
        {end ?? "Present"}
      </span>
    </div>
  );
}

interface CompanyLinkProps {
  company: WorkExperience["company"];
  link: WorkExperience["link"];
  /** JSON path of this job, e.g. "work.0". */
  editPathPrefix: string;
}

function CompanyLink({ company, link, editPathPrefix }: CompanyLinkProps) {
  return (
    <a
      className="hover:underline"
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${company} company website`}
    >
      <span data-edit-path={`${editPathPrefix}.company`}>{company}</span>
    </a>
  );
}

interface WorkExperienceItemProps {
  work: WorkExperience;
  /** Position of this job in the CV's work array. */
  index: number;
}

function WorkExperienceItem({ work, index }: WorkExperienceItemProps) {
  const { company, link, badges, title, start, end, description } = work;
  const prefix = `work.${index}`;

  return (
    // bg-transparent: the CV is one flat sheet — under a theme where --card
    // differs from --background the card box would read as a mismatched
    // block on the page (and in the PDF).
    <Card className="bg-transparent py-1 print-avoid-break">
      {" "}
      <CardHeader>
        {" "}
        <div className="flex items-center justify-between gap-x-2">
          <h3 className="flex flex-wrap items-center font-semibold leading-none text-base">
            {" "}
            <CompanyLink
              company={company}
              link={link}
              editPathPrefix={prefix}
            />
            <span className="text-foreground/60 pr-1">,</span>
            <span className="font-medium" data-edit-path={`${prefix}.title`}>
              {title}
            </span>
          </h3>
          <WorkPeriod start={start} end={end} editPathPrefix={prefix} />
        </div>
        <BadgeList
          className="flex flex-wrap gap-1 mt-1"
          badges={badges}
          editPathPrefix={`${prefix}.badges`}
        />
      </CardHeader>
      <CardContent>
        {/*
          Same editable-list contract as the badges: the ul is rebuilt from
          its data-edit-item children on save, so bullets can be added with
          the guides-only "+" and deleted with the hover "x".
        */}
        <ul
          className="mt-2 list-disc pl-5 space-y-1 font-serif text-base text-foreground"
          data-edit-list={`${prefix}.description`}
        >
          {description.map((point, idx) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: bullets may repeat, and the index is what disambiguates them
            <li key={idx} className="relative">
              <span data-edit-item="" className="block">
                {point}
              </span>
              <button
                type="button"
                data-remove-badge=""
                aria-label="Remove this point"
                className="badge-remove absolute -right-3 -top-3 hidden size-4 cursor-pointer items-center justify-center rounded-full bg-[#ffdede] text-destructive shadow-sm hover:bg-destructive hover:text-destructive-foreground print:hidden"
              >
                <XIcon className="size-2.5" aria-hidden="true" />
              </button>
            </li>
          ))}
          <li className="add-badge hidden list-none print:hidden">
            <button
              type="button"
              data-add-badge=""
              aria-label="Add a point"
              className="inline-flex h-[22px] w-full cursor-pointer items-center justify-center rounded-md border border-dashed border-muted-foreground/40 bg-transparent px-2.5 py-0.5 font-sans text-xs font-semibold text-muted-foreground hover:border-primary/60 hover:text-primary"
            >
              <PlusIcon className="size-4" aria-hidden="true" />
            </button>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}

interface WorkExperienceProps {
  heading?: string;
  work: ResumeData["work"];
}

export function WorkExperience({
  work,
  heading = "Work Experience",
}: WorkExperienceProps) {
  return (
    <Section>
      <h2 className="text-xl font-bold" id="work-experience">
        {" "}
        {heading}
      </h2>
      <div className="space-y-2" role="feed" aria-labelledby="work-experience">
        {work.map((item, index) => (
          <article
            key={`${item.company}-${item.start}`}
            data-entry="work"
            data-entry-index={index}
            className="relative"
          >
            <WorkExperienceItem work={item} index={index} />
            <button
              type="button"
              data-remove-entry=""
              aria-label={`Remove the ${item.company} job`}
              className="entry-remove absolute -right-3.5 -top-3.5 hidden size-5 cursor-pointer items-center justify-center rounded-full bg-[#ffdede] text-destructive shadow-sm hover:bg-destructive hover:text-destructive-foreground print:hidden"
            >
              <XIcon className="size-3" aria-hidden="true" />
            </button>
          </article>
        ))}
        <div className="add-entry hidden print:hidden">
          <button
            type="button"
            data-add-entry="work"
            className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-dashed border-muted-foreground/40 bg-transparent px-3 py-1 text-sm font-medium text-muted-foreground hover:border-primary/60 hover:text-primary"
          >
            <PlusIcon className="size-4" aria-hidden="true" />
            Add job
          </button>
        </div>
      </div>
    </Section>
  );
}
