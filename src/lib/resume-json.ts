import { type ResumeData, reactToString } from "@/lib/types";

export function resumeToJson(data: ResumeData): string {
  const plain = {
    name: data.name,
    initials: data.initials,
    headline: data.headline,
    location: data.location,
    locationLink: data.locationLink,
    about: data.about,
    summary: reactToString(data.summary),
    atsMode: data.atsMode,
    personalWebsiteUrl: data.personalWebsiteUrl,
    contact: {
      email: data.contact.email,
      tel: data.contact.tel,
      social: data.contact.social.map(({ name, url }) => ({ name, url })),
    },
    work: data.work,
    education: data.education,
    skills: data.skills,
    projects: data.projects,
  };

  return JSON.stringify(plain, null, 2);
}
