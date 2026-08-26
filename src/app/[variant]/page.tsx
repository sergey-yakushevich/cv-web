import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResumeView } from "@/components/resume-view";
import { getVariant, getVariantSlugs } from "@/data/resumes";

interface PageProps {
  params: { variant: string };
}

export function generateStaticParams() {
  return getVariantSlugs().map((variant) => ({ variant }));
}

export const dynamicParams = false;

export function generateMetadata({ params }: PageProps): Metadata {
  const variant = getVariant(params.variant);

  if (!variant) {
    return {};
  }

  const { data } = variant;
  const title = `${data.name} - Resume (${variant.label})`;

  return {
    title,
    description: data.about,
    robots: { index: false, follow: true },
    openGraph: {
      title,
      description: data.about,
      type: "profile",
      locale: variant.locale,
    },
  };
}

export default function ResumeVariantPage({ params }: PageProps) {
  const variant = getVariant(params.variant);

  if (!variant) {
    notFound();
  }

  return <ResumeView variant={variant} />;
}
