// Company page — en, fr, de, ar
import type { Language } from "./types";
import type { TranslationSchema } from "./types";

const companyLocales = {
  en: {
    hero: {
      badge: "Connected business software · Built in Germany",
      headline: "Connected software for modern businesses.",
      subtitle:
        "Caisty builds practical software that connects sales, business management and everyday operations in one growing platform.",
      ctaProducts: "Explore our products",
      ctaAbout: "About Caisty",
      platformLabel: "The Caisty platform",
    },
    trustBar: {
      items: [
        "Built in Germany",
        "Connected by design",
        "Multilingual",
        "Built for daily operations",
      ],
    },
    platform: {
      title: "One platform. Three connected products.",
      subtitle:
        "Caisty brings the tools of daily business together — so sales, management and team workflows share one practical foundation.",
      products: [
        {
          id: "pos",
          title: "Caisty POS",
          body: "Sales, orders, payments and receipts in a fast checkout workspace.",
          status: "Available",
        },
        {
          id: "business",
          title: "Caisty Business",
          body: "Central management, insights, devices and licences in one workspace.",
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
    storyPos: {
      title: "From sale to business overview",
      body: "Caisty POS handles the moment of sale. Orders and receipts stay connected to the same business environment — ready for central review.",
      imageAlt: "Caisty POS workspace showing sales, products and checkout tools",
      cta: "Explore Caisty POS",
    },
    storyDashboard: {
      title: "Your business in one place",
      body: "Caisty Business brings activity, devices and licences into one clear workspace — so teams can manage operations without switching between disconnected tools.",
      imageAlt: "Caisty Business dashboard with business overview",
    },
    storyReports: {
      title: "Understand performance",
      body: "See how sales develop over time with clear reports. Use the overview to support everyday decisions — without turning the company page into a feature catalogue.",
      imageAlt: "Reports and revenue trends in Caisty Business",
    },
    storyMobile: {
      title: "Manage from anywhere",
      body: "Keep an eye on key business activity from desktop or mobile. The same connected account stays available when you are away from the counter.",
      imageAlt: "Mobile order overview in Caisty Business",
    },
    about: {
      title: "About Caisty",
      body:
        "Caisty is an independent software company based in Germany. We build connected SaaS products that simplify sales, business management and everyday operations.\n\nOur goal is to replace disconnected tools with practical software that is clear to use, multilingual and able to grow with each business — step by step.",
      values: [
        {
          title: "Independent",
          body: "An independent software company focused on practical products.",
        },
        {
          title: "Connected",
          body: "Products designed to work together across daily operations.",
        },
        {
          title: "Practical",
          body: "Clear software that teams can use without unnecessary complexity.",
        },
      ],
    },
    cta: {
      headline: "Build your business on one connected platform.",
      subline: "Start with the tools you need today and grow with the Caisty platform.",
      ctaProducts: "Explore our products",
      ctaPos: "Explore Caisty POS",
    },
  },
  fr: {
    hero: {
      badge: "Logiciel métier connecté · Conçu en Allemagne",
      headline: "Des logiciels connectés pour les entreprises modernes.",
      subtitle:
        "Caisty développe des logiciels pratiques qui relient ventes, gestion d’entreprise et opérations du quotidien dans une plateforme en croissance.",
      ctaProducts: "Découvrir nos produits",
      ctaAbout: "À propos de Caisty",
      platformLabel: "La plateforme Caisty",
    },
    trustBar: {
      items: [
        "Conçu en Allemagne",
        "Connecté par conception",
        "Multilingue",
        "Pensé pour le quotidien",
      ],
    },
    platform: {
      title: "Une plateforme. Trois produits connectés.",
      subtitle:
        "Caisty rassemble les outils du quotidien — pour que ventes, gestion et workflows d’équipe partagent une base pratique.",
      products: [
        {
          id: "pos",
          title: "Caisty POS",
          body: "Ventes, commandes, paiements et tickets dans un espace d’encaissement rapide.",
          status: "Disponible",
        },
        {
          id: "business",
          title: "Caisty Business",
          body: "Gestion centrale, indicateurs, appareils et licences dans un seul espace.",
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
    storyPos: {
      title: "De la vente à la vue d’ensemble",
      body: "Caisty POS gère le moment de la vente. Commandes et tickets restent liés au même environnement métier — prêts pour une revue centrale.",
      imageAlt: "Espace de travail Caisty POS avec ventes, produits et encaissement",
      cta: "Découvrir Caisty POS",
    },
    storyDashboard: {
      title: "Votre activité au même endroit",
      body: "Caisty Business rassemble activité, appareils et licences dans un espace clair — pour piloter le quotidien sans outils dispersés.",
      imageAlt: "Tableau de bord Caisty Business avec aperçu de l’activité",
    },
    storyReports: {
      title: "Comprendre la performance",
      body: "Suivez l’évolution des ventes avec des rapports clairs. Une vue utile pour les décisions du quotidien — sans transformer cette page en catalogue de fonctions.",
      imageAlt: "Rapports et évolution du chiffre d’affaires dans Caisty Business",
    },
    storyMobile: {
      title: "Gérer où que vous soyez",
      body: "Gardez l’essentiel de l’activité sous les yeux sur desktop ou mobile. Le même compte connecté reste disponible loin du comptoir.",
      imageAlt: "Aperçu mobile des commandes dans Caisty Business",
    },
    about: {
      title: "À propos de Caisty",
      body:
        "Caisty est une société de logiciels indépendante basée en Allemagne. Nous développons des produits SaaS connectés qui simplifient les ventes, la gestion d’entreprise et les opérations du quotidien.\n\nNotre objectif est de remplacer des outils dispersés par un logiciel pratique, clair, multilingue et capable de grandir avec chaque entreprise — étape par étape.",
      values: [
        {
          title: "Indépendant",
          body: "Une société indépendante centrée sur des produits utiles.",
        },
        {
          title: "Connecté",
          body: "Des produits conçus pour travailler ensemble au quotidien.",
        },
        {
          title: "Pratique",
          body: "Un logiciel clair que les équipes peuvent utiliser sans complexité inutile.",
        },
      ],
    },
    cta: {
      headline: "Construisez votre activité sur une plateforme connectée.",
      subline: "Commencez avec les outils dont vous avez besoin aujourd’hui et grandissez avec Caisty.",
      ctaProducts: "Découvrir nos produits",
      ctaPos: "Découvrir Caisty POS",
    },
  },
  de: {
    hero: {
      badge: "Verbundene Business-Software · Entwickelt in Deutschland",
      headline: "Verbundene Software für moderne Unternehmen.",
      subtitle:
        "Caisty entwickelt praktische Software, die Verkauf, Unternehmenssteuerung und den täglichen Betrieb in einer wachsenden Plattform verbindet.",
      ctaProducts: "Unsere Produkte entdecken",
      ctaAbout: "Über Caisty",
      platformLabel: "Die Caisty-Plattform",
    },
    trustBar: {
      items: [
        "Entwickelt in Deutschland",
        "Von Grund auf verbunden",
        "Mehrsprachig",
        "Für den Geschäftsalltag",
      ],
    },
    platform: {
      title: "Eine Plattform. Drei verbundene Produkte.",
      subtitle:
        "Caisty bringt die Werkzeuge des Geschäftsalltags zusammen — damit Verkauf, Steuerung und Team-Abläufe eine praktische Grundlage teilen.",
      products: [
        {
          id: "pos",
          title: "Caisty POS",
          body: "Verkauf, Bestellungen, Zahlungen und Belege in einem schnellen Kassen-Arbeitsbereich.",
          status: "Verfügbar",
        },
        {
          id: "business",
          title: "Caisty Business",
          body: "Zentrale Steuerung, Übersichten, Geräte und Lizenzen in einem Arbeitsbereich.",
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
    storyPos: {
      title: "Vom Verkauf zur Geschäftsübersicht",
      body: "Caisty POS begleitet den Moment des Verkaufs. Bestellungen und Belege bleiben mit derselben Geschäftsumgebung verbunden — bereit für die zentrale Übersicht.",
      imageAlt: "Caisty-POS-Arbeitsbereich mit Verkauf, Produkten und Kasse",
      cta: "Caisty POS entdecken",
    },
    storyDashboard: {
      title: "Ihr Geschäft an einem Ort",
      body: "Caisty Business führt Aktivität, Geräte und Lizenzen in einem klaren Arbeitsbereich zusammen — damit Teams ohne isolierte Tools steuern können.",
      imageAlt: "Caisty Business Dashboard mit Geschäftsübersicht",
    },
    storyReports: {
      title: "Leistung verstehen",
      body: "Sehen Sie, wie sich der Verkauf entwickelt — mit klaren Berichten für alltägliche Entscheidungen, ohne diese Seite zu einem Feature-Katalog zu machen.",
      imageAlt: "Berichte und Umsatzentwicklung in Caisty Business",
    },
    storyMobile: {
      title: "Von überall steuern",
      body: "Behalten Sie wichtige Geschäftstätigkeit auf Desktop oder Mobilgerät im Blick. Dasselbe verbundene Konto bleibt auch abseits der Kasse verfügbar.",
      imageAlt: "Mobile Bestellübersicht in Caisty Business",
    },
    about: {
      title: "Über Caisty",
      body:
        "Caisty ist ein unabhängiges Softwareunternehmen mit Sitz in Deutschland. Wir entwickeln verbundene SaaS-Produkte, die Verkauf, Unternehmenssteuerung und den täglichen Betrieb vereinfachen.\n\nUnser Ziel ist es, isolierte Tools durch praktische Software zu ersetzen, die klar zu bedienen, mehrsprachig und schrittweise mit jedem Unternehmen mitwachsen kann.",
      values: [
        {
          title: "Unabhängig",
          body: "Ein unabhängiges Softwareunternehmen mit Fokus auf praktische Produkte.",
        },
        {
          title: "Verbunden",
          body: "Produkte, die im Alltag zusammenarbeiten sollen.",
        },
        {
          title: "Praktisch",
          body: "Klare Software, die Teams ohne unnötige Komplexität nutzen können.",
        },
      ],
    },
    cta: {
      headline: "Bauen Sie Ihr Geschäft auf einer verbundenen Plattform auf.",
      subline: "Starten Sie mit den Tools, die Sie heute brauchen, und wachsen Sie mit der Caisty-Plattform.",
      ctaProducts: "Unsere Produkte entdecken",
      ctaPos: "Caisty POS entdecken",
    },
  },
  ar: {
    hero: {
      badge: "برمجيات أعمال متصلة · مطوّر في ألمانيا",
      headline: "برمجيات متصلة للشركات الحديثة.",
      subtitle:
        "تبني Caisty برمجيات عملية تربط المبيعات وإدارة الأعمال والعمليات اليومية في منصة متنامية واحدة.",
      ctaProducts: "استكشف منتجاتنا",
      ctaAbout: "عن Caisty",
      platformLabel: "منصة Caisty",
    },
    trustBar: {
      items: [
        "مطوّر في ألمانيا",
        "متصل بالتصميم",
        "متعدد اللغات",
        "مصمم للعمليات اليومية",
      ],
    },
    platform: {
      title: "منصة واحدة. ثلاثة منتجات متصلة.",
      subtitle:
        "تجمع Caisty أدوات العمل اليومي — حتى تشترك المبيعات والإدارة وسير عمل الفريق في أساس عملي واحد.",
      products: [
        {
          id: "pos",
          title: "Caisty POS",
          body: "المبيعات والطلبات والمدفوعات والإيصالات في مساحة دفع سريعة.",
          status: "متاح",
        },
        {
          id: "business",
          title: "Caisty Business",
          body: "إدارة مركزية ورؤى وأجهزة وتراخيص في مساحة عمل واحدة.",
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
    storyPos: {
      title: "من البيع إلى نظرة عامة على الأعمال",
      body: "يتولى Caisty POS لحظة البيع. تبقى الطلبات والإيصالات متصلة بنفس بيئة الأعمال — جاهزة للمراجعة المركزية.",
      imageAlt: "مساحة عمل Caisty POS تعرض المبيعات والمنتجات وأدوات الدفع",
      cta: "استكشف Caisty POS",
    },
    storyDashboard: {
      title: "عملك في مكان واحد",
      body: "يجمع Caisty Business النشاط والأجهزة والتراخيص في مساحة واضحة — حتى تدير الفرق العمليات دون أدوات منفصلة.",
      imageAlt: "لوحة تحكم Caisty Business مع نظرة عامة على الأعمال",
    },
    storyReports: {
      title: "فهم الأداء",
      body: "اطّلع على تطور المبيعات بتقارير واضحة لدعم القرارات اليومية — دون تحويل صفحة الشركة إلى كتالوج ميزات.",
      imageAlt: "التقارير واتجاهات الإيرادات في Caisty Business",
    },
    storyMobile: {
      title: "الإدارة من أي مكان",
      body: "تابع نشاط الأعمال الأساسي من سطح المكتب أو الجوال. يبقى الحساب المتصل متاحاً بعيداً عن نقطة البيع.",
      imageAlt: "نظرة عامة على الطلبات عبر الجوال في Caisty Business",
    },
    about: {
      title: "عن Caisty",
      body:
        "Caisty شركة برمجيات مستقلة مقرها ألمانيا. نبني منتجات SaaS متصلة تبسّط المبيعات وإدارة الأعمال والعمليات اليومية.\n\nهدفنا استبدال الأدوات المنفصلة ببرمجيات عملية واضحة ومتعددة اللغات وقادرة على النمو مع كل عمل — خطوة بخطوة.",
      values: [
        {
          title: "مستقلة",
          body: "شركة برمجيات مستقلة تركز على منتجات عملية.",
        },
        {
          title: "متصلة",
          body: "منتجات مصممة للعمل معاً عبر العمليات اليومية.",
        },
        {
          title: "عملية",
          body: "برمجيات واضحة يمكن للفرق استخدامها دون تعقيد غير ضروري.",
        },
      ],
    },
    cta: {
      headline: "ابنِ عملك على منصة متصلة واحدة.",
      subline: "ابدأ بالأدوات التي تحتاجها اليوم وانمُ مع منصة Caisty.",
      ctaProducts: "استكشف منتجاتنا",
      ctaPos: "استكشف Caisty POS",
    },
  },
};

export type CompanyCopy = TranslationSchema<(typeof companyLocales)["en"]>;
export const company: Record<Language, CompanyCopy> = companyLocales;
