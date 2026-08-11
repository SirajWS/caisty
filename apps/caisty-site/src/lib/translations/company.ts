// Company page — en, fr, de, ar
import type { Language } from "./types";
import type { TranslationSchema } from "./types";

const companyLocales = {
  en: {
    hero: {
      badge: "Independent software company",
      headline: "Software products and digital solutions built for real business.",
      subtitle:
        "Caisty develops modern SaaS products, digital platforms and tailored software solutions that simplify operations, connect processes and help businesses grow.",
      ctaProducts: "Explore our products",
      ctaAbout: "About Caisty",
      platformLabel: "The Caisty product ecosystem",
    },
    trustBar: {
      items: [
        "Built in Germany",
        "Independent software company",
        "Multilingual",
        "Built for real operations",
      ],
    },
    platform: {
      title: "One company. A growing software ecosystem.",
      subtitle:
        "Caisty brings together its own SaaS products while creating digital solutions for businesses with different needs, workflows and ambitions.",
      products: [
        {
          id: "pos",
          title: "Caisty POS",
          body: "Sales, orders, payments and receipts in one fast, reliable workspace.",
          status: "Available",
        },
        {
          id: "business",
          title: "Caisty Business",
          body: "Central management, insights, devices and licences in one connected workspace.",
          status: "Available",
        },
        {
          id: "staff",
          title: "Caisty Staff",
          body: "Staff management, roles and everyday team workflows.",
          status: "Coming soon",
        },
      ],
    },
    capabilities: {
      eyebrow: "What we build",
      title: "Software that turns business needs into practical systems.",
      intro:
        "We combine product thinking, technical development and a clear understanding of everyday operations to create software that is useful from the first interaction and ready to evolve.",
      items: [
        {
          title: "SaaS products",
          body: "We build focused software products that help businesses manage essential work with less complexity and greater clarity.",
        },
        {
          title: "Digital platforms",
          body: "We create connected environments that bring workflows, information and teams together instead of spreading them across disconnected tools.",
        },
        {
          title: "Tailored software solutions",
          body: "We develop solutions around specific business requirements, from focused digital tools to scalable systems that can grow over time.",
        },
      ],
    },
    about: {
      title: "About Caisty",
      body:
        "Caisty is an independent software company based in Germany. We develop SaaS products, digital platforms and tailored software solutions for businesses across different industries.\n\nOur purpose is to turn complex processes and disconnected tools into practical, reliable software that is clear to use, multilingual and designed to grow with each business.\n\nAlongside our expanding product ecosystem, we create individual digital solutions that help companies improve workflows, connect systems and turn ideas into scalable software.",
      values: [
        {
          title: "Independent",
          body: "An independent software company with the freedom to build around real business needs.",
        },
        {
          title: "Connected",
          body: "Products and solutions designed to connect workflows, information and everyday operations.",
        },
        {
          title: "Practical",
          body: "Clear and reliable software created to solve real problems without unnecessary complexity.",
        },
      ],
    },
    cta: {
      headline: "Build what your business needs next.",
      subline:
        "Explore the Caisty product ecosystem or talk to us about a software solution designed around your goals.",
      ctaProducts: "Explore our products",
      ctaContact: "Contact Caisty",
    },
  },
  fr: {
    hero: {
      badge: "Société de logiciels indépendante",
      headline: "Produits logiciels et solutions numériques pour le réel du quotidien métier.",
      subtitle:
        "Caisty développe des produits SaaS modernes, des plateformes numériques et des solutions logicielles sur mesure qui simplifient les opérations, relient les processus et aident les entreprises à grandir.",
      ctaProducts: "Découvrir nos produits",
      ctaAbout: "À propos de Caisty",
      platformLabel: "L’écosystème produits Caisty",
    },
    trustBar: {
      items: [
        "Conçu en Allemagne",
        "Société de logiciels indépendante",
        "Multilingue",
        "Pensé pour le réel",
      ],
    },
    platform: {
      title: "Une entreprise. Un écosystème logiciel en croissance.",
      subtitle:
        "Caisty rassemble ses propres produits SaaS tout en créant des solutions numériques pour des entreprises aux besoins, workflows et ambitions différents.",
      products: [
        {
          id: "pos",
          title: "Caisty POS",
          body: "Ventes, commandes, paiements et tickets dans un espace rapide et fiable.",
          status: "Disponible",
        },
        {
          id: "business",
          title: "Caisty Business",
          body: "Gestion centrale, indicateurs, appareils et licences dans un espace connecté.",
          status: "Disponible",
        },
        {
          id: "staff",
          title: "Caisty Staff",
          body: "Gestion d’équipe, rôles et workflows du quotidien.",
          status: "Bientôt disponible",
        },
      ],
    },
    capabilities: {
      eyebrow: "Ce que nous construisons",
      title: "Des logiciels qui transforment les besoins métier en systèmes pratiques.",
      intro:
        "Nous combinons vision produit, développement technique et compréhension du quotidien pour créer des logiciels utiles dès la première interaction et prêts à évoluer.",
      items: [
        {
          title: "Produits SaaS",
          body: "Nous construisons des produits logiciels ciblés qui aident les entreprises à gérer l’essentiel avec moins de complexité et plus de clarté.",
        },
        {
          title: "Plateformes numériques",
          body: "Nous créons des environnements connectés qui rassemblent workflows, informations et équipes au lieu de les disperser dans des outils isolés.",
        },
        {
          title: "Solutions logicielles sur mesure",
          body: "Nous développons des solutions autour d’exigences métier précises, des outils numériques ciblés aux systèmes évolutifs.",
        },
      ],
    },
    about: {
      title: "À propos de Caisty",
      body:
        "Caisty est une société de logiciels indépendante basée en Allemagne. Nous développons des produits SaaS, des plateformes numériques et des solutions logicielles sur mesure pour des entreprises de différents secteurs.\n\nNotre objectif est de transformer des processus complexes et des outils dispersés en logiciels pratiques et fiables, clairs à utiliser, multilingues et conçus pour grandir avec chaque entreprise.\n\nParallèlement à notre écosystème produits en expansion, nous créons des solutions numériques individuelles qui aident les entreprises à améliorer leurs workflows, connecter leurs systèmes et transformer des idées en logiciels évolutifs.",
      values: [
        {
          title: "Indépendant",
          body: "Une société de logiciels indépendante, libre de construire autour de besoins métier réels.",
        },
        {
          title: "Connecté",
          body: "Des produits et solutions conçus pour relier workflows, informations et opérations du quotidien.",
        },
        {
          title: "Pratique",
          body: "Un logiciel clair et fiable, créé pour résoudre de vrais problèmes sans complexité inutile.",
        },
      ],
    },
    cta: {
      headline: "Construisez ce dont votre entreprise a besoin ensuite.",
      subline:
        "Explorez l’écosystème produits Caisty ou parlez-nous d’une solution logicielle conçue autour de vos objectifs.",
      ctaProducts: "Découvrir nos produits",
      ctaContact: "Contacter Caisty",
    },
  },
  de: {
    hero: {
      badge: "Unabhängiges Softwareunternehmen",
      headline: "Softwareprodukte und digitale Lösungen für echte Geschäftsanforderungen.",
      subtitle:
        "Caisty entwickelt moderne SaaS-Produkte, digitale Plattformen und individuelle Softwarelösungen, die Abläufe vereinfachen, Prozesse verbinden und Unternehmen beim Wachstum unterstützen.",
      ctaProducts: "Unsere Produkte entdecken",
      ctaAbout: "Über Caisty",
      platformLabel: "Das Caisty-Produktökosystem",
    },
    trustBar: {
      items: [
        "Entwickelt in Deutschland",
        "Unabhängiges Softwareunternehmen",
        "Mehrsprachig",
        "Für den echten Betrieb",
      ],
    },
    platform: {
      title: "Ein Unternehmen. Ein wachsendes Software-Ökosystem.",
      subtitle:
        "Caisty verbindet die eigenen SaaS-Produkte und entwickelt zugleich digitale Lösungen für Unternehmen mit unterschiedlichen Anforderungen, Abläufen und Zielen.",
      products: [
        {
          id: "pos",
          title: "Caisty POS",
          body: "Verkauf, Bestellungen, Zahlungen und Belege in einem schnellen, zuverlässigen Arbeitsbereich.",
          status: "Verfügbar",
        },
        {
          id: "business",
          title: "Caisty Business",
          body: "Zentrale Steuerung, Übersichten, Geräte und Lizenzen in einem verbundenen Arbeitsbereich.",
          status: "Verfügbar",
        },
        {
          id: "staff",
          title: "Caisty Staff",
          body: "Personalverwaltung, Rollen und tägliche Team-Abläufe.",
          status: "Demnächst",
        },
      ],
    },
    capabilities: {
      eyebrow: "Was wir entwickeln",
      title: "Software, die Geschäftsanforderungen in praktische Systeme übersetzt.",
      intro:
        "Wir verbinden Produktdenken, technische Entwicklung und ein klares Verständnis des Alltagsbetriebs — für Software, die vom ersten Moment an nützlich ist und mitwachsen kann.",
      items: [
        {
          title: "SaaS-Produkte",
          body: "Wir entwickeln fokussierte Softwareprodukte, mit denen Unternehmen wesentliche Aufgaben klarer und mit weniger Komplexität steuern.",
        },
        {
          title: "Digitale Plattformen",
          body: "Wir schaffen verbundene Umgebungen, die Abläufe, Informationen und Teams zusammenführen statt sie über isolierte Tools zu verteilen.",
        },
        {
          title: "Individuelle Softwarelösungen",
          body: "Wir entwickeln Lösungen um konkrete Geschäftsanforderungen herum — von gezielten digitalen Werkzeugen bis zu skalierbaren Systemen.",
        },
      ],
    },
    about: {
      title: "Über Caisty",
      body:
        "Caisty ist ein unabhängiges Softwareunternehmen mit Sitz in Deutschland. Wir entwickeln SaaS-Produkte, digitale Plattformen und individuelle Softwarelösungen für Unternehmen aus unterschiedlichen Branchen.\n\nUnser Ziel ist es, komplexe Prozesse und voneinander getrennte Werkzeuge in praktische, zuverlässige Software zu verwandeln, die verständlich, mehrsprachig und auf nachhaltiges Wachstum ausgelegt ist.\n\nNeben unserem wachsenden Produktökosystem entwickeln wir individuelle digitale Lösungen, mit denen Unternehmen Abläufe verbessern, Systeme verbinden und Ideen in skalierbare Software umsetzen können.",
      values: [
        {
          title: "Unabhängig",
          body: "Ein unabhängiges Softwareunternehmen mit der Freiheit, echte Geschäftsanforderungen in den Mittelpunkt zu stellen.",
        },
        {
          title: "Verbunden",
          body: "Produkte und Lösungen, die Abläufe, Informationen und den Geschäftsalltag verbinden.",
        },
        {
          title: "Praktisch",
          body: "Klare und zuverlässige Software, die reale Probleme löst — ohne unnötige Komplexität.",
        },
      ],
    },
    cta: {
      headline: "Bauen Sie, was Ihr Unternehmen als Nächstes braucht.",
      subline:
        "Entdecken Sie das Caisty-Produktökosystem oder sprechen Sie mit uns über eine Softwarelösung für Ihre Ziele.",
      ctaProducts: "Unsere Produkte entdecken",
      ctaContact: "Caisty kontaktieren",
    },
  },
  ar: {
    hero: {
      badge: "شركة برمجيات مستقلة",
      headline: "منتجات برمجية وحلول رقمية مبنية لاحتياجات الأعمال الحقيقية.",
      subtitle:
        "تطوّر Caisty منتجات SaaS حديثة ومنصات رقمية وحلولاً برمجية مخصصة تبسّط العمليات وتربط العمليات وتساعد الشركات على النمو.",
      ctaProducts: "استكشف منتجاتنا",
      ctaAbout: "عن Caisty",
      platformLabel: "منظومة منتجات Caisty",
    },
    trustBar: {
      items: ["مطوّر في ألمانيا", "شركة برمجيات مستقلة", "متعدد اللغات", "مصمم للعمليات الحقيقية"],
    },
    platform: {
      title: "شركة واحدة. منظومة برمجيات متنامية.",
      subtitle:
        "تجمع Caisty بين منتجاتها SaaS الخاصة وتطوّر في الوقت نفسه حلولاً رقمية للشركات ذات الاحتياجات وسير العمل والطموحات المختلفة.",
      products: [
        {
          id: "pos",
          title: "Caisty POS",
          body: "المبيعات والطلبات والمدفوعات والإيصالات في مساحة عمل سريعة وموثوقة.",
          status: "متاح",
        },
        {
          id: "business",
          title: "Caisty Business",
          body: "إدارة مركزية ورؤى وأجهزة وتراخيص في مساحة عمل متصلة.",
          status: "متاح",
        },
        {
          id: "staff",
          title: "Caisty Staff",
          body: "إدارة الموظفين والأدوار وسير عمل الفريق اليومي.",
          status: "قريباً",
        },
      ],
    },
    capabilities: {
      eyebrow: "ما نبنيه",
      title: "برمجيات تحول احتياجات الأعمال إلى أنظمة عملية.",
      intro:
        "نجمع بين التفكير المنتج والتطوير التقني وفهماً واضحاً للعمليات اليومية لإنشاء برمجيات مفيدة من أول تفاعل وجاهزة للتطور.",
      items: [
        {
          title: "منتجات SaaS",
          body: "نبني منتجات برمجية مركّزة تساعد الشركات على إدارة العمل الأساسي بتعقيد أقل ووضوح أكبر.",
        },
        {
          title: "منصات رقمية",
          body: "ننشئ بيئات متصلة تجمع سير العمل والمعلومات والفرق بدلاً من تشتيتها عبر أدوات منفصلة.",
        },
        {
          title: "حلول برمجية مخصصة",
          body: "نطوّر حلولاً حول متطلبات أعمال محددة، من أدوات رقمية مركّزة إلى أنظمة قابلة للتوسع مع الوقت.",
        },
      ],
    },
    about: {
      title: "عن Caisty",
      body:
        "Caisty شركة برمجيات مستقلة مقرها ألمانيا. نطوّر منتجات SaaS ومنصات رقمية وحلولاً برمجية مخصصة للشركات عبر قطاعات مختلفة.\n\nهدفنا تحويل العمليات المعقدة والأدوات المتفرقة إلى برمجيات عملية وموثوقة وواضحة الاستخدام ومتعددة اللغات ومصممة للنمو مع كل شركة.\n\nإلى جانب منظومة منتجاتنا المتنامية، ننشئ حلولاً رقمية فردية تساعد الشركات على تحسين سير العمل وربط الأنظمة وتحويل الأفكار إلى برمجيات قابلة للتوسع.",
      values: [
        {
          title: "مستقل",
          body: "شركة برمجيات مستقلة تتمتع بحرية البناء حول احتياجات الأعمال الحقيقية.",
        },
        {
          title: "متصل",
          body: "منتجات وحلول مصممة لربط سير العمل والمعلومات والعمليات اليومية.",
        },
        {
          title: "عملي",
          body: "برمجيات واضحة وموثوقة لحل مشكلات حقيقية دون تعقيد غير ضروري.",
        },
      ],
    },
    cta: {
      headline: "ابنِ ما تحتاجه شركتك بعد ذلك.",
      subline:
        "استكشف منظومة منتجات Caisty أو تحدث معنا عن حل برمجي مصمم حول أهدافك.",
      ctaProducts: "استكشف منتجاتنا",
      ctaContact: "تواصل مع Caisty",
    },
  },
};

export type CompanyCopy = TranslationSchema<(typeof companyLocales)["en"]>;
export const company: Record<Language, CompanyCopy> = companyLocales;
