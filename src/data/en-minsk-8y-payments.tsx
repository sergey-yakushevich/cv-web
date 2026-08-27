import type { ResumeData } from "@/lib/types";

export const RESUME_DATA: ResumeData = {
  name: "Sergey Yakushevich",
  initials: "SY",
  location: "Minsk, Belarus",
  locationLink: "https://www.google.com/maps/place/Minsk,+Belarus",
  headline: "Senior Ruby on Rails Engineer",

  about:
    "Senior Ruby on Rails engineer with 8 years of experience owning enterprise SaaS integrations, complex API workflows, and production reliability. Writing Go (Golang) now as well.",
  summary: (
    <>
      Senior Ruby on Rails engineer with 8 years of experience building and
      evolving enterprise-grade SaaS systems with complex business logic and
      large API surfaces. I lead high-impact initiatives end-to-end across
      event-driven architectures, payment and banking integrations, and
      long-lived Rails codebases, with deep hands-on work in Kafka, PostgreSQL,
      and AWS. Proven track record delivering secure, reliable backend
      platforms, improving release quality, and driving architecture decisions
      that scale across fintech and enterprise environments. Most of my career I
      used Ruby, but I write Go now as well, and I am looking for backend roles
      in Ruby or Go.
    </>
  ),
  avatarUrl: "/default-avatar.jpg",
  personalWebsiteUrl: "https://syakushevich.github.io/portfolio",
  contact: {
    email: "sergeyayya@gmail.com",
    tel: "+48530213401",
    social: [
      {
        name: "GitHub",
        url: "https://github.com/sergey-yakushevich",
        icon: "github",
      },
      {
        name: "Portfolio",
        url: "https://syakushevich.github.io/portfolio",
        icon: "globe",
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
        "Elasticsearch",
        "Microservices",
        "Payments",
        "Fraud Detection",
        "Identity Verification",
        "Monitoring & Alerting",
      ],
      title: "Senior Ruby on Rails Engineer",
      start: "Dec 2025",
      end: "Aug 2026",
      description: [
        "Worked on payment processing at scale across 10+ microservices handling 350M+ payments.",
        "Built identity verification to meet Saudi regulatory requirements, enabling compliant merchant onboarding.",
        "Developed the fraud system that blocks transactions on risk signals, reducing exposure to fraudulent payments.",
        "Implemented alerting that surfaces payment flow disruptions early, shortening time to detection for production incidents.",
        "Acted as technical specialist on sales calls, translating platform capabilities for prospective merchants.",
      ],
    },
    {
      company: "Mondido",
      link: "https://mondido.com",
      badges: [
        "Ruby on Rails",
        "PostgreSQL",
        "PCI-DSS",
        "Visa",
        "Card Tokenization",
        "React",
        "Audit Logging",
        "Payments",
      ],
      title: "Senior Ruby on Rails Engineer",
      start: "Jan 2024",
      end: "Jan 2026",
      description: [
        "Owned end-to-end Visa installment integration across backend and frontend, expanding checkout capabilities and increasing real-world payment flexibility.",
        "Implemented PCI-DSS compliant card tokenization, strengthening secure API interactions with payment gateways.",
        "Evaluated audit logging design options and built a high-performance tracing system for merchant and internal actions, improving accountability in a complex production environment.",
      ],
    },
    {
      company: "Regate",
      link: "https://regate.com",
      badges: [
        "Ruby on Rails",
        "PostgreSQL",
        "AWS",
        "Docker",
        "Kubernetes",
        "CI/CD",
        "Kafka",
        "Terraform",
      ],
      title: "Senior Ruby on Rails Engineer",
      start: "Nov 2021",
      end: "Jan 2024",
      description: [
        "Initiated a Service Layer refactor to untangle callback-heavy Rails models, making a long-lived codebase easier to evolve and reason about.",
        "Owned integrations with multiple payment and banking APIs, automating accounting workflows and improving reliability across external systems.",
        "Strengthened RSpec coverage and CloudWatch observability to detect regressions earlier and reduce production error rates.",
        "Automated CI/CD provisioning of AWS test environments per pull request, shortening feedback loops and improving release quality.",
      ],
    },
    {
      company: "iTransition",
      link: "https://itransition.com",
      badges: [
        "Ruby on Rails",
        "Elasticsearch",
        "GraphQL",
        "MySQL",
        "Docker",
        "Kafka",
        "AWS ECS",
        "CI/CD",
      ],
      title: "Software Engineer",
      start: "Jan 2018",
      end: "Jun 2020",
      description: [
        "Migrated the primary search workload from MySQL to Elasticsearch, improving search performance by 90% for 50M+ users.",
        "Evaluated service communication tradeoffs and implemented Kafka to strengthen reliability in an event-driven microservices environment.",
        "Built API endpoints for a large API surface and optimized test pipelines 5x to accelerate release cycles.",
      ],
    },
  ],
  skills: [
    "English (C1)",
    "Ruby",
    "Ruby on Rails",
    "Go (Golang)",
    "JavaScript",
    "TypeScript",
    "Node.js",
    "React",
    "Next.js",
    "GraphQL",
    "PostgreSQL",
    "MySQL",
    "Elasticsearch",
    "Redis",
    "Sidekiq",
    "RabbitMQ",
    "Kafka",
    "AWS (EC2, RDS, S3, Lambda)",
    "Docker",
    "Kubernetes",
    "CI/CD pipelines (GitHub Actions)",
    "RSpec",
    "Minitest",
    "Cypress",
    "Git",
    "Agile/Scrum",
    "API Design (REST & GraphQL)",
    "Authentication/Authorization (JWT, OAuth2)",
    "Event-Driven Systems",
    "Microservices",
    "PCI-DSS Compliance",
    "3DS Authentication",
    "Card Tokenization",
    "Payment Gateway Integration",
    "Visa Installments",
    "Audit Logging",
    "Fraud Detection",
    "Identity Verification (KYC)",
    "Monitoring & Alerting",
  ],
  projects: [
    {
      title: "Moyasar",
      techStack: [
        "Ruby on Rails",
        "PostgreSQL",
        "Elasticsearch",
        "Microservices",
        "Fraud Detection",
        "Identity Verification",
        "Monitoring & Alerting",
      ],
      description:
        "Payments platform processing 350M+ payments across 10+ microservices. Built regulatory-compliant identity verification for the Saudi market, a risk-signal fraud blocking system, and alerting for payment flow disruptions.",
      link: {
        label: "moyasar.com",
        href: "https://moyasar.com",
      },
    },
    {
      title: "Mondido",
      techStack: [
        "Ruby on Rails",
        "React",
        "PostgreSQL",
        "PCI-DSS",
        "3DS",
        "Visa Installments",
        "Card Tokenization",
        "Audit Logging",
      ],
      description:
        "Payments platform. Integrated Visa installment flows, built PCI-DSS compliant card tokenization and 3DS authentication, and delivered a high-performance audit logging system for merchant and staff actions.",
      link: {
        label: "mondido.com",
        href: "https://mondido.com",
      },
    },
    {
      title: "Regate",
      techStack: [
        "Ruby on Rails",
        "React",
        "PostgreSQL",
        "Kafka",
        "Docker",
        "AWS RDS",
        "ECS",
        "CI/CD",
        "Terraform",
      ],
      description:
        "Fintech platform. Built scalable Rails services, integrated banking APIs, added CI/CD automation for AWS testing environments for PRs.",
      link: {
        label: "regate.com",
        href: "https://regate.com",
      },
    },
    {
      title: "iTransition",
      techStack: [
        "Ruby on Rails",
        "Elasticsearch",
        "GraphQL",
        "MySQL",
        "Docker",
        "Kafka",
        "AWS ECS",
        "CI/CD",
      ],
      description:
        "Enterprise systems. Migrated DB to Elasticsearch, integrated Kafka for microservices, added GraphQL API, and accelerated CI tests 5x.",
      link: {
        label: "itransition.com",
        href: "https://itransition.com",
      },
    },
  ],
} as const;
