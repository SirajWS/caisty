// Pricing Page Übersetzungen
import type { Language } from "./types";

export const pricing: Record<Language, {
  title: string;
  description: string;
  trial: {
    badge: string;
    title: string;
    description: string;
    cta: string;
  };
  billing: {
    monthly: string;
    yearly: string;
    discount: string;
  };
  plans: {
    starter: {
      title: string;
      badge: string;
      description: string;
      devicesLabel: string;
      features: string[];
    };
    pro: {
      title: string;
      badge: string;
      description: string;
      devicesLabel: string;
      features: string[];
    };
  };
  info: {
    contract: {
      title: string;
      text: string;
    };
    hardware: {
      title: string;
      text: string;
    };
    nextSteps: {
      title: string;
      text: string;
    };
  };
  cta: {
    title: string;
    description: string;
    button: string;
  };
  footer: string;
  planNote: string;
}> = {
  de: {
    title: "Einfache Pläne für deinen Start mit Caisty.",
    description:
      "Starte zuerst mit einer kurzen Testphase und entscheide dann, ob du mit Starter oder Pro weitermachen möchtest. Du zahlst pro Lizenz – und kannst monatlich beginnen oder mit einem Jahresplan sparen.",
    trial: {
      badge: "TESTLIZENZ",
      title: "Du startest immer mit einer",
      description:
        " (Funktionsumfang wie Starter, 1 Gerät). Keine Zahlungsdaten erforderlich – wenn dir Caisty gefällt, wählst du danach einfach Starter oder Pro.",
      cta: "Kostenlos starten",
    },
    billing: {
      monthly: "Monatlich",
      yearly: "Jährlich",
      discount: "(Rabatt)",
    },
    plans: {
      starter: {
        title: "Starter",
        badge: "Beliebt für einen Standort",
        description: "Ideal für eine Filiale oder ein einzelnes Geschäft.",
        devicesLabel: "aktives POS-Gerät",
        features: [
          "Lizenzverwaltung im Kundenportal",
          "Geräte-Übersicht & Basis-Statistiken",
          "Tagesabschlüsse & Export-Grundfunktionen",
          "E-Mail-Support zu Geschäftszeiten",
        ],
      },
      pro: {
        title: "Pro",
        badge: "Für mehrere Geräte",
        description: "Für Betriebe mit mehreren Kassen oder kleinen Filialnetzen.",
        devicesLabel: "aktive POS-Geräte",
        features: [
          "Alle Starter-Funktionen",
          "Mehrere Geräte unter einer Lizenz",
          "Erweiterte Auswertungen (geplant)",
          "Priorisierter Support",
        ],
      },
    },
    info: {
      contract: {
        title: "Vertrag & Laufzeit",
        text: "Du kannst mit einem monatlichen Plan beginnen und später jederzeit auf einen Jahresplan wechseln. Die Abrechnung läuft pro Lizenz, die du im Portal verwaltest.",
      },
      hardware: {
        title: "Hardware",
        text: "Caisty läuft auf Standard-Hardware: Windows-PC oder Mini-PC, Thermodrucker, optional Kassenschublade und Scanner. Keine Spezialkasse nötig.",
      },
      nextSteps: {
        title: "Nächste Schritte",
        text: "Portalzugang anlegen, Testlizenz erhalten und Caisty POS über die Installationsseite im Kundenportal installieren. Alles weitere steuerst du später zentral über dein Caisty-Konto.",
      },
    },
    cta: {
      title: "Bereit zum Testen?",
      description:
        "Lege deinen Portalzugang an, erhalte automatisch deine Testlizenz und installiere Caisty POS anschließend über die Installationsseite im Kundenportal.",
      button: "Portalzugang anlegen",
    },
    footer:
      "Alle Beträge in Euro, zzgl. MwSt. – finale Konditionen können je nach Land und Steuerregeln variieren und werden im Kundenportal pro Markt hinterlegt.",
    planNote:
      "Du kannst deinen Plan später im Portal wechseln – ein Upgrade ist in der Regel sofort möglich, ein Downgrade zur nächsten Abrechnungsperiode.",
  },
  en: {
    title: "Simple plans for your start with Caisty.",
    description:
      "Start with a short trial phase first, then decide whether you want to continue with Starter or Pro. You pay per license – and can start monthly or save with an annual plan.",
    trial: {
      badge: "TRIAL LICENSE",
      title: "You always start with a",
      description:
        "(Functionality like Starter, 1 device). No payment data required – if you like Caisty, you simply choose Starter or Pro afterwards.",
      cta: "Start free",
    },
    billing: {
      monthly: "Monthly",
      yearly: "Yearly",
      discount: "(Discount)",
    },
    plans: {
      starter: {
        title: "Starter",
        badge: "Popular for one location",
        description: "Ideal for a branch or a single business.",
        devicesLabel: "active POS device",
        features: [
          "License management in customer portal",
          "Device overview & basic statistics",
          "Daily reports & basic export functions",
          "Email support during business hours",
        ],
      },
      pro: {
        title: "Pro",
        badge: "For multiple devices",
        description: "For businesses with multiple cash registers or small branch networks.",
        devicesLabel: "active POS devices",
        features: [
          "All Starter features",
          "Multiple devices under one license",
          "Advanced analytics (planned)",
          "Priority support",
        ],
      },
    },
    info: {
      contract: {
        title: "Contract & Duration",
        text: "You can start with a monthly plan and switch to an annual plan at any time. Billing is per license, which you manage in the portal.",
      },
      hardware: {
        title: "Hardware",
        text: "Caisty runs on standard hardware: Windows PC or Mini PC, thermal printer, optional cash drawer and scanner. No special POS system required.",
      },
      nextSteps: {
        title: "Next Steps",
        text: "Create portal access, receive trial license and install Caisty POS via the installation page in the customer portal. Everything else you control later centrally through your Caisty account.",
      },
    },
    cta: {
      title: "Ready to test?",
      description:
        "Create your portal access, automatically receive your trial license and then install Caisty POS via the installation page in the customer portal.",
      button: "Create portal access",
    },
    footer:
      "All amounts in Euro, plus VAT – final terms may vary by country and tax rules and are stored in the customer portal per market.",
    planNote:
      "You can change your plan later in the portal – an upgrade is usually possible immediately, a downgrade to the next billing period.",
  },
  fr: {
    title: "Plans simples pour votre début avec Caisty.",
    description:
      "Commencez d'abord par une courte phase d'essai, puis décidez si vous voulez continuer avec Starter ou Pro. Vous payez par licence – et pouvez commencer mensuellement ou économiser avec un plan annuel.",
    trial: {
      badge: "LICENCE D'ESSAI",
      title: "Vous commencez toujours avec une",
      description:
        "(Fonctionnalité comme Starter, 1 appareil). Aucune donnée de paiement requise – si vous aimez Caisty, vous choisissez simplement Starter ou Pro ensuite.",
      cta: "Commencer gratuitement",
    },
    billing: {
      monthly: "Mensuel",
      yearly: "Annuel",
      discount: "(Réduction)",
    },
    plans: {
      starter: {
        title: "Starter",
        badge: "Populaire pour un emplacement",
        description: "Idéal pour une succursale ou une entreprise unique.",
        devicesLabel: "appareil POS actif",
        features: [
          "Gestion des licences dans le portail client",
          "Vue d'ensemble des appareils et statistiques de base",
          "Rapports quotidiens et fonctions d'export de base",
          "Support par e-mail pendant les heures de bureau",
        ],
      },
      pro: {
        title: "Pro",
        badge: "Pour plusieurs appareils",
        description: "Pour les entreprises avec plusieurs caisses enregistreuses ou petits réseaux de succursales.",
        devicesLabel: "appareils POS actifs",
        features: [
          "Toutes les fonctionnalités Starter",
          "Plusieurs appareils sous une licence",
          "Analyses avancées (prévu)",
          "Support prioritaire",
        ],
      },
    },
    info: {
      contract: {
        title: "Contrat & Durée",
        text: "Vous pouvez commencer avec un plan mensuel et passer à un plan annuel à tout moment. La facturation est par licence, que vous gérez dans le portail.",
      },
      hardware: {
        title: "Matériel",
        text: "Caisty fonctionne sur du matériel standard : PC Windows ou Mini PC, imprimante thermique, tiroir-caisse et scanner optionnels. Aucun système POS spécial requis.",
      },
      nextSteps: {
        title: "Prochaines Étapes",
        text: "Créer l'accès au portail, recevoir la licence d'essai et installer Caisty POS via la page d'installation dans le portail client. Tout le reste, vous le contrôlez plus tard de manière centralisée via votre compte Caisty.",
      },
    },
    cta: {
      title: "Prêt à tester?",
      description:
        "Créez votre accès au portail, recevez automatiquement votre licence d'essai et installez ensuite Caisty POS via la page d'installation dans le portail client.",
      button: "Créer l'accès au portail",
    },
    footer:
      "Tous les montants en euros, TVA comprise – les conditions finales peuvent varier selon le pays et les règles fiscales et sont stockées dans le portail client par marché.",
    planNote:
      "Vous pouvez changer votre plan plus tard dans le portail – une mise à niveau est généralement possible immédiatement, une rétrogradation à la prochaine période de facturation.",
  },
  ar: {
    title: "خطط بسيطة لبدايتك مع Caisty.",
    description:
      "ابدأ أولاً بمرحلة تجريبية قصيرة، ثم قرر ما إذا كنت تريد المتابعة مع Starter أو Pro. تدفع لكل ترخيص – ويمكنك البدء شهرياً أو التوفير مع خطة سنوية.",
    trial: {
      badge: "ترخيص تجريبي",
      title: "تبدأ دائماً بـ",
      description:
        "(وظائف مثل Starter، جهاز واحد). لا حاجة لبيانات الدفع – إذا أعجبك Caisty، تختار ببساطة Starter أو Pro بعد ذلك.",
      cta: "ابدأ مجاناً",
    },
    billing: {
      monthly: "شهري",
      yearly: "سنوي",
      discount: "(خصم)",
    },
    plans: {
      starter: {
        title: "Starter",
        badge: "شائع لموقع واحد",
        description: "مثالي لفرع أو عمل واحد.",
        devicesLabel: "جهاز نقاط بيع نشط",
        features: [
          "إدارة التراخيص في بوابة العملاء",
          "نظرة عامة على الأجهزة وإحصائيات أساسية",
          "تقارير يومية ووظائف تصدير أساسية",
          "دعم البريد الإلكتروني خلال ساعات العمل",
        ],
      },
      pro: {
        title: "Pro",
        badge: "لأجهزة متعددة",
        description: "للشركات التي لديها عدة نقاط بيع أو شبكات فروع صغيرة.",
        devicesLabel: "أجهزة نقاط بيع نشطة",
        features: [
          "جميع ميزات Starter",
          "أجهزة متعددة تحت ترخيص واحد",
          "تحليلات متقدمة (مخطط)",
          "دعم ذو أولوية",
        ],
      },
    },
    info: {
      contract: {
        title: "العقد والمدة",
        text: "يمكنك البدء بخطة شهرية والتبديل إلى خطة سنوية في أي وقت. الفوترة لكل ترخيص، والذي تديره في البوابة.",
      },
      hardware: {
        title: "الأجهزة",
        text: "يعمل Caisty على أجهزة قياسية: كمبيوتر Windows أو Mini PC، طابعة حرارية، درج نقدي اختياري وماسح ضوئي. لا حاجة لنظام نقاط بيع خاص.",
      },
      nextSteps: {
        title: "الخطوات التالية",
        text: "إنشاء وصول للبوابة، الحصول على ترخيص تجريبي وتثبيت Caisty POS عبر صفحة التثبيت في بوابة العملاء. كل شيء آخر تتحكم فيه لاحقاً بشكل مركزي من خلال حساب Caisty الخاص بك.",
      },
    },
    cta: {
      title: "جاهز للاختبار?",
      description:
        "أنشئ وصولك للبوابة، احصل تلقائياً على ترخيصك التجريبي ثم قم بتثبيت Caisty POS عبر صفحة التثبيت في بوابة العملاء.",
      button: "إنشاء وصول للبوابة",
    },
    footer:
      "جميع المبالغ باليورو، بالإضافة إلى ضريبة القيمة المضافة – قد تختلف الشروط النهائية حسب البلد وقواعد الضرائب ويتم تخزينها في بوابة العملاء لكل سوق.",
    planNote:
      "يمكنك تغيير خطتك لاحقاً في البوابة – الترقية ممكنة عادةً فوراً، التخفيض إلى فترة الفوترة التالية.",
  },
};

