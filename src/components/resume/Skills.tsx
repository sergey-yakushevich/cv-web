import { PlusIcon, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Section } from "@/components/ui/section";
import { cn } from "@/lib/utils";

type Skills = readonly string[];

interface SkillsListProps {
  skills: Skills;
  className?: string;
}

/*
 * The list is also the editor. Each badge carries data-edit-item and the ul
 * carries data-edit-list: in Guides mode the workspace makes the badges
 * contenteditable and, on save, rebuilds the array from whatever badges are in
 * the list. The trailing "+" and the per-badge "x" are rendered here but stay
 * hidden until .cv-guides is on (see globals.css) — the workspace handles
 * their clicks by delegation.
 */
function SkillsList({ skills, className }: SkillsListProps) {
  return (
    <ul
      className={cn("flex list-none flex-wrap gap-1 p-0", className)}
      aria-label="List of skills"
      data-edit-list="skills"
    >
      {skills.map((skill, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: a user may list the same skill twice, and the index is what disambiguates them
        <li key={`${skill}-${index}`} className="relative">
          <Badge
            variant="secondary"
            className="align-middle text-xs"
            aria-label={`Skill: ${skill}`}
            data-edit-item=""
          >
            {skill}
          </Badge>
          <button
            type="button"
            data-remove-badge=""
            aria-label={`Remove ${skill}`}
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
          aria-label="Add a skill"
          className="inline-flex h-[22px] cursor-pointer items-center rounded-md border border-dashed border-muted-foreground/40 bg-transparent px-2.5 py-0.5 text-xs font-semibold text-muted-foreground hover:border-primary/60 hover:text-primary"
        >
          <PlusIcon className="size-4" aria-hidden="true" />
        </button>
      </li>
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
