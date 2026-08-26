import { cn } from "@/lib/utils";
import { Badge } from "../../components/ui/badge";
import { Section } from "../../components/ui/section";

type Skills = readonly string[];

interface SkillsListProps {
  skills: Skills;
  className?: string;
}

function SkillsList({ skills, className }: SkillsListProps) {
  return (
    <ul
      className={cn("flex list-none flex-wrap gap-1 p-0", className)}
      aria-label="List of skills"
    >
      {skills.map((skill, index) => (
        <li key={`${skill}-${index}`}>
          <Badge
            variant="secondary"
            className="align-middle text-xs"
            aria-label={`Skill: ${skill}`}
          >
            {skill}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

interface SkillsProps {
  heading?: string;
  skills: Skills;
  className?: string;
}

export function Skills({ skills, className, heading = "Skills" }: SkillsProps) {
  return (
    <Section className={className}>
      <h2 className="text-xl font-bold" id="skills-section">
        {heading}
      </h2>
      <SkillsList skills={skills} aria-labelledby="skills-section" />
    </Section>
  );
}
