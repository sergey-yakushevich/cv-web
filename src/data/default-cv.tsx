import type { ResumeData } from "@/lib/types";

export const RESUME_DATA: ResumeData = {
  name: "Sergey Yakushevich",
  initials: "SY",
  location: "Batumi, Georgia",
  locationLink: "https://www.google.com/maps/place/Batumi,+Georgia",

  headline: "Senior Backend Engineer — Go (Golang), Ruby",

  about:
    "Senior Backend Engineer (Go, Ruby). 10 years on payment backends, shipping Golang in production since 2024. Kafka, PostgreSQL, AWS, PCI-DSS.",

  summary: (
    <>
      I have spent 10 years on backends, and the last 5 of them on payment
      systems. At Moyasar I built fraud blocking and regulatory KYC on a
      platform that has processed 350M+ payments across 10+ microservices.
      Before that I shipped Visa installments and PCI-DSS card tokenization at
      Mondido, where I also moved our first services to Go and built banking
      integrations at Regate. I take a feature from schema design through to the
      alert that pages someone when it breaks in production. I have written Go
      in production since 2024 and Ruby for most of the decade before it, and I
      am looking for backend roles in Go or Ruby.
    </>
  ),
  // A stable /public path, not an imported image. The import resolves to a
  // build-hashed URL like /_next/static/media/avatar.39c1ef82.jpg, and this
  // value is copied into every new user's row — so the next build would change
  // the hash and 404 every avatar already stored.
  avatarUrl: "/default-avatar.jpg",
  personalWebsiteUrl: "https://cyberjosef.dev",
  contact: {
    email: "sergeyayya@gmail.com",
    tel: "+48530213401",
    social: [
      {
        name: "Website",
        url: "https://cyberjosef.dev",
        icon: "globe",
      },
      {
        name: "GitHub",
        url: "https://github.com/sergey-yakushevich",
        icon: "github",
      },
      {
        name: "LinkedIn",
        url: "https://linkedin.com/in/sergey-yakushevich-688a4b179/",
        icon: "linkedin",
      },
    ],
  },
  education: [
    {
      school: "Belarusian State University",
      degree: "Bachelor of Science in Computer Science",
      start: "2013",
      end: "2018",
    },
  ],

  work: [
    {
      company: "Moyasar",
      link: "https://moyasar.com",
      badges: [
        "Ruby on Rails",
        "PostgreSQL",
        "Microservices",
        "Kafka",
        "Fraud Detection",
      ],
      title: "Senior Engineer",
      start: "Dec 2025",
      end: "Aug 2026",
      description: [
        "Built the fraud system that scores and blocks transactions on risk signals, on a platform that has taken 350M+ payments",
        "Shipped identity verification to the regulator's spec. We needed it to expand into new markets.",
        "Wrote the alerting for payment flow disruptions and took time to detection from hours to seconds. We hear it from a monitor now rather than from a merchant.",
        "Analysed on my own initiative which platform features merchants actually use, and handed management the numbers. Sales now leads with the most adopted features when pitching new clients.",
        "Sat in on sales calls as the technical voice when a prospective merchant had integration questions.",
      ],
    },
    {
      company: "Mondido",
      link: "https://mondido.com",
      badges: [
        "Go",
        "Ruby on Rails",
        "React",
        "PostgreSQL",
        "PCI-DSS",
        "Card Tokenization",
      ],
      title: "Senior Engineer",
      start: "Jan 2024",
      end: "Nov 2025",
      description: [
        "Wrote Go services on the platform, taking the high-throughput parts of the gateway integration off Rails and onto a runtime that handles concurrent calls without a worker pool per request.",
        "Delivered the Visa installment integration, backend and checkout UI, which added a payment option merchants had been asking for.",
        "Built PCI-DSS compliant card tokenization for gateway calls, so raw card numbers stayed out of our systems.",
        "Built audit log - the one that traces every merchant and staff action without adding latency to the request path.",
      ],
    },
    {
      company: "Regate",
      link: "https://regate.com",
      badges: [
        "Kafka",
        "Event-Driven",
        "AWS",
        "Kubernetes",
        "Terraform",
        "Ruby on Rails",
      ],
      title: "Senior Engineer",
      start: "Nov 2021",
      end: "Jan 2024",
      description: [
        "Owned the integrations with the payment and banking APIs that drive the automated accounting workflows.",
        "Started the Service Layer refactor that pulled business logic out of callback-heavy Rails models, which is what made the codebase safe to change again.",
        "Raised RSpec coverage and added CloudWatch dashboards, so regressions surfaced in CI rather than in production.",
      ],
    },
    {
      company: "iTransition",
      link: "https://itransition.com",
      badges: [
        "PostgreSQL",
        "Kafka",
        "Elasticsearch",
        "Microservices",
        "AWS ECS",
        "Ruby on Rails",
      ],
      title: "Software Engineer",
      start: "Jan 2016",
      end: "Jun 2020",
      description: [
        "Moved the main search workload off MySQL onto Elasticsearch and made it 90% faster for 50M+ users.",
        "Made the test pipeline 5x faster, which took a full release cycle down from days to hours.",
        "Tuned the PostgreSQL layer under the platform: replaced indexes that no longer matched the query patterns, rewrote the slowest reads, and cut the load the reporting queries put on the primary.",
      ],
    },
  ],

  skills: [
    "Go (Golang)",
    "Ruby",
    "Ruby on Rails",
    "Concurrency & Message Queues",
    "Kafka",
    "API Design (REST & GraphQL)",
    "PostgreSQL",
    "Redis",
    "Elasticsearch",
    "Docker",
    "Kubernetes",
    "Terraform",
    "AWS (EC2, RDS, S3, Lambda, ECS)",
    "CI/CD (GitHub Actions)",
    "Event-Driven Systems",
    "Microservices",
    "Distributed Systems",
    "OAuth2 / JWT",
    "Payment Gateway Integration",
    "PCI-DSS Compliance",
    "3DS Authentication",
    "Card Tokenization",
    "Fraud Detection",
    "Identity Verification (KYC)",
    "English (C1)",
  ],

  projects: [
    {
      title: "Moyasar payments platform",
      techStack: ["Ruby on Rails", "PostgreSQL", "Kafka", "Microservices"],
      description:
        "Saudi payment gateway. 10+ services behind card processing, with risk scoring and regulatory KYC in the merchant onboarding path.",
      link: {
        label: "moyasar.com",
        href: "https://moyasar.com",
      },
    },
    {
      title: "Mondido checkout",
      techStack: ["Go", "Ruby on Rails", "PCI-DSS", "3DS"],
      description:
        "Nordic payment provider. Card vault, 3DS authentication and installment flows under PCI-DSS scope, with the high-throughput gateway path moved onto Go services.",
      link: {
        label: "mondido.com",
        href: "https://mondido.com",
      },
    },
    {
      title: "Regate accounting automation",
      techStack: ["Ruby on Rails", "Kafka", "AWS", "Terraform"],
      description:
        "French fintech automating bookkeeping. Bank and payment API integrations feeding an event-driven Rails backend, with ephemeral AWS environments per pull request.",
      link: {
        label: "regate.com",
        href: "https://regate.com",
      },
    },
  ],
} as const;
