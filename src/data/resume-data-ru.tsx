import type { ResumeData } from "@/lib/types";
import midjourneyAvatar from "@/images/real-av.jpg";

export const RESUME_DATA: ResumeData = {
  name: "Сергей Якушевич",
  initials: "СЯ",
  location: "Грузия",
  locationLink: "https://www.google.com/maps/place/Warsaw",
  about: "Инженер-программист с 9-летним опытом создания масштабируемых, надежных приложений.",
  summary: (
    <>
      Senior программист с 9-летним опытом разработки создания
      масштабируемых серверных систем и веб-приложений.
      Специализируюсь на Ruby on Rails, хорошо знаю PostgreSQL,
      Redis, Sidekiq и системы обмена сообщениями (Kafka, RabbitMQ).
      Умею проектировать безопасные API (REST/GraphQL), улучшать
      производительность при больших нагрузках и управлять развертыванием в
      облаке на AWS. Опыт разработки в областях финтеха, ecommerce и
      high load. Есть опыт работы в комананде и менторинге разработчиков,
      работал с фронтенд JavaScript (React, React Native, Next.js).
    </>
  ),
  avatarUrl: midjourneyAvatar,
  personalWebsiteUrl: "https://syakushevich.github.io/portfolio",
  contact: {
    email: "sergeyayya@gmail.com",
    tel: "+48530213401",
    social: [
      {
        name: "GitHub",
        url: "https://github.com/syakushevich",
        icon: "github",
      },
      {
        name: "Портфолио",
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
      school: "Белорусский государственный университет",
      degree: "Бакалавр компьютерных наук",
      start: "2013",
      end: "2017",
    },
  ],
  work: [
    {
      company: "Regate",
      link: "https://regate.com",
      badges: [
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
      title: "Старший Ruby on Rails инженер",
      start: "Ноя 2022",
      end: "Май 2025",
      description: [
        "Ввел шаблон Service Layer для упрощения коллбэков и улучшения поддержки кода.",
        "Интегрировал различные платежные и банковские API, автоматизируя бухгалтерию.",
        "Улучшил тестовое покрытие с RSpec и снизил количество ошибок с помощью мониторинга CloudWatch.",
        "Добавил CI/CD для создания новых тестовых сред AWS для каждого Pull Request, улучшив рабочий процесс.",
      ],
    },
    {
      company: "Aristek Systems",
      link: "https://aristeksystems.com",
      badges: [
        "Ruby on Rails",
        "React",
        "PostgreSQL",
        "Docker",
        "AWS RDS",
        "ECS",
        "Lambda",
        "CI/CD",
      ],
      title: "Инженер-программист",
      start: "Июл 2020",
      end: "Окт 2022",
      description: [
        "Переработал и объединил кодовые базы, что позволило автоматизировать CI/CD и ускорить развертывание на 50%.",
        "Масштабировал новую платформу электронной коммерции для увеличения охвата рынка.",
        "Упаковал сервисы в Docker-контейнеры и развернул на AWS ECS для улучшения масштабируемости.",
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
      title: "Инженер-программист",
      start: "Янв 2016",
      end: "Июн 2020",
      description: [
        "Перенес основную базу данных из MySQL в Elasticsearch, что увеличило скорость поиска на 90% для более чем 50 миллионов пользователей.",
        "Внедрил Kafka для улучшения связи между микросервисами.",
        "Ускорил Rspec тесты в 5 раз, сократив время деплоя.",
      ],
    },
  ],
  skills: [
    "English",
    "Ruby",
    "Ruby on Rails",
    "JavaScript",
    "TypeScript",
    "Node.js",
    "React",
    "Next.js",
    "SQL",
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
    "Terraform",
    "CI/CD pipelines (GitHub Actions)",
    "RSpec",
    "Minitest",
    "Cypress",
    "Git",
    "Agile/Scrum",
    "Authentication/Authorization (JWT, OAuth2)",
  ],
  projects: [
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
        "Финтех-платформа. Создал масштабируемые сервисы Rails, интегрировал банковские API, добавил автоматизацию CI/CD для тестовых сред AWS для PR.",
      link: {
        label: "regate.com",
        href: "https://regate.com",
      },
    },
    {
      title: "Aristek Systems",
      techStack: [
        "Ruby on Rails",
        "React",
        "PostgreSQL",
        "Docker",
        "AWS RDS",
        "ECS",
        "Lambda",
        "CI/CD",
      ],
      description:
        "E-commerce платформа. Масштабировал сервисы, перешел на Dockerized микросервисы на AWS ECS и улучшил работу с помощью CI/CD.",
      link: {
        label: "aristeksystems.com",
        href: "https://aristeksystems.com",
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
        "Корпоративные системы. Перенес базу данных в Elasticsearch, интегрировал Kafka для микросервисов, добавил GraphQL API и ускорил CI тесты в 5 раз.",
      link: {
        label: "itransition.com",
        href: "https://itransition.com",
      },
    },
  ],
} as const;