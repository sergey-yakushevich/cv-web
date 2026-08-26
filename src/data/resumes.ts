import type { ResumeData } from "@/lib/types";
import { RESUME_DATA as enBatumi10yGo } from "./en-batumi-10y-go";
import { RESUME_DATA as enBatumi10yGoAts } from "./en-batumi-10y-go-ats";
import { RESUME_DATA as enBatumi10yPayments } from "./en-batumi-10y-payments";

export interface ResumeVariant {
  slug: string;
  label: string;
  lang: "en" | "ru";
  locale: string;
  location: string;
  experience: string;
  note: string;
  headings?: {
    about: string;
    work: string;
    education: string;
    skills: string;
  };
  data: ResumeData;
}

export const RESUME_VARIANTS: ResumeVariant[] = [
  {
    slug: "en-batumi-10y-go",
    label: "EN / Batumi / 10y / Go",
    lang: "en",
    locale: "en_US",
    location: "Batumi, Georgia",
    experience: "10 years",
    note: "Current default. For Go roles. Headline is Senior Backend Engineer (Go, Ruby), both spellings of the language appear on the page, and the summary states the switch outright. Go is not in the work history yet, which is the part that still has to be earned.",
    data: enBatumi10yGo,
  },
  {
    slug: "en-batumi-10y-go-ats",
    label: "EN / Batumi / 10y / Go (ATS)",
    lang: "en",
    locale: "en_US",
    location: "Batumi, Georgia",
    experience: "10 years",
    note: "Go version hardened against automated screening. Prints a job title, carries Go inside the Mondido dates, drops the stack from the job titles, and removes the Mondido/Moyasar overlap. Send this one through job boards and company portals; send the plain Go version when a human receives it directly.",
    data: enBatumi10yGoAts,
  },
  {
    slug: "en-batumi-10y-payments",
    label: "EN / Batumi / 10y / payments",
    lang: "en",
    locale: "en_US",
    location: "Batumi, Georgia",
    experience: "10 years",
    note: "Previous default. Rewritten against the anti-AI-writing checklist and recruiter feedback: achievement bullets with metrics, trimmed skills, no repeated projects section.",
    data: enBatumi10yPayments,
  },
];

export const DEFAULT_VARIANT = RESUME_VARIANTS[0];

export const RESUME_DATA = DEFAULT_VARIANT.data;

export function getVariant(slug: string): ResumeVariant | undefined {
  return RESUME_VARIANTS.find((variant) => variant.slug === slug);
}

export function getVariantSlugs(): string[] {
  return RESUME_VARIANTS.map((variant) => variant.slug);
}
