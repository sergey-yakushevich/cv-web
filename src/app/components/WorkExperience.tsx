import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import type { RESUME_DATA } from "@/data/resumes";
import { cn } from "@/lib/utils";

type WorkExperience = (typeof RESUME_DATA)["work"][number];
type WorkBadges = readonly string[];

interface BadgeListProps {
  className?: string;
  badges: WorkBadges;
}

function BadgeList({ className, badges }: BadgeListProps) {
  if (badges.length === 0) return null;

  return (
    <ul
      className={cn("inline-flex list-none gap-x-1 p-0", className)}
      aria-label="Technologies used"
    >
      {badges.map((badge) => (
        <li key={badge}>
          <Badge variant="secondary" className="align-middle text-xs">
            {badge}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

interface WorkPeriodProps {
  start: WorkExperience["start"];
  end?: WorkExperience["end"];
}

function WorkPeriod({ start, end }: WorkPeriodProps) {
  return (
    <div
      className="text-sm tabular-nums text-gray-800"
      title={`Employment period: ${start} to ${end ?? "Present"}`}
    >
      {start} - {end ?? "Present"}
    </div>
  );
}

interface CompanyLinkProps {
  company: WorkExperience["company"];
  link: WorkExperience["link"];
}

function CompanyLink({ company, link }: CompanyLinkProps) {
  return (
    <a
      className="hover:underline"
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${company} company website`}
    >
      {company}
    </a>
  );
}

interface WorkExperienceItemProps {
  work: WorkExperience;
}

function WorkExperienceItem({ work }: WorkExperienceItemProps) {
  const { company, link, badges, title, start, end, description } = work;

  return (
    <Card className="py-1 print-avoid-break">
      {" "}
      <CardHeader>
        {" "}
        <div className="flex items-center justify-between gap-x-2">
          <h3 className="flex flex-wrap items-center font-semibold leading-none text-base">
            {" "}
            <CompanyLink company={company} link={link} />
            <span className="text-gray-600 pr-1">,</span>
            <span className="font-medium">{title}</span>
          </h3>
          <WorkPeriod start={start} end={end} />
        </div>
        <BadgeList className="flex flex-wrap gap-1 mt-1" badges={badges} />
      </CardHeader>
      <CardContent>
        <ul className="mt-2 list-disc pl-5 space-y-1 font-serif text-base text-black">
          {description.map((point, idx) => (
            <li key={idx}>{point}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

interface WorkExperienceProps {
  heading?: string;
  work: (typeof RESUME_DATA)["work"];
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
        {work.map((item) => (
          <article key={`${item.company}-${item.start}`}>
            <WorkExperienceItem work={item} />
          </article>
        ))}
      </div>
    </Section>
  );
}
