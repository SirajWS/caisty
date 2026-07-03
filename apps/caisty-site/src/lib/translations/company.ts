// Company page — en, fr, de, ar
import type { Language } from "./types";
import type { TranslationSchema } from "./types";

const companyLocales = {
  en: {
    hero: {
      badge: "Cloud-native · Built in Germany",
      headline: "Modern POS and cloud platform for restaurants and retail.",
      subtitle:
        "Caisty brings touchscreen POS, customer portal and cloud infrastructure together in one product — reliable, secure and simple to operate.",
      ctaExplore: "Explore Caisty POS",
      ctaRegister: "Start free",
    },
    trust: {
      title: "Why businesses choose Caisty",
      subtitle: "One product for the counter, back office and cloud — without enterprise complexity.",
      points: [
        {
          title: "Offline-first POS",
          body: "Keep selling when connectivity drops. Changes sync automatically when you are back online.",
        },
        {
          title: "Cloud customer portal",
          body: "Licenses, devices, invoices and installers in one hub — less admin, more time on the floor.",
        },
        {
          title: "Built for real operations",
          body: "Touch-first workflows, multi-language UI and practical reporting for busy service teams.",
        },
        {
          title: "Secure by design",
          body: "Cloud-managed configuration, device binding and subscription controls you can trust.",
        },
      ],
    },
    whatWeBuild: {
      title: "What we build",
      subtitle: "Three pillars — one integrated platform.",
      cards: [
        {
          id: "pos",
          title: "Caisty POS",
          body: "Touchscreen point of sale for restaurants, cafés and retail — orders, inventory, receipts and staff workflows.",
          cta: "View product",
        },
        {
          id: "portal",
          title: "Customer Portal",
          body: "Self-service hub for trials, licenses, devices, billing and POS installation — included with every plan.",
          cta: "Start free",
        },
        {
          id: "cloud",
          title: "Cloud Platform",
          body: "Central business profiles, fiscal configuration and device sync — Caisty Cloud keeps every location aligned.",
          cta: "Explore POS",
        },
      ],
    },
    about: {
      title: "About Caisty",
      facts: [
        { label: "Founded in", value: "Germany" },
        { label: "Developed in", value: "Germany" },
        { label: "Platform", value: "Cloud-native" },
      ],
    },
    tech: {
      title: "Technology stack",
      subtitle: "Built with proven, modern tools — from desktop POS to cloud API.",
    },
    cta: {
      headline: "Ready to see Caisty POS in action?",
      subline: "Start with a free trial — no payment details required.",
      ctaExplore: "Explore Caisty POS",
      ctaRegister: "Start free",
    },
  },
  fr: {
    hero: {
      badge: "Cloud-native · Conçu en Allemagne",
      headline: "Caisse moderne et plateforme cloud pour restaurants et commerces.",
      subtitle:
        "Caisty réunit caisse tactile, portail client et infrastructure cloud dans un seul produit — fiable, sécurisé et simple à utiliser.",
      ctaExplore: "Découvrir Caisty POS",
      ctaRegister: "Commencer gratuitement",
    },
    trust: {
      title: "Pourquoi choisir Caisty",
      subtitle: "Un produit pour le comptoir, l’administratif et le cloud — sans la complexité enterprise.",
      points: [
        {
          title: "Caisse hors ligne",
          body: "Continuez à encaisser sans connexion. Les données se synchronisent au retour du réseau.",
        },
        {
          title: "Portail client cloud",
          body: "Licences, appareils, factures et installateur dans un seul espace — moins d’admin, plus de service.",
        },
        {
          title: "Pensé pour le terrain",
          body: "Interface tactile, multilingue et rapports utiles pour les équipes en rush.",
        },
        {
          title: "Sécurité intégrée",
          body: "Configuration cloud, liaison des appareils et abonnements sous contrôle.",
        },
      ],
    },
    whatWeBuild: {
      title: "Ce que nous construisons",
      subtitle: "Trois piliers — une plateforme intégrée.",
      cards: [
        {
          id: "pos",
          title: "Caisty POS",
          body: "Caisse tactile pour restaurants, cafés et commerces — commandes, stocks, tickets et équipes.",
          cta: "Voir le produit",
        },
        {
          id: "portal",
          title: "Portail client",
          body: "Espace self-service pour essais, licences, appareils, facturation et installation POS.",
          cta: "Commencer gratuitement",
        },
        {
          id: "cloud",
          title: "Plateforme Cloud",
          body: "Profils entreprise, configuration fiscale et synchro des appareils — tout centralisé dans Caisty Cloud.",
          cta: "Découvrir le POS",
        },
      ],
    },
    about: {
      title: "À propos de Caisty",
      facts: [
        { label: "Fondé en", value: "Allemagne" },
        { label: "Développé en", value: "Allemagne" },
        { label: "Plateforme", value: "Cloud-native" },
      ],
    },
    tech: {
      title: "Stack technique",
      subtitle: "Des outils modernes et éprouvés — du POS desktop à l’API cloud.",
    },
    cta: {
      headline: "Prêt à découvrir Caisty POS ?",
      subline: "Essai gratuit — sans carte bancaire.",
      ctaExplore: "Découvrir Caisty POS",
      ctaRegister: "Commencer gratuitement",
    },
  },
  de: {
    hero: {
      badge: "Cloud-native · Entwickelt in Deutschland",
      headline: "Moderne Kasse und Cloud-Plattform für Gastronomie und Einzelhandel.",
      subtitle:
        "Caisty vereint Touch-POS, Kundenportal und Cloud-Infrastruktur in einem Produkt — zuverlässig, sicher und einfach im Alltag.",
      ctaExplore: "Caisty POS entdecken",
      ctaRegister: "Kostenlos starten",
    },
    trust: {
      title: "Warum Unternehmen Caisty wählen",
      subtitle: "Ein Produkt für Kasse, Verwaltung und Cloud — ohne Enterprise-Komplexität.",
      points: [
        {
          title: "Offline-first POS",
          body: "Weiterverkaufen bei Verbindungsproblemen. Änderungen synchronisieren automatisch nach dem Reconnect.",
        },
        {
          title: "Cloud-Kundenportal",
          body: "Lizenzen, Geräte, Rechnungen und Installer an einem Ort — weniger Admin, mehr Zeit im Betrieb.",
        },
        {
          title: "Für den Praxis-Alltag",
          body: "Touch-Workflows, Mehrsprachigkeit und sinnvolle Reports für Teams unter Zeitdruck.",
        },
        {
          title: "Sicher by Design",
          body: "Cloud-Konfiguration, Gerätebindung und Abo-Steuerung, denen Sie vertrauen können.",
        },
      ],
    },
    whatWeBuild: {
      title: "Was wir entwickeln",
      subtitle: "Drei Säulen — eine integrierte Plattform.",
      cards: [
        {
          id: "pos",
          title: "Caisty POS",
          body: "Touch-Kasse für Restaurants, Cafés und Retail — Bestellungen, Bestand, Belege und Team-Workflows.",
          cta: "Produkt ansehen",
        },
        {
          id: "portal",
          title: "Kundenportal",
          body: "Self-Service für Trials, Lizenzen, Geräte, Abrechnung und POS-Installation — in jedem Plan enthalten.",
          cta: "Kostenlos starten",
        },
        {
          id: "cloud",
          title: "Cloud Platform",
          body: "Zentrale Business-Profile, Fiskal-Konfiguration und Geräte-Sync — Caisty Cloud hält Standorte konsistent.",
          cta: "POS entdecken",
        },
      ],
    },
    about: {
      title: "Über Caisty",
      facts: [
        { label: "Gegründet in", value: "Deutschland" },
        { label: "Entwickelt in", value: "Deutschland" },
        { label: "Plattform", value: "Cloud-native" },
      ],
    },
    tech: {
      title: "Technologie-Stack",
      subtitle: "Moderne, bewährte Tools — vom Desktop-POS bis zur Cloud-API.",
    },
    cta: {
      headline: "Bereit, Caisty POS zu sehen?",
      subline: "Kostenlos testen — keine Zahlungsdaten nötig.",
      ctaExplore: "Caisty POS entdecken",
      ctaRegister: "Kostenlos starten",
    },
  },
  ar: {
    hero: {
      badge: "سحابي · مطوّر في ألمانيا",
      headline: "نقطة بيع حديثة ومنصة سحابية للمطاعم والتجزئة.",
      subtitle:
        "تجمع Caisty بين نقطة البيع اللمسية وبوابة العملاء والبنية السحابية في منتج واحد — موثوق وآمن وسهل التشغيل.",
      ctaExplore: "استكشف Caisty POS",
      ctaRegister: "ابدأ مجاناً",
    },
    trust: {
      title: "لماذا تختار الشركات Caisty",
      subtitle: "منتج واحد للكاشير والإدارة والسحابة — بدون تعقيد المؤسسات الكبيرة.",
      points: [
        {
          title: "نقطة بيع بدون اتصال",
          body: "واصل البيع عند ضعف الشبكة. تتم المزامنة تلقائياً عند عودة الاتصال.",
        },
        {
          title: "بوابة عملاء سحابية",
          body: "التراخيص والأجهزة والفواتير والمثبّت في مركز واحد — إدارة أقل ووقت أكثر للخدمة.",
        },
        {
          title: "مصمم للعمل اليومي",
          body: "واجهة لمسية متعددة اللغات وتقارير عملية للفرق المشغولة.",
        },
        {
          title: "أمان مدمج",
          body: "إعدادات سحابية وربط الأجهزة وضوابط اشتراك يمكن الاعتماد عليها.",
        },
      ],
    },
    whatWeBuild: {
      title: "ما نبنيه",
      subtitle: "ثلاث ركائز — منصة متكاملة واحدة.",
      cards: [
        {
          id: "pos",
          title: "Caisty POS",
          body: "نقطة بيع لمسية للمطاعم والمقاهي والتجزئة — الطلبات والمخزون والإيصالات وسير عمل الفريق.",
          cta: "عرض المنتج",
        },
        {
          id: "portal",
          title: "بوابة العملاء",
          body: "خدمة ذاتية للتجارب والتراخيص والأجهزة والفوترة وتثبيت POS — ضمن كل خطة.",
          cta: "ابدأ مجاناً",
        },
        {
          id: "cloud",
          title: "المنصة السحابية",
          body: "ملفات الأعمال والإعداد الضريبي ومزامنة الأجهزة — Caisty Cloud توحّد كل المواقع.",
          cta: "استكشف POS",
        },
      ],
    },
    about: {
      title: "عن Caisty",
      facts: [
        { label: "تأسست في", value: "ألمانيا" },
        { label: "مطوّرة في", value: "ألمانيا" },
        { label: "المنصة", value: "سحابية أصلية" },
      ],
    },
    tech: {
      title: "المكدس التقني",
      subtitle: "أدوات حديثة ومجرّبة — من POS سطح المكتب إلى API السحابة.",
    },
    cta: {
      headline: "هل أنت مستعد لرؤية Caisty POS؟",
      subline: "تجربة مجانية — بدون بيانات دفع.",
      ctaExplore: "استكشف Caisty POS",
      ctaRegister: "ابدأ مجاناً",
    },
  },
};

export type CompanyCopy = TranslationSchema<(typeof companyLocales)["en"]>;
export const company: Record<Language, CompanyCopy> = companyLocales;
