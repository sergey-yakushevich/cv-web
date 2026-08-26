import type { MetadataRoute } from "next";

/**
 * Only the landing page.
 *
 * Individual CVs live at /:userId/:slug and are protected by nothing except the
 * unguessability of the id. Listing them in a sitemap would hand every one of
 * them — contact details included — straight to a crawler.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://buildcv.cc",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
