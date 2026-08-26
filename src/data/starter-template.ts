import type { EditableResume } from "@/lib/resume-json";

/**
 * The CV a brand new visitor starts with.
 *
 * Deliberately nobody's CV. The three files under src/data are Sergey's real
 * résumés — seeding a stranger with a copy would hand them his email, his phone
 * number and an employment history at Moyasar, Mondido and Regate on a public
 * URL. This keeps the shape those files demonstrate (achievement bullets with
 * numbers, badges per role, a headline that states the target title) and fills
 * it with placeholders the user overwrites.
 *
 * Import the real ones into an account with `pnpm cv:import <userId>`.
 */
export const STARTER_TEMPLATE: EditableResume = {
  name: "Your Name",
  initials: "YN",
  headline: "Your Job Title",
  location: "City, Country",
  locationLink: "https://www.google.com/maps",
  about:
    "One line a recruiter reads first: your title, how many years, and the two or three technologies you want to be found for.",
  summary:
    "Three or four sentences in your own voice. What you build, the domain you know best, and what you are looking for next. Say what you actually did rather than listing adjectives — a number or a named system beats a claim about being passionate.",
  avatarUrl: "",
  personalWebsiteUrl: "",
  contact: {
    email: "you@example.com",
    tel: "",
    social: [
      { name: "GitHub", url: "https://github.com/your-handle", icon: "github" },
      {
        name: "LinkedIn",
        url: "https://linkedin.com/in/your-handle",
        icon: "linkedin",
      },
    ],
  },
  work: [
    {
      company: "Most Recent Employer",
      link: "",
      badges: ["Language", "Framework", "Database"],
      title: "Your Title There",
      start: "Jan 2024",
      end: null,
      description: [
        "What you built, and what changed because of it. Put the number in the sentence: how many users, how much faster, how much less it cost.",
        "A problem you owned end to end, from the design through to the alert that pages someone when it breaks.",
      ],
    },
    {
      company: "Previous Employer",
      link: "",
      badges: ["Language", "Framework"],
      title: "Your Title There",
      start: "Jun 2021",
      end: "Dec 2023",
      description: [
        "One or two lines. Older roles earn less space than recent ones.",
      ],
    },
  ],
  education: [
    {
      school: "Your University",
      degree: "Your Degree",
      start: "2016",
      end: "2020",
    },
  ],
  skills: ["A language", "A framework", "A database", "A tool"],
  projects: [],
};
