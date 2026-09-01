import { Section } from "@/components/ui/section";

interface AboutProps {
  heading?: string;
  summary: string;
  className?: string;
}

export function Summary({ summary, className, heading = "About" }: AboutProps) {
  return (
    <Section className={className}>
      <h2 className="text-xl font-bold" id="about-section">
        {heading}
      </h2>
      <div
        className="font-serif text-base text-foreground"
        data-edit-path="summary"
      >
        {summary}
      </div>
    </Section>
  );
}
