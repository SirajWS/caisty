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
        "We create modern business software that helps restaurants, retail stores and growing teams run their operations more efficiently.",
      subtitleSecondary:
        "From point-of-sale systems to workforce management, our products are built to be reliable, scalable and easy to use.",
      ctaExplore: "Explore Caisty POS",
      ctaContact: "Contact us",
    },
    mock: {
      caption: "Product suite",
      liveBadge: "Platform",
      items: ["Caisty POS", "ShiftIQ", "Cloud portal", "Licenses", "Invoices", "Devices"],
      footerNote: "We build our own business products — not a web agency.",
    },
    stats: {
      cards: [
        { stat: "2", label: "Products" },
        { stat: "1", label: "Platform" },
        { stat: "4", label: "Languages" },
        { stat: "—", label: "Cloud-based" },
      ],
    },
    products: {
      title: "Our products",
      statusAvailableNow: "Available",
      statusComingSoon: "Coming soon",
      pos: {
        name: "Caisty POS",
        description:
          "Modern cloud POS software for restaurants, cafés, fast food businesses and retail shops.",
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
        description: "Workforce management and employee time tracking for modern teams.",
        features: [
          "Time tracking",
          "Shift planning",
          "Employee check-in",
          "Team management",
          "Reports",
        ],
        ctaDisabled: "Coming soon",
      },
    },
    whyChoose: {
      title: "Why businesses choose Caisty",
      points: [
        "Reliable software",
        "Offline-first architecture",
        "Cloud management portal",
        "Multi-language support",
        "Multi-currency support",
        "Designed for real-world operations",
      ],
    },
    technology: {
      title: "Technology stack",
      stack: TECH_STACK_ICONS,
    },
    building: {
      title: "What we are building",
      posTitle: "Caisty POS",
      posSub: "Available today",
      posItems: [
        "Cash register",
        "Orders",
        "Inventory",
        "Licenses",
        "Devices",
        "Cloud portal",
      ],
      shiftiqTitle: "ShiftIQ",
      shiftiqSub: "Coming soon",
      shiftiqItems: [
        "Time tracking",
        "Shift planning",
        "Employee management",
        "Attendance",
        "Reports",
      ],
    },
    contactCta: {
      headline: "Let's build better business software.",
      body: "Interested in Caisty POS or future Caisty products? Contact us and let's talk.",
      ctaStart: "Start free",
      ctaContact: "Contact us",
    },
  },
  fr: {
    hero: {
      badge: "Caisty",
      headline: "Logiciels métier pour les entreprises modernes.",
      subtitle:
        "Nous créons des logiciels métier modernes qui aident les restaurants, les commerces de détail et les équipes en croissance à piloter leurs opérations plus efficacement.",
      subtitleSecondary:
        "Des systèmes de caisse à la gestion des équipes, nos produits sont pensés pour être fiables, évolutifs et simples à utiliser.",
      ctaExplore: "Découvrir Caisty POS",
      ctaContact: "Nous contacter",
    },
    mock: {
      caption: "Suite produits",
      liveBadge: "Plateforme",
      items: ["Caisty POS", "ShiftIQ", "Portail cloud", "Licences", "Factures", "Appareils"],
      footerNote: "Nous développons nos propres produits logiciels — pas une agence web.",
    },
    stats: {
      cards: [
        { stat: "2", label: "Produits" },
        { stat: "1", label: "Plateforme" },
        { stat: "4", label: "Langues" },
        { stat: "—", label: "Cloud" },
      ],
    },
    products: {
      title: "Nos produits",
      statusAvailableNow: "Disponible",
      statusComingSoon: "Bientôt disponible",
      pos: {
        name: "Caisty POS",
        description:
          "Logiciel de caisse cloud moderne pour restaurants, cafés, fast-foods et commerces de détail.",
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
        description:
          "Gestion des équipes et suivi du temps de travail pour les organisations modernes.",
        features: [
          "Suivi du temps",
          "Planification des shifts",
          "Pointage employés",
          "Gestion d’équipe",
          "Rapports",
        ],
        ctaDisabled: "Bientôt disponible",
      },
    },
    whyChoose: {
      title: "Pourquoi les entreprises choisissent Caisty",
      points: [
        "Logiciels fiables",
        "Architecture offline-first",
        "Portail de gestion cloud",
        "Support multilingue",
        "Support multidevise",
        "Conçu pour les opérations réelles",
      ],
    },
    technology: {
      title: "Stack technologique",
      stack: TECH_STACK_ICONS,
    },
    building: {
      title: "Ce que nous construisons",
      posTitle: "Caisty POS",
      posSub: "Disponible aujourd’hui",
      posItems: [
        "Caisse enregistreuse",
        "Commandes",
        "Stocks",
        "Licences",
        "Appareils",
        "Portail cloud",
      ],
      shiftiqTitle: "ShiftIQ",
      shiftiqSub: "Bientôt disponible",
      shiftiqItems: [
        "Suivi du temps",
        "Planification des shifts",
        "Gestion des employés",
        "Présences",
        "Rapports",
      ],
    },
    contactCta: {
      headline: "Construisons de meilleurs logiciels métier.",
      body: "Intéressé par Caisty POS ou les futurs produits Caisty ? Contactez-nous et parlons-en.",
      ctaStart: "Commencer gratuitement",
      ctaContact: "Nous contacter",
    },
  },
  de: {
    hero: {
      badge: "Caisty",
      headline: "Business-Software für moderne Unternehmen.",
      subtitle:
        "Wir entwickeln moderne Business-Software, die Restaurants, Einzelhandel und wachsende Teams dabei unterstützt, ihre Abläufe effizienter zu steuern.",
      subtitleSecondary:
        "Von Kassensystemen bis Workforce-Management sind unsere Produkte zuverlässig, skalierbar und einfach zu bedienen.",
      ctaExplore: "Caisty POS entdecken",
      ctaContact: "Kontakt",
    },
    mock: {
      caption: "Produktfamilie",
      liveBadge: "Plattform",
      items: ["Caisty POS", "ShiftIQ", "Cloud-Portal", "Lizenzen", "Rechnungen", "Geräte"],
      footerNote: "Eigene Business-Software-Produkte — keine Webagentur.",
    },
    stats: {
      cards: [
        { stat: "2", label: "Produkte" },
        { stat: "1", label: "Plattform" },
        { stat: "4", label: "Sprachen" },
        { stat: "—", label: "Cloud-basiert" },
      ],
    },
    products: {
      title: "Unsere Produkte",
      statusAvailableNow: "Verfügbar",
      statusComingSoon: "Demnächst",
      pos: {
        name: "Caisty POS",
        description:
          "Moderne Cloud-POS-Software für Restaurants, Cafés, Fast-Food und Einzelhandel.",
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
        description: "Workforce-Management und Zeiterfassung für moderne Teams.",
        features: [
          "Zeiterfassung",
          "Schichtplanung",
          "Check-in am Arbeitsplatz",
          "Teamverwaltung",
          "Reports",
        ],
        ctaDisabled: "Demnächst",
      },
    },
    whyChoose: {
      title: "Warum Unternehmen Caisty wählen",
      points: [
        "Zuverlässige Software",
        "Offline-first-Architektur",
        "Cloud-Verwaltungsportal",
        "Mehrsprachiger Support",
        "Multi-Währung",
        "Für den echten Betrieb entwickelt",
      ],
    },
    technology: {
      title: "Technologie-Stack",
      stack: TECH_STACK_ICONS,
    },
    building: {
      title: "Woran wir arbeiten",
      posTitle: "Caisty POS",
      posSub: "Heute verfügbar",
      posItems: [
        "Kasse",
        "Bestellungen",
        "Lager / Inventar",
        "Lizenzen",
        "Geräte",
        "Cloud-Portal",
      ],
      shiftiqTitle: "ShiftIQ",
      shiftiqSub: "Demnächst",
      shiftiqItems: [
        "Zeiterfassung",
        "Schichtplanung",
        "Mitarbeiterverwaltung",
        "Anwesenheit",
        "Berichte",
      ],
    },
    contactCta: {
      headline: "Gemeinsam bessere Business-Software bauen.",
      body: "Interesse an Caisty POS oder künftigen Produkten von Caisty? Kontaktieren Sie uns — wir sprechen gern mit Ihnen.",
      ctaStart: "Kostenlos starten",
      ctaContact: "Kontakt",
    },
  },
  ar: {
    hero: {
      badge: "Caisty",
      headline: "برمجيات أعمال للشركات الحديثة.",
      subtitle:
        "ننشئ برمجيات أعمال حديثة تساعد المطاعم ومتاجر التجزئة والفرق النامية على إدارة عملياتها بكفاءة أكبر.",
      subtitleSecondary:
        "من أنظمة نقاط البيع إلى إدارة القوى العاملة، منتجاتنا مصممة لتكون موثوقة وقابلة للتوسع وسهلة الاستخدام.",
      ctaExplore: "استكشف Caisty POS",
      ctaContact: "تواصل معنا",
    },
    mock: {
      caption: "حزمة المنتجات",
      liveBadge: "المنصة",
      items: ["Caisty POS", "ShiftIQ", "بوابة سحابية", "التراخيص", "الفواتير", "الأجهزة"],
      footerNote: "نطوّر منتجاتنا البرمجية بأنفسنا — وليس وكالة ويب.",
    },
    stats: {
      cards: [
        { stat: "2", label: "منتجات" },
        { stat: "1", label: "منصة" },
        { stat: "4", label: "لغات" },
        { stat: "—", label: "سحابي" },
      ],
    },
    products: {
      title: "منتجاتنا",
      statusAvailableNow: "متاح",
      statusComingSoon: "قريباً",
      pos: {
        name: "Caisty POS",
        description: "برنامج نقاط بيع سحابي حديث للمطاعم والمقاهي والوجبات السريعة وتجارة التجزئة.",
        features: [
          "دفع سريع",
          "الطلبات والمنتجات",
          "طباعة الإيصالات",
          "بوابة سحابية",
          "الفواتير والتراخيص",
        ],
        ctaLearn: "فتح Caisty POS",
      },
      shiftiq: {
        name: "ShiftIQ",
        description: "إدارة القوى العاملة وتتبع وقت الموظفين للفرق الحديثة.",
        features: [
          "تتبع الوقت",
          "تخطيط الورديات",
          "تسجيل حضور الموظفين",
          "إدارة الفريق",
          "التقارير",
        ],
        ctaDisabled: "قريباً",
      },
    },
    whyChoose: {
      title: "لماذا تختار الشركات Caisty",
      points: [
        "برمجيات موثوقة",
        "بنية تعمل دون اتصال أولاً",
        "بوابة إدارة سحابية",
        "دعم متعدد اللغات",
        "دعم متعدد العملات",
        "مصمم للعمليات الواقعية",
      ],
    },
    technology: {
      title: "مجموعة التقنيات",
      stack: TECH_STACK_ICONS,
    },
    building: {
      title: "ما نبنيه",
      posTitle: "Caisty POS",
      posSub: "متاح اليوم",
      posItems: [
        "نقطة البيع / الصندوق",
        "الطلبات",
        "المخزون",
        "التراخيص",
        "الأجهزة",
        "البوابة السحابية",
      ],
      shiftiqTitle: "ShiftIQ",
      shiftiqSub: "قريباً",
      shiftiqItems: [
        "تتبع الوقت",
        "تخطيط الورديات",
        "إدارة الموظفين",
        "الحضور",
        "التقارير",
      ],
    },
    contactCta: {
      headline: "لنبني برمجيات أعمال أفضل.",
      body: "مهتم بـ Caisty POS أو منتجات Caisty مستقبلاً؟ تواصل معنا لنتحدث.",
      ctaStart: "ابدأ مجاناً",
      ctaContact: "تواصل معنا",
    },
  },
};

export type CompanyCopy = TranslationSchema<(typeof companyLocales)["en"]>;
export const company: Record<Language, CompanyCopy> = companyLocales;
