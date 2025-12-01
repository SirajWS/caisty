// apps/caisty-site/src/lib/translations.ts

export type Language = "de" | "en" | "fr" | "ar";

export const languages: { code: Language; name: string; nativeName: string }[] = [
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "en", name: "English", nativeName: "English" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
];

export const translations = {
  de: {
    hero: {
      badge: "POS & Cloud-Konto für moderne Gastro & Shops",
      title: "Eine Kasse, ein Portal –",
      titleHighlight: "alles im Blick.",
      description:
        "Caisty verbindet schnelles Kassieren am POS mit einem klaren Cloud-Portal: Lizenzen verwalten, Geräte im Blick behalten und Rechnungen zentral abrufen.",
      ctaPricing: "Preise ansehen",
      ctaStart: "Kostenlos starten",
      trialNote: "Starte mit einer",
      trialDays: "Tage-Testlizenz",
      trialNote2: "ohne Zahlungsdaten. Danach kannst du jederzeit auf Starter oder Pro wechseln. Die Installation von Caisty POS erfolgt später direkt aus dem Kundenportal.",
    },
    why: {
      title: "Warum Caisty?",
      description:
        "Caisty ist für Betreiber, die keine Lust auf komplizierte Backoffice-Systeme haben, sondern schnell starten wollen – mit klarer Struktur für Lizenzen, Geräte und Abrechnung.",
      feature1Title: "Schnell startklar",
      feature1Text: "Installer laden, Lizenz verbinden, loskassieren – ohne wochenlange Einrichtung.",
      feature2Title: "Volle Übersicht",
      feature2Text: "Im Portal siehst du jederzeit, welche Lizenzen aktiv sind und welche Geräte verbunden sind.",
      feature3Title: "Fair & transparent",
      feature3Text: "Klare Pläne ohne versteckte Gebühren. Ideal, um klein zu starten und später zu wachsen.",
    },
    plans: {
      title: "Pläne & Lizenzen",
      description:
        "Teste Caisty zuerst kostenlos und entscheide dann, ob du mit Starter oder Pro weitermachst. Du kannst monatlich zahlen oder mit einem Jahresplan sparen.",
      trial: {
        name: "Trial",
        badge: "Kostenlos testen",
        note: "Tage, 1 Gerät",
        detail1: "Voller Funktionsumfang wie Starter",
        detail2: "Keine Zahlungsdaten nötig",
        detail3: "Ideal zum Ausprobieren im Live-Betrieb",
      },
      starter: {
        name: "Starter",
        badge: "Für eine Kasse",
        price: "€ / Monat",
        subPrice: "oder € / Jahr",
        note: "Gerät inklusive",
        detail1: "Perfekt für einen Standort",
        detail2: "Basis-Reporting & Portalzugang",
        detail3: "Upgrade auf Pro jederzeit möglich",
      },
      pro: {
        name: "Pro",
        badge: "Mehrere Geräte",
        price: "€ / Monat",
        subPrice: "oder € / Jahr",
        note: "Geräte inklusive",
        detail1: "Ideal für 2–3 Kassen oder Filialen",
        detail2: "Alle Starter-Funktionen",
        detail3: "Mehrere Geräte unter einer Lizenz",
      },
      note: "Alle Preise zzgl. MwSt. – die genaue Abrechnung (monatlich oder jährlich) wählst du später direkt im Kundenportal. Dort kannst du auch jederzeit zwischen Starter und Pro wechseln.",
    },
    forWhom: {
      title: "Für wen ist Caisty?",
      target1Title: "Take-Away & Street-Food",
      target1Text: "Schnelle Bestellungen, wenige Knöpfe, fokussiert auf Tempo.",
      target2Title: "Bars & Cafés",
      target2Text: "Einfache Artikelstrukturen, flexible Preisupdates und Tagesabrechnungen.",
      target3Title: "Kleine Shops",
      target3Text: "Kasse, Belege und Basis-Reporting in einem System – ohne Overkill.",
    },
    install: {
      title: "In wenigen Minuten vom Download zur einsatzbereiten Kasse.",
      description:
        "Die eigentliche Installation von Caisty POS läuft komplett über dein Kundenportal. Dort bekommst du den Installer, deinen Lizenzschlüssel und eine Schritt-für-Schritt-Anleitung.",
      step1: "Portalzugang anlegen und Lizenz erhalten.",
      step2: "Installer für dein Betriebssystem aus dem Portal herunterladen.",
      step3: "Auf dem Kassen-PC installieren und Lizenzschlüssel eingeben – fertig.",
      note: "Die detaillierte Installationsseite siehst du nach dem Login unter",
      noteHighlight: '"Caisty POS installieren"',
      noteEnd: "im Kundenportal.",
    },
  },
  en: {
    hero: {
      badge: "POS & Cloud Account for Modern Restaurants & Shops",
      title: "One POS, one portal –",
      titleHighlight: "everything in view.",
      description:
        "Caisty connects fast checkout at the POS with a clear cloud portal: manage licenses, keep an eye on devices, and access invoices centrally.",
      ctaPricing: "View pricing",
      ctaStart: "Start free",
      trialNote: "Start with a",
      trialDays: "day trial license",
      trialNote2: "without payment details. You can switch to Starter or Pro at any time. Caisty POS installation happens later directly from the customer portal.",
    },
    why: {
      title: "Why Caisty?",
      description:
        "Caisty is for operators who don't want complicated back-office systems but want to get started quickly – with a clear structure for licenses, devices, and billing.",
      feature1Title: "Quick to start",
      feature1Text: "Download installer, connect license, start selling – without weeks of setup.",
      feature2Title: "Full overview",
      feature2Text: "In the portal, you can always see which licenses are active and which devices are connected.",
      feature3Title: "Fair & transparent",
      feature3Text: "Clear plans without hidden fees. Ideal for starting small and growing later.",
    },
    plans: {
      title: "Plans & Licenses",
      description:
        "Try Caisty for free first, then decide whether to continue with Starter or Pro. You can pay monthly or save with an annual plan.",
      trial: {
        name: "Trial",
        badge: "Try for free",
        note: "days, 1 device",
        detail1: "Full feature set like Starter",
        detail2: "No payment details required",
        detail3: "Ideal for testing in live operation",
      },
      starter: {
        name: "Starter",
        badge: "For one POS",
        price: "€ / month",
        subPrice: "or € / year",
        note: "device included",
        detail1: "Perfect for one location",
        detail2: "Basic reporting & portal access",
        detail3: "Upgrade to Pro anytime",
      },
      pro: {
        name: "Pro",
        badge: "Multiple devices",
        price: "€ / month",
        subPrice: "or € / year",
        note: "devices included",
        detail1: "Ideal for 2–3 POS or branches",
        detail2: "All Starter features",
        detail3: "Multiple devices under one license",
      },
      note: "All prices plus VAT – you choose the exact billing (monthly or annual) later directly in the customer portal. You can also switch between Starter and Pro at any time.",
    },
    forWhom: {
      title: "Who is Caisty for?",
      target1Title: "Take-Away & Street Food",
      target1Text: "Fast orders, few buttons, focused on speed.",
      target2Title: "Bars & Cafés",
      target2Text: "Simple item structures, flexible price updates, and daily reports.",
      target3Title: "Small Shops",
      target3Text: "POS, receipts, and basic reporting in one system – without overkill.",
    },
    install: {
      title: "From download to ready-to-use POS in just a few minutes.",
      description:
        "The actual installation of Caisty POS runs entirely through your customer portal. There you get the installer, your license key, and a step-by-step guide.",
      step1: "Create portal access and receive license.",
      step2: "Download installer for your operating system from the portal.",
      step3: "Install on the POS PC and enter license key – done.",
      note: "You can see the detailed installation page after login under",
      noteHighlight: '"Install Caisty POS"',
      noteEnd: "in the customer portal.",
    },
  },
  fr: {
    hero: {
      badge: "Compte POS & Cloud pour Restaurants & Boutiques Modernes",
      title: "Une caisse, un portail –",
      titleHighlight: "tout en vue.",
      description:
        "Caisty connecte la caisse rapide au POS avec un portail cloud clair : gérez les licences, gardez un œil sur les appareils et accédez aux factures de manière centralisée.",
      ctaPricing: "Voir les prix",
      ctaStart: "Commencer gratuitement",
      trialNote: "Commencez avec une",
      trialDays: "licence d'essai de jours",
      trialNote2: "sans données de paiement. Vous pouvez passer à Starter ou Pro à tout moment. L'installation de Caisty POS se fait plus tard directement depuis le portail client.",
    },
    why: {
      title: "Pourquoi Caisty?",
      description:
        "Caisty est pour les opérateurs qui ne veulent pas de systèmes de back-office compliqués mais qui veulent démarrer rapidement – avec une structure claire pour les licences, les appareils et la facturation.",
      feature1Title: "Démarrage rapide",
      feature1Text: "Téléchargez l'installateur, connectez la licence, commencez à vendre – sans semaines de configuration.",
      feature2Title: "Vue d'ensemble complète",
      feature2Text: "Dans le portail, vous pouvez toujours voir quelles licences sont actives et quels appareils sont connectés.",
      feature3Title: "Équitable et transparent",
      feature3Text: "Plans clairs sans frais cachés. Idéal pour commencer petit et grandir plus tard.",
    },
    plans: {
      title: "Plans & Licences",
      description:
        "Essayez Caisty gratuitement d'abord, puis décidez si vous voulez continuer avec Starter ou Pro. Vous pouvez payer mensuellement ou économiser avec un plan annuel.",
      trial: {
        name: "Essai",
        badge: "Essayer gratuitement",
        note: "jours, 1 appareil",
        detail1: "Ensemble de fonctionnalités complet comme Starter",
        detail2: "Aucune donnée de paiement requise",
        detail3: "Idéal pour tester en exploitation",
      },
      starter: {
        name: "Starter",
        badge: "Pour une caisse",
        price: "€ / mois",
        subPrice: "ou € / an",
        note: "appareil inclus",
        detail1: "Parfait pour un emplacement",
        detail2: "Rapports de base et accès au portail",
        detail3: "Passer à Pro à tout moment",
      },
      pro: {
        name: "Pro",
        badge: "Plusieurs appareils",
        price: "€ / mois",
        subPrice: "ou € / an",
        note: "appareils inclus",
        detail1: "Idéal pour 2–3 caisses ou succursales",
        detail2: "Toutes les fonctionnalités Starter",
        detail3: "Plusieurs appareils sous une licence",
      },
      note: "Tous les prix TVA comprise – vous choisissez la facturation exacte (mensuelle ou annuelle) plus tard directement dans le portail client. Vous pouvez également passer entre Starter et Pro à tout moment.",
    },
    forWhom: {
      title: "Pour qui est Caisty?",
      target1Title: "Take-Away & Street Food",
      target1Text: "Commandes rapides, quelques boutons, axé sur la vitesse.",
      target2Title: "Bars & Cafés",
      target2Text: "Structures d'articles simples, mises à jour de prix flexibles et rapports quotidiens.",
      target3Title: "Petites Boutiques",
      target3Text: "POS, reçus et rapports de base dans un système – sans excès.",
    },
    install: {
      title: "Du téléchargement à la caisse prête à l'emploi en quelques minutes.",
      description:
        "L'installation réelle de Caisty POS se fait entièrement via votre portail client. Là, vous obtenez l'installateur, votre clé de licence et un guide étape par étape.",
      step1: "Créer l'accès au portail et recevoir la licence.",
      step2: "Télécharger l'installateur pour votre système d'exploitation depuis le portail.",
      step3: "Installer sur le PC de caisse et entrer la clé de licence – terminé.",
      note: "Vous pouvez voir la page d'installation détaillée après connexion sous",
      noteHighlight: '"Installer Caisty POS"',
      noteEnd: "dans le portail client.",
    },
  },
  ar: {
    hero: {
      badge: "حساب نقاط البيع والسحابة للمطاعم والمتاجر الحديثة",
      title: "نقطة بيع واحدة، بوابة واحدة –",
      titleHighlight: "كل شيء في متناول اليد.",
      description:
        "يربط Caisty الدفع السريع في نقاط البيع مع بوابة سحابية واضحة: إدارة التراخيص، مراقبة الأجهزة، والوصول المركزي للفواتير.",
      ctaPricing: "عرض الأسعار",
      ctaStart: "ابدأ مجاناً",
      trialNote: "ابدأ بترخيص تجريبي لمدة",
      trialDays: "يوم",
      trialNote2: "بدون بيانات الدفع. يمكنك التبديل إلى Starter أو Pro في أي وقت. يتم تثبيت Caisty POS لاحقاً مباشرة من بوابة العملاء.",
    },
    why: {
      title: "لماذا Caisty?",
      description:
        "Caisty للمشغلين الذين لا يريدون أنظمة مكتب خلفي معقدة ولكن يريدون البدء بسرعة – مع هيكل واضح للتراخيص والأجهزة والفوترة.",
      feature1Title: "بدء سريع",
      feature1Text: "تحميل المثبت، ربط الترخيص، البدء في البيع – بدون أسابيع من الإعداد.",
      feature2Title: "نظرة عامة كاملة",
      feature2Text: "في البوابة، يمكنك دائماً رؤية التراخيص النشطة والأجهزة المتصلة.",
      feature3Title: "عادل وشفاف",
      feature3Text: "خطط واضحة بدون رسوم مخفية. مثالي للبدء صغيراً والنمو لاحقاً.",
    },
    plans: {
      title: "الخطط والتراخيص",
      description:
        "جرب Caisty مجاناً أولاً، ثم قرر ما إذا كنت تريد المتابعة مع Starter أو Pro. يمكنك الدفع شهرياً أو التوفير مع خطة سنوية.",
      trial: {
        name: "تجريبي",
        badge: "جرب مجاناً",
        note: "أيام، جهاز واحد",
        detail1: "مجموعة ميزات كاملة مثل Starter",
        detail2: "لا حاجة لبيانات الدفع",
        detail3: "مثالي للاختبار في التشغيل المباشر",
      },
      starter: {
        name: "Starter",
        badge: "لنقطة بيع واحدة",
        price: "€ / شهر",
        subPrice: "أو € / سنة",
        note: "جهاز مشمول",
        detail1: "مثالي لموقع واحد",
        detail2: "تقارير أساسية ووصول للبوابة",
        detail3: "الترقية إلى Pro في أي وقت",
      },
      pro: {
        name: "Pro",
        badge: "أجهزة متعددة",
        price: "€ / شهر",
        subPrice: "أو € / سنة",
        note: "أجهزة مشمولة",
        detail1: "مثالي لـ 2–3 نقاط بيع أو فروع",
        detail2: "جميع ميزات Starter",
        detail3: "أجهزة متعددة تحت ترخيص واحد",
      },
      note: "جميع الأسعار بالإضافة إلى ضريبة القيمة المضافة – تختار الفوترة الدقيقة (شهرية أو سنوية) لاحقاً مباشرة في بوابة العملاء. يمكنك أيضاً التبديل بين Starter و Pro في أي وقت.",
    },
    forWhom: {
      title: "لمن Caisty?",
      target1Title: "الوجبات الجاهزة والطعام الشارع",
      target1Text: "طلبات سريعة، أزرار قليلة، تركز على السرعة.",
      target2Title: "الحانات والمقاهي",
      target2Text: "هياكل عناصر بسيطة، تحديثات أسعار مرنة وتقارير يومية.",
      target3Title: "المتاجر الصغيرة",
      target3Text: "نقطة بيع، إيصالات وتقارير أساسية في نظام واحد – بدون تعقيد.",
    },
    install: {
      title: "من التحميل إلى نقطة البيع الجاهزة للاستخدام في دقائق قليلة.",
      description:
        "يتم تثبيت Caisty POS بالكامل من خلال بوابة العملاء. هناك تحصل على المثبت ومفتاح الترخيص ودليل خطوة بخطوة.",
      step1: "إنشاء وصول للبوابة والحصول على الترخيص.",
      step2: "تحميل المثبت لنظام التشغيل من البوابة.",
      step3: "التثبيت على كمبيوتر نقطة البيع وإدخال مفتاح الترخيص – انتهى.",
      note: "يمكنك رؤية صفحة التثبيت التفصيلية بعد تسجيل الدخول تحت",
      noteHighlight: '"تثبيت Caisty POS"',
      noteEnd: "في بوابة العملاء.",
    },
  },
} as const;

export function getTranslation(lang: Language, key: string): string {
  const keys = key.split(".");
  let value: any = translations[lang];
  for (const k of keys) {
    value = value?.[k];
  }
  return value ?? key;
}

