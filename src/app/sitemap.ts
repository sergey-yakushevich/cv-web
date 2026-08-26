import type { MetadataRoute } from "next";
import { getVariantSlugs } from "@/data/resumes";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://buildcv.cc";
  const lastModified = new Date();

  return [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    ...getVariantSlugs().map((slug) => ({
      url: `${baseUrl}/${slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
