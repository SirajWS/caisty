// Company page (Caisty) — en, fr, de, ar
import type { Language } from "./types";
import type { TranslationSchema } from "./types";
import { TECH_STACK_ICONS } from "./common";

const companyLocales = {
  en: {
    hero: {
      badge: "Caisty",
      headline: "Business software for modern companies.",
      subtitle:
        "We develop cloud software, SaaS platforms, and AI-powered solutions that help businesses run more efficiently. Starting with Caisty POS — and building what comes next.",
      ctaExplore: "Explore Caisty POS",
      ctaContact: "Contact us",
    },
    mock: {
      caption: "Product suite",
      liveBadge: "Platform",
      items: ["Caisty POS", "ShiftIQ", "Cloud portal", "Licenses", "Invoices", "Devices"],
      footerNote: "We build our own business products — not a web agency.",
    },
    about: {
      title: "About Caisty",
      paragraphs: [
        "Caisty develops modern software products for businesses. Our focus is on cloud software, SaaS platforms, automation and AI-powered solutions that help companies work more efficiently.",
        "We build our own products — starting with Caisty POS for retail and hospitality, and ShiftIQ for workforce management.",
        "Our mission: create reliable, scalable software that solves real business problems.",
      ],
      highlights: [
        { title: "Own products", body: "We design, ship and operate our platforms end-to-end — not client brochureware." },
        { title: "Operations-first", body: "Built for real tills, shifts, inventory and teams — not generic landing pages." },
        { title: "Germany-based", body: "Registered software company focused on long-term product quality and compliance." },
      ],
    },
    products: {
      title: "Our products",
      statusAvailableNow: "Available",
      statusComingSoon: "Coming soon",
      pos: {
        name: "Caisty POS",
        description:
          "Modern cloud POS for restaurants, cafés, fast food and retail — checkout, orders, inventory and a customer portal in one stack.",
        features: [
          "Fast checkout",
          "Orders and products",
          "Receipt printing",
          "Cloud portal",
          "Invoices and licenses",
        ],
        ctaLearn: "Open Caisty POS",
      },
      shiftiq: {
        name: "ShiftIQ",
        description: "Workforce management and employee time tracking for growing teams.",
        features: ["Time tracking", "Shift planning", "Employee check-in", "Team management", "Reports"],
        ctaDisabled: "Coming soon",
      },
    },
    whatWeDo: {
      title: "What we do",
      subtitle: "From cloud platforms to AI tools — software built for real business operations.",
      items: [
        {
          iconKey: "cloud" as const,
          title: "SaaS & cloud solutions",
          description:
            "Development and operation of cloud-based software platforms. Scalable, reliable, accessible from anywhere.",
        },
        {
          iconKey: "monitor" as const,
          title: "Business software",
          description:
            "POS systems, workforce management, customer portals and operational tools for restaurants, retail and growing teams.",
        },
        {
          iconKey: "bot" as const,
          title: "AI & automation",
          description:
            "AI-powered tools and workflow automation to reduce manual work and help businesses make smarter decisions.",
        },
        {
          iconKey: "smartphone" as const,
          title: "Web & mobile applications",
          description:
            "Web applications, mobile apps and digital business tools tailored to specific operational needs.",
        },
      ],
    },
    whyChoose: {
      title: "Why companies choose Caisty",
      points: [
        "Cloud-based — access from anywhere, no local setup",
        "AI-ready — built to integrate intelligent features",
        "Automation-focused — reduce manual work across operations",
        "Multi-language support — built for international use",
        "Multi-currency support — ready for global markets",
        "Offline-first architecture — works even without internet",
        "Scalable infrastructure — grows with your business",
        "Built for real operations — designed by people who understand how businesses actually work",
      ],
    },
    roadmap: {
      title: "Product roadmap",
      subtitle: "We're building more than a POS system.",
      colProduct: "Product",
      colStatus: "Status",
      rows: [
        { product: "Caisty POS", status: "Available", variant: "available" as const },
        { product: "ShiftIQ", status: "Coming soon", variant: "soon" as const },
        { product: "Future CRM modules", status: "Planned", variant: "planned" as const },
        { product: "Automation tools", status: "Planned", variant: "planned" as const },
        { product: "AI business assistant", status: "In research", variant: "research" as const },
      ],
    },
    technology: {
      title: "Technology stack",
      lead: "Built with modern, proven technology",
      stack: TECH_STACK_ICONS,
    },
    contactCta: {
      headline: "Building the next generation of business software.",
      body: "From cloud software and SaaS platforms to AI and automation solutions — Caisty develops tools that help businesses grow and operate more efficiently.",
      ctaPrimary: "Explore Caisty POS",
      ctaSecondary: "Contact us",
    },
  },
  fr: {
    hero: {
      badge: "Caisty",
      headline: "Logiciels métier pour les entreprises modernes.",
      subtitle:
        "Nous développons des logiciels cloud, des plateformes SaaS et des solutions IA pour aider les entreprises à gagner en efficacité. En commençant par Caisty POS — et en poursuivant avec la suite.",
      ctaExplore: "Découvrir Caisty POS",
      ctaContact: "Nous contacter",
    },
    mock: {
      caption: "Suite produits",
      liveBadge: "Plateforme",
      items: ["Caisty POS", "ShiftIQ", "Portail cloud", "Licences", "Factures", "Appareils"],
      footerNote: "Nous développons nos propres produits logiciels — pas une agence web.",
    },
    about: {
      title: "À propos de Caisty",
      paragraphs: [
        "Caisty conçoit des produits logiciels modernes pour les entreprises : cloud, SaaS, automatisation et IA au service de l’efficacité opérationnelle.",
        "Nous développons nos propres produits — Caisty POS pour la restauration et le commerce, et ShiftIQ pour la gestion des équipes et le temps.",
        "Notre mission : des logiciels fiables et évolutifs qui répondent à de vrais problèmes métier.",
      ],
      highlights: [
        { title: "Produits maison", body: "Conception, exploitation et évolution de nos plateformes — pas de projets à la chaîne." },
        { title: "Orienté terrain", body: "Pensé pour caisses, plannings, stocks et équipes — pas pour de simples vitrines web." },
        { title: "Basé en Allemagne", body: "Éditeur inscrit, avec une vision long terme sur la qualité produit et la conformité." },
      ],
    },
    products: {
      title: "Nos produits",
      statusAvailableNow: "Disponible",
      statusComingSoon: "Bientôt disponible",
      pos: {
        name: "Caisty POS",
        description:
          "Caisse cloud moderne pour restaurants, cafés, fast-foods et retail — encaissement, commandes, stocks et portail client.",
        features: [
          "Encaissement rapide",
          "Commandes et produits",
          "Impression des tickets",
          "Portail cloud",
          "Factures et licences",
        ],
        ctaLearn: "Ouvrir Caisty POS",
      },
      shiftiq: {
        name: "ShiftIQ",
        description: "Gestion des équipes et suivi du temps pour les organisations en croissance.",
        features: ["Suivi du temps", "Planification des shifts", "Pointage employés", "Gestion d’équipe", "Rapports"],
        ctaDisabled: "Bientôt disponible",
      },
    },
    whatWeDo: {
      title: "Ce que nous faisons",
      subtitle: "Des plateformes cloud aux outils IA — des logiciels pensés pour les opérations réelles.",
      items: [
        {
          iconKey: "cloud" as const,
          title: "SaaS & solutions cloud",
          description:
            "Développement et exploitation de plateformes logicielles cloud : scalables, fiables, accessibles partout.",
        },
        {
          iconKey: "monitor" as const,
          title: "Logiciels métier",
          description:
            "POS, gestion des équipes, portails clients et outils opérationnels pour la restauration, le retail et les équipes qui grandissent.",
        },
        {
          iconKey: "bot" as const,
          title: "IA & automatisation",
          description:
            "Outils IA et automatisation des flux pour réduire le travail manuel et éclairer les décisions.",
        },
        {
          iconKey: "smartphone" as const,
          title: "Applications web & mobiles",
          description:
            "Applications web et mobiles et outils numériques adaptés à des besoins opérationnels précis.",
        },
      ],
    },
    whyChoose: {
      title: "Pourquoi les entreprises choisissent Caisty",
      points: [
        "Cloud — accès partout, sans installation locale lourde",
        "Prêt pour l’IA — conçu pour intégrer des fonctions intelligentes",
        "Automatisation — moins de tâches manuelles dans les opérations",
        "Multilingue — pensé pour un usage international",
        "Multidevise — prêt pour des marchés mondiaux",
        "Offline-first — fonctionne même sans connexion internet",
        "Infrastructure évolutive — grandit avec votre activité",
        "Conçu pour le terrain — par des personnes qui comprennent les opérations réelles",
      ],
    },
    roadmap: {
      title: "Feuille de route produit",
      subtitle: "Nous construisons bien plus qu’un système de caisse.",
      colProduct: "Produit",
      colStatus: "Statut",
      rows: [
        { product: "Caisty POS", status: "Disponible", variant: "available" as const },
        { product: "ShiftIQ", status: "Bientôt disponible", variant: "soon" as const },
        { product: "Modules CRM futurs", status: "Planifié", variant: "planned" as const },
        { product: "Outils d’automatisation", status: "Planifié", variant: "planned" as const },
        { product: "Assistant IA métier", status: "En recherche", variant: "research" as const },
      ],
    },
    technology: {
      title: "Stack technologique",
      lead: "Construit avec des technologies modernes et éprouvées",
      stack: TECH_STACK_ICONS,
    },
    contactCta: {
      headline: "Construire la prochaine génération de logiciels métier.",
      body: "Du cloud et du SaaS à l’IA et à l’automatisation — Caisty développe des outils pour aider les entreprises à croître et à opérer plus efficacement.",
      ctaPrimary: "Découvrir Caisty POS",
      ctaSecondary: "Nous contacter",
    },
  },
  de: {
    hero: {
      badge: "Caisty",
      headline: "Business-Software für moderne Unternehmen.",
      subtitle:
        "Wir entwickeln Cloud-Software, SaaS-Plattformen und KI-gestützte Lösungen, die Unternehmen effizienter machen. Beginnend mit Caisty POS — und mit allem, was danach kommt.",
      ctaExplore: "Caisty POS entdecken",
      ctaContact: "Kontakt",
    },
    mock: {
      caption: "Produktfamilie",
      liveBadge: "Plattform",
      items: ["Caisty POS", "ShiftIQ", "Cloud-Portal", "Lizenzen", "Rechnungen", "Geräte"],
      footerNote: "Eigene Business-Software-Produkte — keine Webagentur.",
    },
    about: {
      title: "Über Caisty",
      paragraphs: [
        "Caisty entwickelt moderne Softwareprodukte für Unternehmen — mit Fokus auf Cloud-Software, SaaS, Automatisierung und KI, damit Organisationen effizienter arbeiten können.",
        "Wir bauen eigene Produkte — beginnend mit Caisty POS für Gastronomie und Handel sowie ShiftIQ für Workforce-Management.",
        "Unsere Mission: zuverlässige, skalierbare Software, die echte betriebliche Probleme löst.",
      ],
      highlights: [
        { title: "Eigene Produkte", body: "Wir entwickeln und betreiben unsere Plattformen selbst — kein Projektgeschäft nach Auftrag." },
        { title: "Betrieb im Blick", body: "Für echte Kassen, Schichten, Bestände und Teams — nicht für generische Webauftritte." },
        { title: "Deutschland", body: "Registriertes Softwareunternehmen mit Fokus auf Qualität und Compliance über Jahre." },
      ],
    },
    products: {
      title: "Unsere Produkte",
      statusAvailableNow: "Verfügbar",
      statusComingSoon: "Demnächst",
      pos: {
        name: "Caisty POS",
        description:
          "Moderne Cloud-POS-Software für Gastronomie, Café, Fast Food und Einzelhandel — Kasse, Bestellungen, Bestand und Kundenportal.",
        features: [
          "Schnelle Kasse",
          "Bestellungen und Artikel",
          "Belegdruck",
          "Cloud-Portal",
          "Rechnungen und Lizenzen",
        ],
        ctaLearn: "Caisty POS öffnen",
      },
      shiftiq: {
        name: "ShiftIQ",
        description: "Workforce-Management und Zeiterfassung für wachsende Teams.",
        features: ["Zeiterfassung", "Schichtplanung", "Check-in", "Teamverwaltung", "Reports"],
        ctaDisabled: "Demnächst",
      },
    },
    whatWeDo: {
      title: "Was wir tun",
      subtitle: "Von Cloud-Plattformen bis zu KI-Tools — Software für echte Betriebsabläufe.",
      items: [
        {
          iconKey: "cloud" as const,
          title: "SaaS & Cloud-Lösungen",
          description:
            "Entwicklung und Betrieb cloudbasierter Plattformen — skalierbar, zuverlässig, von überall nutzbar.",
        },
        {
          iconKey: "monitor" as const,
          title: "Business-Software",
          description:
            "Kassensysteme, Workforce-Management, Kundenportale und operative Tools für Gastronomie, Handel und Teams.",
        },
        {
          iconKey: "bot" as const,
          title: "KI & Automatisierung",
          description:
            "KI-gestützte Funktionen und Workflow-Automatisierung, um manuelle Arbeit zu reduzieren und Entscheidungen zu verbessern.",
        },
        {
          iconKey: "smartphone" as const,
          title: "Web- & Mobile-Apps",
          description:
            "Webanwendungen, mobile Apps und digitale Business-Tools für konkrete betriebliche Anforderungen.",
        },
      ],
    },
    whyChoose: {
      title: "Warum Unternehmen Caisty wählen",
      points: [
        "Cloud-basiert — Zugriff überall, ohne lokale Installation",
        "KI-fähig — vorbereitet für intelligente Funktionen",
        "Automatisierung — weniger manuelle Arbeit im Tagesgeschäft",
        "Mehrsprachig — für internationalen Einsatz gebaut",
        "Multi-Währung — bereit für globale Märkte",
        "Offline-first — funktioniert auch ohne Internet",
        "Skalierbare Infrastruktur — wächst mit Ihrem Geschäft",
        "Für den echten Betrieb — von Menschen, die wissen, wie Unternehmen arbeiten",
      ],
    },
    roadmap: {
      title: "Produkt-Roadmap",
      subtitle: "Wir bauen mehr als ein Kassensystem.",
      colProduct: "Produkt",
      colStatus: "Status",
      rows: [
        { product: "Caisty POS", status: "Verfügbar", variant: "available" as const },
        { product: "ShiftIQ", status: "Demnächst", variant: "soon" as const },
        { product: "Zukünftige CRM-Module", status: "Geplant", variant: "planned" as const },
        { product: "Automatisierungstools", status: "Geplant", variant: "planned" as const },
        { product: "KI-Assistent fürs Business", status: "In Forschung", variant: "research" as const },
      ],
    },
    technology: {
      title: "Technologie-Stack",
      lead: "Mit modernen, bewährten Technologien umgesetzt",
      stack: TECH_STACK_ICONS,
    },
    contactCta: {
      headline: "Die nächste Generation Business-Software entwickeln.",
      body: "Von Cloud- und SaaS-Plattformen bis zu KI und Automatisierung — Caisty entwickelt Werkzeuge, damit Unternehmen wachsen und effizienter arbeiten können.",
      ctaPrimary: "Caisty POS entdecken",
      ctaSecondary: "Kontakt",
    },
  },
  ar: {
    hero: {
      badge: "Caisty",
      headline: "برمجيات أعمال للشركات الحديثة.",
      subtitle:
        "نطوّر برمجيات سحابية ومنصات SaaS وحلولاً مدعومة بالذكاء الاصطناعي تساعد الشركات على العمل بكفاءة أكبر. بدءًا من Caisty POS — وما يليه في الطريق.",
      ctaExplore: "استكشف Caisty POS",
      ctaContact: "تواصل معنا",
    },
    mock: {
      caption: "حزمة المنتجات",
      liveBadge: "المنصة",
      items: ["Caisty POS", "ShiftIQ", "بوابة سحابية", "التراخيص", "الفواتير", "الأجهزة"],
      footerNote: "نطوّر منتجاتنا البرمجية بأنفسنا — وليس وكالة ويب.",
    },
    about: {
      title: "عن Caisty",
      paragraphs: [
        "تطوّر Caisty منتجات برمجية حديثة للشركات، مع تركيز على السحابة وSaaS والأتمتة والذكاء الاصطناعي لرفع كفاءة العمل.",
        "نبني منتجاتنا الخاصة — بدءًا من Caisty POS للمطاعم والتجزئة، وShiftIQ لإدارة القوى العاملة.",
        "مهمتنا: برمجيات موثوقة وقابلة للتوسع تحل مشاكل أعمال حقيقية.",
      ],
      highlights: [
        { title: "منتجات ملكية", body: "نصمّم ونشغّل منصاتنا بأنفسنا — وليس مشاريع عملاء عرضية." },
        { title: "من منظور التشغيل", body: "للكاشير والورديات والمخزون والفرق — وليس لصفحات تعريف عامة." },
        { title: "شركة في ألمانيا", body: "مسجّلون كشركة برمجيات مع التزام طويل الأمد بالجودة والامتثال." },
      ],
    },
    products: {
      title: "منتجاتنا",
      statusAvailableNow: "متاح",
      statusComingSoon: "قريباً",
      pos: {
        name: "Caisty POS",
        description: "نقاط بيع سحابية حديثة للمطاعم والمقاهي والوجبات السريعة والتجزئة — مع بوابة عملاء.",
        features: ["دفع سريع", "الطلبات والمنتجات", "طباعة الإيصالات", "بوابة سحابية", "الفواتير والتراخيص"],
        ctaLearn: "فتح Caisty POS",
      },
      shiftiq: {
        name: "ShiftIQ",
        description: "إدارة القوى العاملة وتتبع وقت الموظفين للفرق النامية.",
        features: ["تتبع الوقت", "تخطيط الورديات", "تسجيل الحضور", "إدارة الفريق", "التقارير"],
        ctaDisabled: "قريباً",
      },
    },
    whatWeDo: {
      title: "ماذا نفعل",
      subtitle: "من منصات سحابية إلى أدوات ذكاء اصطناعي — برمجيات لعمليات أعمال حقيقية.",
      items: [
        {
          iconKey: "cloud" as const,
          title: "SaaS وحلول سحابية",
          description: "تطوير وتشغيل منصات برمجية سحابية قابلة للتوسع وموثوقة ومتاحة من أي مكان.",
        },
        {
          iconKey: "monitor" as const,
          title: "برمجيات أعمال",
          description:
            "أنظمة نقاط بيع وإدارة قوى عاملة وبوابات عملاء وأدوات تشغيل للمطاعم والتجزئة والفرق المتنامية.",
        },
        {
          iconKey: "bot" as const,
          title: "ذكاء اصطناعي وأتمتة",
          description: "أدوات مدعومة بالذكاء الاصطناعي وأتمتة سير العمل لتقليل العمل اليدوي ودعم القرار.",
        },
        {
          iconKey: "smartphone" as const,
          title: "تطبيقات ويب وموبايل",
          description: "تطبيقات ويب وموبايل وأدوات رقمية تناسب احتياجات تشغيلية محددة.",
        },
      ],
    },
    whyChoose: {
      title: "لماذا تختار الشركات Caisty",
      points: [
        "سحابي — وصول من أي مكان دون إعداد محلي ثقيل",
        "جاهز للذكاء الاصطناعي — مصمم لدمج ميزات ذكية",
        "يركز على الأتمتة — تقليل العمل اليدوي عبر العمليات",
        "متعدد اللغات — مبني للاستخدام الدولي",
        "متعدد العملات — جاهز للأسواق العالمية",
        "يعمل دون اتصال أولاً — يعمل حتى دون إنترنت",
        "بنية تحتية قابلة للتوسع — تنمو مع عملك",
        "مبني للعمليات الحقيقية — من يفهمون كيف تعمل الشركات فعلياً",
      ],
    },
    roadmap: {
      title: "خارطة طريق المنتجات",
      subtitle: "نبني أكثر من نظام نقاط بيع.",
      colProduct: "المنتج",
      colStatus: "الحالة",
      rows: [
        { product: "Caisty POS", status: "متاح", variant: "available" as const },
        { product: "ShiftIQ", status: "قريباً", variant: "soon" as const },
        { product: "وحدات CRM مستقبلية", status: "مخطط", variant: "planned" as const },
        { product: "أدوات أتمتة", status: "مخطط", variant: "planned" as const },
        { product: "مساعد أعمال بالذكاء الاصطناعي", status: "قيد البحث", variant: "research" as const },
      ],
    },
    technology: {
      title: "مجموعة التقنيات",
      lead: "مبني بتقنيات حديثة ومجرّبة",
      stack: TECH_STACK_ICONS,
    },
    contactCta: {
      headline: "بناء الجيل القادم من برمجيات الأعمال.",
      body: "من السحابة وSaaS إلى الذكاء الاصطناعي والأتمتة — تطوّر Caisty أدوات تساعد الشركات على النمو والعمل بكفاءة أكبر.",
      ctaPrimary: "استكشف Caisty POS",
      ctaSecondary: "تواصل معنا",
    },
  },
};

export type CompanyCopy = TranslationSchema<(typeof companyLocales)["en"]>;
export const company: Record<Language, CompanyCopy> = companyLocales;
