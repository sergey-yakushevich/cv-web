import type { MetadataRoute } from "next";

/*
 * Crawlers get the landing page and nothing else useful: /api is machinery,
 * and individual CVs are already noindexed at the page level (they carry
 * personal contact details).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/graphql"],
      },
    ],
    sitemap: "https://buildcv.cc/sitemap.xml",
  };
}
