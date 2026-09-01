import type { ResumeData } from "@/lib/types";

/*
 * The url fields deliberately point at the site root, never at the CV's real
 * address: the path is the credential that grants edit access, and JSON-LD is
 * exactly the kind of place it would silently leak from.
 */
function personStructuredData(data: ResumeData) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: data.name,
    alternateName: data.initials,
    description: data.about,
    url: data.personalWebsiteUrl,
    image: data.avatarUrl,
    sameAs: data.contact.social.map((social) => social.url),
    address: {
      "@type": "Place",
      name: data.location,
    },
    contactPoint: {
      "@type": "ContactPoint",
      email: data.contact.email,
      telephone: data.contact.tel,
      contactType: "personal",
    },
    jobTitle: data.headline,
    worksFor:
      data.work.length > 0
        ? {
            "@type": "Organization",
            name: data.work[0].company,
            url: data.work[0].link,
          }
        : undefined,
    alumniOf: data.education.map((edu) => ({
      "@type": "EducationalOrganization",
      name: edu.school,
    })),
    hasOccupation: data.work.map((job) => ({
      "@type": "Occupation",
      name: job.title,
      occupationLocation: {
        "@type": "Place",
        name: data.location,
      },
    })),
    knowsAbout: data.skills,
  };
}

export function generateResumeStructuredData(data: ResumeData) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: personStructuredData(data),
    name: `${data.name} - Professional Resume`,
    description: data.about,
    url: "https://buildcv.cc",
  };
}
