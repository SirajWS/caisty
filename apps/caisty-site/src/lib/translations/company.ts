// Company page (Caisty) — en, fr, de, ar
import type { Language } from "./types";
import type { TranslationSchema } from "./types";

const companyLocales = {
  en: {
    hero: {
      badge: "Caisty",
      headline: "Building software that helps businesses grow.",
      subtitle:
        "Caisty develops modern cloud-based business software designed to simplify daily operations for restaurants, cafés, retail businesses and growing companies.",
    },
    whoWeAre: {
      title: "Who we are",
      paragraphs: [
        "Caisty is a software company focused on developing reliable, secure and scalable cloud solutions for modern businesses.",
        "Our products are designed to reduce complexity, improve productivity and provide businesses with professional tools that are easy to use.",
      ],
    },
    mission: {
      title: "Mission",
      body: "Our mission is to build simple, reliable and affordable business software that helps companies focus on their customers instead of their technology.",
    },
    vision: {
      title: "Vision",
      body: "We believe business software should be modern, accessible and continuously improving.",
    },
    whatWeBuild: {
      title: "What we build",
      items: [
        "Cloud POS Software",
        "Customer Portal",
        "Cloud Infrastructure",
        "Business Management Tools",
        "Future Workforce Solutions",
      ],
    },
    principles: {
      title: "Our principles",
      items: ["Simplicity", "Reliability", "Security", "Transparency", "Continuous Improvement"],
    },
    cta: {
      headline: "Ready to discover Caisty?",
      ctaExplore: "Explore Caisty POS",
    },
  },
  fr: {
    hero: {
      badge: "Caisty",
      headline: "Des logiciels qui aident les entreprises à grandir.",
      subtitle:
        "Caisty développe des logiciels métier cloud modernes pour simplifier le quotidien des restaurants, cafés, commerces et entreprises en croissance.",
    },
    whoWeAre: {
      title: "Qui sommes-nous",
      paragraphs: [
        "Caisty est une société logicielle spécialisée dans des solutions cloud fiables, sécurisées et évolutives pour les entreprises modernes.",
        "Nos produits visent à réduire la complexité, améliorer la productivité et offrir des outils professionnels simples à utiliser.",
      ],
    },
    mission: {
      title: "Mission",
      body: "Notre mission est de créer des logiciels métier simples, fiables et abordables pour que les entreprises se concentrent sur leurs clients plutôt que sur la technologie.",
    },
    vision: {
      title: "Vision",
      body: "Nous croyons que les logiciels métier doivent être modernes, accessibles et en amélioration continue.",
    },
    whatWeBuild: {
      title: "Ce que nous construisons",
      items: [
        "Logiciel de caisse cloud",
        "Portail client",
        "Infrastructure cloud",
        "Outils de gestion d’entreprise",
        "Solutions workforce à venir",
      ],
    },
    principles: {
      title: "Nos principes",
      items: ["Simplicité", "Fiabilité", "Sécurité", "Transparence", "Amélioration continue"],
    },
    cta: {
      headline: "Prêt à découvrir Caisty ?",
      ctaExplore: "Découvrir Caisty POS",
    },
  },
  de: {
    hero: {
      badge: "Caisty",
      headline: "Software, die Unternehmen beim Wachsen hilft.",
      subtitle:
        "Caisty entwickelt moderne cloudbasierte Business-Software, die den Alltag für Restaurants, Cafés, Einzelhandel und wachsende Unternehmen vereinfacht.",
    },
    whoWeAre: {
      title: "Wer wir sind",
      paragraphs: [
        "Caisty ist ein Softwareunternehmen mit Fokus auf zuverlässige, sichere und skalierbare Cloud-Lösungen für moderne Betriebe.",
        "Unsere Produkte reduzieren Komplexität, steigern die Produktivität und bieten professionelle Werkzeuge, die einfach zu bedienen sind.",
      ],
    },
    mission: {
      title: "Mission",
      body: "Unsere Mission ist es, einfache, zuverlässige und erschwingliche Business-Software zu entwickeln, damit sich Unternehmen auf ihre Kunden statt auf Technologie konzentrieren können.",
    },
    vision: {
      title: "Vision",
      body: "Wir sind überzeugt, dass Business-Software modern, zugänglich und kontinuierlich besser werden sollte.",
    },
    whatWeBuild: {
      title: "Was wir entwickeln",
      items: [
        "Cloud-POS-Software",
        "Kundenportal",
        "Cloud-Infrastruktur",
        "Business-Management-Tools",
        "Zukünftige Workforce-Lösungen",
      ],
    },
    principles: {
      title: "Unsere Prinzipien",
      items: ["Einfachheit", "Zuverlässigkeit", "Sicherheit", "Transparenz", "Kontinuierliche Verbesserung"],
    },
    cta: {
      headline: "Bereit, Caisty kennenzulernen?",
      ctaExplore: "Caisty POS entdecken",
    },
  },
  ar: {
    hero: {
      badge: "Caisty",
      headline: "نبني برمجيات تساعد الشركات على النمو.",
      subtitle:
        "تطوّر Caisty برمجيات أعمال سحابية حديثة لتبسيط العمليات اليومية للمطاعم والمقاهي والتجزئة والشركات النامية.",
    },
    whoWeAre: {
      title: "من نحن",
      paragraphs: [
        "Caisty شركة برمجيات تركز على تطوير حلول سحابية موثوقة وآمنة وقابلة للتوسع للشركات الحديثة.",
        "منتجاتنا مصممة لتقليل التعقيد وتحسين الإنتاجية وتوفير أدوات احترافية سهلة الاستخدام.",
      ],
    },
    mission: {
      title: "مهمتنا",
      body: "مهمتنا بناء برمجيات أعمال بسيطة وموثوقة وبأسعار معقولة تساعد الشركات على التركيز على عملائها بدلاً من التكنولوجيا.",
    },
    vision: {
      title: "رؤيتنا",
      body: "نؤمن أن برمجيات الأعمال يجب أن تكون حديثة وسهلة الوصول وفي تحسّن مستمر.",
    },
    whatWeBuild: {
      title: "ما نبنيه",
      items: [
        "برمجيات نقاط بيع سحابية",
        "بوابة العملاء",
        "بنية تحتية سحابية",
        "أدوات إدارة الأعمال",
        "حلول قوى عاملة مستقبلية",
      ],
    },
    principles: {
      title: "مبادئنا",
      items: ["البساطة", "الموثوقية", "الأمان", "الشفافية", "التحسين المستمر"],
    },
    cta: {
      headline: "هل أنت مستعد لاكتشاف Caisty؟",
      ctaExplore: "استكشف Caisty POS",
    },
  },
};

export type CompanyCopy = TranslationSchema<(typeof companyLocales)["en"]>;
export const company: Record<Language, CompanyCopy> = companyLocales;
