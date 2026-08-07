import React from "react";
import type { RESUME_DATA } from "@/data/resume-data";
import { Section } from "../../components/ui/section";

interface AboutProps {
  summary: typeof RESUME_DATA.summary;
  className?: string;
}

export function Summary({ summary, className }: AboutProps) {
  return (
    <Section className={className}>
      <h2 className="text-xl font-bold" id="about-section">
        About
      </h2>
      <div className="font-serif text-base text-black">
        {summary}
      </div>
    </Section>
  );
}