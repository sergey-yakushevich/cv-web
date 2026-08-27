import type { RESUME_DATA } from "@/data/resumes";
import { Section } from "../../components/ui/section";

interface AboutProps {
  heading?: string;
  summary: typeof RESUME_DATA.summary;
  className?: string;
}

export function Summary({ summary, className, heading = "About" }: AboutProps) {
  return (
    <Section className={className}>
      <h2 className="text-xl font-bold" id="about-section">
        {heading}
      </h2>
      <div className="font-serif text-base text-black" data-edit-path="summary">
        {summary}
      </div>
    </Section>
  );
}
