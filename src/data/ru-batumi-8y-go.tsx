import type { ResumeData } from "@/lib/types";

export const RESUME_DATA: ResumeData = {
  name: "Сергей Якушевич",
  initials: "СЯ",
  location: "Батуми, Грузия",
  locationLink: "https://www.google.com/maps/place/Batumi,+Georgia",

  headline: "Senior Backend Engineer (Go, Ruby)",

  about:
    "Senior Backend Engineer (Go, Ruby). 8 лет в бэкенде платёжных систем, сейчас пишу на Golang. Kafka, PostgreSQL, AWS, PCI-DSS.",

  summary: (
    <>
      Я 8 лет занимаюсь бэкендом, из них последние 5 лет платёжными системами. В
      Moyasar я построил антифрод и верификацию личности под требования
      регулятора на платформе, через которую прошло 350M+ платежей в 10+
      микросервисах. До этого сделал рассрочку Visa и токенизацию карт по
      PCI-DSS в Mondido, а в Regate переписал интеграции с банками. Я веду фичу
      от схемы базы до алерта, который будит дежурного, когда она ломается в
      проде. Большую часть карьеры писал на Ruby, сейчас пишу и на Go, ищу
      бэкенд-роли на Ruby или Go.
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
        name: "LinkedIn",
        url: "https://linkedin.com/in/sergey-yakushevich-688a4b179/",
        icon: "linkedin",
      },
      {
        name: "Портфолио",
        url: "https://syakushevich.github.io/portfolio",
        icon: "globe",
      },
    ],
  },
  education: [
    {
      school: "Белорусский государственный университет",
      degree: "Бакалавр компьютерных наук",
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
      title: "Senior Ruby on Rails Engineer",
      start: "Дек 2025",
      end: "Авг 2026",
      description: [
        "Построил систему антифрода, которая оценивает риск транзакций и блокирует их, на платформе, через которую прошло 350M+ платежей в 10+ микросервисах.",
        "Сделал верификацию личности под требования регулятора. Она была нужна, чтобы выходить на новые рынки.",
        "Написал алертинг на сбои в платёжных потоках и сократил время обнаружения с часов до секунд. Теперь мы узнаём о них от монитора, а не от мерчанта.",
        "По своей инициативе разобрал, какими функциями платформы мерчанты реально пользуются, и отдал цифры менеджменту. Продажи теперь показывают новым клиентам в первую очередь самые востребованные функции.",
        "Подключался к звонкам с потенциальными клиентами как технический специалист, когда у них были вопросы по интеграции.",
      ],
    },
    {
      company: "Mondido",
      link: "https://mondido.com",
      badges: [
        "Ruby on Rails",
        "React",
        "PostgreSQL",
        "PCI-DSS",
        "Card Tokenization",
        "Visa",
      ],
      title: "Senior Ruby on Rails Engineer",
      start: "Янв 2024",
      end: "Янв 2026",
      description: [
        "Сделал интеграцию рассрочки Visa целиком, бэкенд и UI чекаута. Мерчанты давно просили этот способ оплаты.",
        "Построил токенизацию карт по PCI-DSS для запросов к шлюзам, чтобы номера карт не попадали в наши системы.",
        "Сравнил несколько вариантов аудит-логов и собрал тот, который пишет каждое действие мерчанта и сотрудника, не добавляя задержки в запрос.",
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
      title: "Senior Ruby on Rails Engineer",
      start: "Ноя 2021",
      end: "Янв 2024",
      description: [
        "Автоматизировал создание тестовых окружений в AWS на каждый pull request. Ревьюеры получали работающее приложение вместо скриншота, и качество релизов выросло.",
        "Вёл интеграции с платёжными и банковскими API, на которых держится автоматизация бухгалтерии.",
        "Начал рефакторинг Service Layer и вынес бизнес-логику из моделей Rails, забитых коллбэками. После этого код снова стало безопасно менять.",
        "Поднял покрытие RSpec и добавил дашборды в CloudWatch, чтобы регрессии всплывали в CI, а не в проде.",
      ],
    },
    {
      company: "iTransition",
      link: "https://itransition.com",
      badges: [
        "Kafka",
        "Elasticsearch",
        "Microservices",
        "GraphQL",
        "AWS ECS",
        "Ruby on Rails",
      ],
      title: "Инженер-программист",
      start: "Янв 2018",
      end: "Июн 2020",
      description: [
        "Перенёс основную поисковую нагрузку с MySQL на Elasticsearch и ускорил поиск на 90% для 50M+ пользователей.",
        "Ускорил тестовый пайплайн в 5 раз, релизный цикл сократился с дней до часов.",
        "Взвесил варианты общения между сервисами и внедрил Kafka, после чего микросервисы перестали ходить друг к другу синхронно.",
      ],
    },
  ],

  skills: [
    "Go (Golang)",
    "Ruby",
    "Ruby on Rails",
    "Конкурентность и очереди сообщений",
    "Kafka",
    "Проектирование API (REST и GraphQL)",
    "PostgreSQL",
    "Redis",
    "Elasticsearch",
    "Docker",
    "Kubernetes",
    "Terraform",
    "AWS (EC2, RDS, S3, Lambda, ECS)",
    "CI/CD (GitHub Actions)",
    "Event-Driven системы",
    "Микросервисы",
    "Распределённые системы",
    "OAuth2 / JWT",
    "Интеграции платёжных шлюзов",
    "PCI-DSS",
    "3DS аутентификация",
    "Токенизация карт",
    "Антифрод",
    "Верификация личности (KYC)",
    "Английский (C1)",
  ],

  projects: [
    {
      title: "Платёжная платформа Moyasar",
      techStack: ["Ruby on Rails", "PostgreSQL", "Kafka", "Microservices"],
      description:
        "Платёжный шлюз в Саудовской Аравии. 10+ сервисов за обработкой карт, скоринг риска и регуляторный KYC в подключении мерчантов.",
      link: {
        label: "moyasar.com",
        href: "https://moyasar.com",
      },
    },
    {
      title: "Чекаут Mondido",
      techStack: ["Ruby on Rails", "React", "PCI-DSS", "3DS"],
      description:
        "Скандинавский платёжный провайдер. Хранилище карт, 3DS аутентификация и рассрочка в контуре PCI-DSS, плюс аудит-лог действий мерчантов и сотрудников.",
      link: {
        label: "mondido.com",
        href: "https://mondido.com",
      },
    },
    {
      title: "Автоматизация бухгалтерии Regate",
      techStack: ["Ruby on Rails", "Kafka", "AWS", "Terraform"],
      description:
        "Французский финтех, автоматизирующий бухгалтерию. Интеграции с банковскими и платёжными API поверх событийного бэкенда на Rails, тестовые окружения в AWS на каждый pull request.",
      link: {
        label: "regate.com",
        href: "https://regate.com",
      },
    },
  ],
} as const;
