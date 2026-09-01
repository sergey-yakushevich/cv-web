import type { ResumeData } from "@/lib/types";

/**
 * The cat CV every new visitor lands on.
 *
 * Deliberately a joke with a straight face: it demonstrates the same things
 * the human starter CV does — achievement bullets, badges per role, a headline
 * that states the target title — while being obviously safe to overwrite. No
 * surname, no contact details, nothing that can leak; the human CV sits right
 * next to it in "My resumes" for anyone who wants the serious example.
 */
export const COCKS_RESUME_DATA: ResumeData = {
  name: "Cocks",
  initials: "C",
  location: "Batumi, Georgia",
  locationLink: "https://www.google.com/maps/place/Batumi,+Georgia",

  headline: "Senior House Cat — Napping, Snacks & Household Security",

  about:
    "Senior House Cat, 2.5 years in production. Expert in strategic napping, snack acquisition and 3 AM zoomies. Fluent in Meow (C1).",

  summary:
    "I am a 2.5 year old tabby with full-stack household experience. I run a strict 16-hour daily nap schedule and still ship: every bird on the balcony is catalogued, every cardboard box is load-tested, and every plastic bag is interrogated within seconds of arrival. I moved snack delivery from a pull model (waiting by the bowl) to push notifications (screaming at 6 AM), cutting time-to-treat by 80%. I am looking for a senior lap position with a view of the window and a warm keyboard.",

  avatarUrl: "/cocks-avatar.jpg",
  personalWebsiteUrl: "",
  contact: {
    email: "",
    tel: "",
    social: [],
  },
  education: [
    {
      school: "Batumi Backyard Academy",
      degree: "Self-taught, Stealth & Applied Gravity",
      start: "2024",
      end: "2024",
    },
  ],

  work: [
    {
      company: "The Living Room",
      link: "",
      badges: ["Napping", "Purring", "Lap Occupancy", "Remote Warming"],
      title: "Chief Nap Officer",
      start: "Dec 2025",
      end: null,
      description: [
        "Own the household nap infrastructure: 7 certified sleeping spots audited daily, with 99.9% couch uptime.",
        "Provide on-demand purring at 25 Hz to reduce human stress during deploys and video calls.",
        "Enforce the 3 AM zoomies protocol so the humans never miss a disaster recovery drill.",
        "Keep the warmest chair reserved through an aggressive first-cat-in policy.",
      ],
    },
    {
      company: "The Kitchen",
      link: "",
      badges: ["Treat Negotiation", "Bowl Monitoring", "Counter Ops"],
      title: "Snack Acquisition Specialist",
      start: "Feb 2025",
      end: "Dec 2025",
      description: [
        "Cut time-to-treat by 80% by replacing silent bowl-watching with a push-based screaming pipeline.",
        "Ran continuous integrity checks on the food bowl and raised an incident the moment the bottom became visible.",
        "Negotiated a 2x treat budget through sustained eye contact and one well-timed paw on the knee.",
      ],
    },
    {
      company: "Windowsill Surveillance Ltd",
      link: "",
      badges: ["Bird Watching", "Chattering", "Perimeter Control"],
      title: "Junior Bird Watcher",
      start: "Jun 2024",
      end: "Feb 2025",
      description: [
        "Catalogued 100% of balcony birds with real-time chattering alerts to the household.",
        "Maintained the tail-twitch early warning system for pigeons, couriers and vacuum cleaners.",
        "Escalated one (1) fly to closed-won.",
      ],
    },
  ],

  skills: [
    "Strategic Napping (16h/day)",
    "Purring (25 Hz)",
    "Treat Negotiation",
    "Box Sitting (any size)",
    "Keyboard Walking",
    "Bird Surveillance",
    "3 AM Zoomies",
    "Plastic Bag Inspection",
    "Laser Pointer Pursuit",
    "Meow (C1)",
  ],

  projects: [
    {
      title: "The Red Dot Investigation",
      techStack: ["Pursuit", "Pouncing", "Persistence"],
      description:
        "Long-running research into an uncatchable red dot. Ongoing; results inconclusive but morale remains high.",
    },
    {
      title: "Box Fort Batumi",
      techStack: ["Cardboard", "Sitting", "If I Fits I Sits"],
      description:
        "Load-tested every delivery box that entered the apartment. 100% occupancy achieved within 30 seconds of arrival.",
    },
  ],
};
