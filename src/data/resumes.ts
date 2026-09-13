import type { ResumeData } from "@/lib/types";
import { RESUME_DATA as defaultCv } from "./default-cv";
import { RESUME_DATA as enBatumi } from "./en-batumi";
import { RESUME_DATA as enBatumi10yGo } from "./en-batumi-10y-go";
import { RESUME_DATA as enBatumi10yPayments } from "./en-batumi-10y-payments";
import { RESUME_DATA as enMinsk } from "./en-minsk";
import { RESUME_DATA as enWarsaw } from "./en-warsaw";

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
    slug: "en-batumi",
    label: "EN / Batumi",
    lang: "en",
    locale: "en_US",
    location: "Batumi, Georgia",
    experience: "10 years",
    note: "The copy actually being sent. Worldwide, EMEA and unspecified-remote roles. Its website link carries the trackhub code ns9y, so an open shows up at track.cyberjosef.dev/tracks as this résumé rather than as anonymous traffic. Identical to the Warsaw copy but for the city line.",
    data: enBatumi,
  },
  {
    slug: "en-warsaw",
    label: "EN / Warsaw",
    lang: "en",
    locale: "en_US",
    location: "Warsaw, Poland",
    experience: "10 years",
    note: "For EU-restricted postings — 'remote anywhere in the EU', per-country EU entities — where the Polish permit is what matters. Same document as the Batumi copy with the city line changed; its trackhub code is np2w.",
    data: enWarsaw,
  },
  {
    slug: "en-minsk",
    label: "EN / Minsk",
    lang: "en",
    locale: "en_US",
    location: "Minsk, Belarus",
    experience: "8 years",
    note: "The Belarusian identity, under the local spelling of the name, with its own photo and a shorter history (8 years, iTransition from 2018). Trackhub code 6ztw.",
    data: enMinsk,
  },
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
    slug: "backend-engineer-go",
    label: "Backend Engineer / Go",
    lang: "en",
    locale: "en_US",
    location: "Batumi, Georgia",
    experience: "10 years",
    note: "Go version hardened against automated screening. Prints a job title, carries Go inside the Mondido dates, drops the stack from the job titles, and removes the Mondido/Moyasar overlap. Send this one through job boards and company portals; send the plain Go version when a human receives it directly.",
    data: defaultCv,
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
