// Landing Page Übersetzungen
import type { Language } from "./types";

export const landing: Record<Language, {
  hero: {
    badge: string;
    title: string;
    titleHighlight: string;
    description: string;
    ctaPricing: string;
    ctaStart: string;
    trialNote: string;
    trialDays: string;
    trialNote2: string;
  };
  why: {
    title: string;
    description: string;
    feature1Title: string;
    feature1Text: string;
    feature2Title: string;
    feature2Text: string;
    feature3Title: string;
    feature3Text: string;
  };
  plans: {
    title: string;
    description: string;
    trial: {
      name: string;
      badge: string;
      note: string;
      detail1: string;
      detail2: string;
      detail3: string;
    };
    starter: {
      name: string;
      badge: string;
      price: string;
      subPrice: string;
      note: string;
      detail1: string;
      detail2: string;
      detail3: string;
    };
    pro: {
      name: string;
      badge: string;
      price: string;
      subPrice: string;
      note: string;
      detail1: string;
      detail2: string;
      detail3: string;
    };
    note: string;
  };
  forWhom: {
    title: string;
    target1Title: string;
    target1Text: string;
    target2Title: string;
    target2Text: string;
    target3Title: string;
    target3Text: string;
  };
  install: {
    title: string;
    description: string;
    step1: string;
    step2: string;
    step3: string;
    note: string;
    noteHighlight: string;
    noteEnd: string;
  };
  fiscal: {
    title: string;
    paragraph1: string;
    modeName: string;
    comingSoon: string;
    paragraph2: string;
    countries: string[];
    paragraph3: string;
    strictRequirement: string;
    paragraph4: string;
    paragraph5: string;
  };
}> = {
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
    fiscal: {
      title: "Fiskal-Info & internationale Nutzung",
      paragraph1: "Caisty bietet aktuell einen",
      modeName: "\"Kein Fiskalmodul / generische Belege\"",
      comingSoon: "\"in Kürze verfügbar\"",
      paragraph2: "Modus und zeigt mehrere Fiskalpakete als (TSE, RKSV, NF525, SAF-T, TicketBAI, myDATA …). Du kannst die Kasse bereits in vielen nicht-fiskalisierten Ländern nutzen, zum Beispiel:",
      countries: [
        "Niederlande (EUR)",
        "Irland (EUR)",
        "Schweiz (CHF)",
        "Vereinigtes Königreich (GBP)",
        "Tschechische Republik (CZK)",
        "Tunesien (TND)",
        "Marokko (MAD)",
        "Algerien (DZD)",
        "Libyen (LYD)",
      ],
      paragraph3: "In Ländern mit einer",
      strictRequirement: "strikten Fiskalisierungspflicht",
      paragraph4: "– zum Beispiel Deutschland, Österreich, Italien, Frankreich, Spanien, Portugal und andere – ist oft ein zertifiziertes Fiskalgerät oder zertifizierte Software vorgeschrieben. Solange das passende Caisty-Fiskalpaket nur als angezeigt wird, nutzt du den generischen Modus auf eigene Verantwortung. Kläre immer mit deinem lokalen Steuerberater oder der Behörde, ob dieser Modus für dein Geschäft erlaubt ist.",
      paragraph5: "Caisty hilft dir technisch (Belege, Journale, Exporte), ersetzt aber keine Rechtsberatung oder offizielle Registrierung bei Steuerbehörden.",
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
    fiscal: {
      title: "Fiscal info & international use",
      paragraph1: "Caisty currently offers a",
      modeName: "\"No fiscal engine / generic receipts\"",
      comingSoon: "\"coming soon\"",
      paragraph2: "mode and shows several fiscal packs as (TSE, RKSV, NF525, SAF-T, TicketBAI, myDATA …). You can already use the POS in many non-fiscal countries, for example:",
      countries: [
        "Netherlands (EUR)",
        "Ireland (EUR)",
        "Switzerland (CHF)",
        "United Kingdom (GBP)",
        "Czech Republic (CZK)",
        "Tunisia (TND)",
        "Morocco (MAD)",
        "Algeria (DZD)",
        "Libya (LYD)",
      ],
      paragraph3: "In countries with a",
      strictRequirement: "strict fiscalization requirement",
      paragraph4: "– for example Germany, Austria, Italy, France, Spain, Portugal and others – a certified fiscal device or certified software is often mandatory. As long as the matching Caisty fiscal pack is only shown as, you are using the generic mode at your own responsibility. Always confirm with your local tax advisor or authority whether this mode is allowed for your business.",
      paragraph5: "Caisty helps you technically (receipts, journals, exports), but it does not replace legal advice or official registration with tax authorities.",
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
    fiscal: {
      title: "Info fiscale & utilisation internationale",
      paragraph1: "Caisty propose actuellement un",
      modeName: "\"Pas de moteur fiscal / reçus génériques\"",
      comingSoon: "\"bientôt disponible\"",
      paragraph2: "mode et affiche plusieurs packs fiscaux comme (TSE, RKSV, NF525, SAF-T, TicketBAI, myDATA …). Vous pouvez déjà utiliser le POS dans de nombreux pays non fiscaux, par exemple :",
      countries: [
        "Pays-Bas (EUR)",
        "Irlande (EUR)",
        "Suisse (CHF)",
        "Royaume-Uni (GBP)",
        "République tchèque (CZK)",
        "Tunisie (TND)",
        "Maroc (MAD)",
        "Algérie (DZD)",
        "Libye (LYD)",
      ],
      paragraph3: "Dans les pays avec une",
      strictRequirement: "exigence de fiscalisation stricte",
      paragraph4: "– par exemple l'Allemagne, l'Autriche, l'Italie, la France, l'Espagne, le Portugal et d'autres – un dispositif fiscal certifié ou un logiciel certifié est souvent obligatoire. Tant que le pack fiscal Caisty correspondant n'est affiché que comme, vous utilisez le mode générique à vos propres risques. Confirmez toujours avec votre conseiller fiscal local ou l'autorité si ce mode est autorisé pour votre entreprise.",
      paragraph5: "Caisty vous aide techniquement (reçus, journaux, exports), mais ne remplace pas les conseils juridiques ou l'enregistrement officiel auprès des autorités fiscales.",
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
    fiscal: {
      title: "معلومات ضريبية واستخدام دولي",
      paragraph1: "يقدم Caisty حالياً وضع",
      modeName: "\"لا محرك ضريبي / إيصالات عامة\"",
      comingSoon: "\"قريباً\"",
      paragraph2: "ويظهر عدة حزم ضريبية كـ (TSE, RKSV, NF525, SAF-T, TicketBAI, myDATA …). يمكنك بالفعل استخدام نقاط البيع في العديد من البلدان غير الضريبية، على سبيل المثال:",
      countries: [
        "هولندا (EUR)",
        "أيرلندا (EUR)",
        "سويسرا (CHF)",
        "المملكة المتحدة (GBP)",
        "جمهورية التشيك (CZK)",
        "تونس (TND)",
        "المغرب (MAD)",
        "الجزائر (DZD)",
        "ليبيا (LYD)",
      ],
      paragraph3: "في البلدان ذات",
      strictRequirement: "متطلبات ضريبية صارمة",
      paragraph4: "– على سبيل المثال ألمانيا، النمسا، إيطاليا، فرنسا، إسبانيا، البرتغال وغيرها – غالباً ما يكون مطلوباً جهاز ضريبي معتمد أو برنامج معتمد. طالما أن حزمة Caisty الضريبية المطابقة تظهر فقط كـ، فأنت تستخدم الوضع العام على مسؤوليتك الخاصة. تأكد دائماً من مستشارك الضريبي المحلي أو السلطة ما إذا كان هذا الوضع مسموحاً لعملك.",
      paragraph5: "يساعدك Caisty تقنياً (الإيصالات، السجلات، التصدير)، لكنه لا يحل محل المشورة القانونية أو التسجيل الرسمي لدى السلطات الضريبية.",
    },
  },
};

