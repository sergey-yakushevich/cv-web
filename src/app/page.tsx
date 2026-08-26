import type { Metadata } from "next";
import { ResumeView } from "@/components/resume-view";
import { DEFAULT_VARIANT } from "@/data/resumes";

const { data } = DEFAULT_VARIANT;

export const metadata: Metadata = {
  title: data.headline,
  description: data.about,
  openGraph: {
    title: data.headline,
    description: data.about,
    type: "profile",
    locale: DEFAULT_VARIANT.locale,
    images: [
      {
        url: "https://buildcv.cc/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${data.name}'s profile picture`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: data.headline,
    description: data.about,
    images: ["https://buildcv.cc/opengraph-image"],
  },
};

export default function ResumePage() {
  return <ResumeView variant={DEFAULT_VARIANT} />;
}
