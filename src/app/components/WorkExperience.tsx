import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import type { RESUME_DATA } from "@/data/resume-data";
import { cn } from "@/lib/utils";

type WorkExperience = (typeof RESUME_DATA)["work"][number];
type WorkBadges = readonly string[];

interface BadgeListProps {
  className?: string;
  badges: WorkBadges;
}

/**
 * Renders a list of badges for work experience
 * Handles both mobile and desktop layouts through className prop
 */
function BadgeList({
  className,
  badges,
}: BadgeListProps) {
  if (badges.length === 0) return null;

  return (
    <ul
      className={cn("inline-flex list-none gap-x-1 p-0", className)}
      aria-label="Technologies used"
    >
      {badges.map((badge) => (
        <li key={badge}>
          <Badge
            variant="secondary"
            className="align-middle text-xs" // Removed print classes
          >
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

/**
 * Displays the work period in a consistent format
 */
function WorkPeriod({
  start,
  end,
}: WorkPeriodProps) {
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

/**
 * Renders company name with optional link
 */
function CompanyLink({
  company,
  link,
}: CompanyLinkProps) {
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

/**
 * Individual work experience card component
 * Handles responsive layout for badges (mobile/desktop)
 */
function WorkExperienceItem({
  work,
}: WorkExperienceItemProps) {
  const { company, link, badges, title, start, end, description } = work;

  return (
    <Card className="py-1"> {/* Removed print:py-0 */}
      <CardHeader> {/* Removed print:space-y-1 */}
        {/* Company + title + period on same row */}
        <div className="flex items-center justify-between gap-x-2">
          <h3 className="flex flex-wrap items-center font-semibold leading-none text-base"> {/* Removed print:text-sm */}
            <CompanyLink company={company} link={link} />
            <span className="text-gray-600 pr-1">,</span>
            <span className="font-medium">{title}</span>
          </h3>
          <WorkPeriod start={start} end={end} />
        </div>

        {/* Tech stack badges on their own line */}
        <BadgeList
          className="flex flex-wrap gap-1 mt-1"
          badges={badges}
        />
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
  work: (typeof RESUME_DATA)["work"];
}

/**
 * Main work experience section component
 * Renders a list of work experiences in chronological order
 */
export function WorkExperience({
  work,
}: WorkExperienceProps) {
  return (
    <Section>
      <h2 className="text-xl font-bold" id="work-experience"> {/* Added mb-4 for 1x spacing below header */}
        Work Experience
      </h2>
      <div
        className="space-y-2" // Set spacing between jobs to space-y-4, removed print:space-y-0
        role="feed"
        aria-labelledby="work-experience"
      >
        {work.map((item) => (
          <article key={`${item.company}-${item.start}`}>
            <WorkExperienceItem work={item} />
          </article>
        ))}
      </div>
    </Section>
  );
}