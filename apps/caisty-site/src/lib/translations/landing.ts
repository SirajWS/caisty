// Landing Page Übersetzungen — Reihenfolge Sprachen: en, fr, de, ar
import type { Language } from "./types";
import type { TranslationSchema } from "./types";

const landingLocales = {
  en: {
    hero: {
      badge: "Caisty POS — restaurants, cafés & retail",
      title: "Modern POS software for restaurants, cafés and small shops.",
      description:
        "Fast checkout, tables, orders and receipt printers — plus a clear cloud portal for licenses, devices and invoices when you need them.",
      ctaPrimary: "Start free",
      ctaSecondary: "View pricing",
      trialTrust: "Start with a free 3-day trial. No payment details required.",
    },
    preview: {
      title: "Checkout on the floor",
      caption: "POS-first",
      items: [
        "Fast touchscreen sales",
        "Tables & orders",
        "Kitchen / bar printing",
        "ESC/POS receipts",
        "End-of-day sales report",
        "Cloud: licenses & devices",
      ],
      liveBadge: "Live session",
      demoBadge: "Demo",
      devicesOnline: "2 terminals · 1 printer online",
      quote:
        "“We needed a till that keeps up at lunch — the portal is there when we close the day.” — example bistro",
    },
    why: {
      title: "Why choose Caisty?",
      description:
        "Caisty is built for business owners who want a fast checkout system without complicated back-office software.",
      feature1Title: "Fast to start",
      feature1Text:
        "Create your account, activate your license and connect your device without a long setup process.",
      feature2Title: "Clear overview",
      feature2Text: "See active licenses, connected devices and invoices from one simple portal.",
      feature3Title: "Simple pricing",
      feature3Text: "Start small and upgrade later when your business grows.",
      feature4Title: "Staff-ready",
      feature4Text: "Straightforward permissions and daily workflows so teams stay fast at the counter.",
    },
    forWhom: {
      title: "Built for daily business",
      target1Title: "Take-away & street food",
      target1Text: "Fast orders, simple workflows and a POS experience focused on speed.",
      target2Title: "Bars & cafés",
      target2Text: "Flexible products, clear daily reports and easy device management.",
      target3Title: "Small shops",
      target3Text: "Checkout, receipts and basic reporting in one simple system.",
    },
    plans: {
      title: "Plans that fit your business",
      intro: "Start with a free trial and upgrade when you are ready.",
      trial: {
        name: "Trial",
        badge: "Try for free",
        priceLine: "0 €",
        subline: "3 days, 1 device",
        features: [
          "Full Starter features",
          "No payment details required",
          "Ideal for testing Caisty in real use",
        ],
      },
      starter: {
        name: "Starter",
        badge: "1 device",
        recommended: "Recommended",
        priceLine: "9.99 € / month",
        subline: "1 device included",
        features: [
          "Perfect for one location",
          "Cloud portal access",
          "Basic reporting",
          "License management",
          "Upgrade to Pro anytime",
        ],
      },
      pro: {
        name: "Pro",
        badge: "Multi-device",
        priceLine: "19.99 € / month",
        subline: "3 devices included",
        features: [
          "All Starter features",
          "Multiple devices under one license",
          "Better for several checkouts or small branches",
          "Priority-ready structure for future features",
        ],
      },
      note:
        "All prices are shown excluding VAT where applicable. Monthly and yearly billing can be added in the customer portal.",
    },
    payment: {
      title: "Secure payment methods",
      description: "Caisty supports simple and secure payment options for your subscription.",
      paypal: {
        title: "PayPal",
        description: "Pay easily with your PayPal account.",
      },
      stripe: {
        title: "Credit card via Stripe",
        description: "Pay by Visa or Mastercard. Transactions are processed securely through Stripe.",
      },
      footnote: "SEPA direct debit and invoice payment can be added later.",
    },
    install: {
      title: "From download to checkout in minutes",
      description:
        "The Caisty POS installer will be available inside the customer portal. Customers can download the installer, connect their license key and start using the POS system.",
      steps: [
        "Create account and receive license",
        "Download installer from customer portal",
        "Install Caisty POS on your checkout device",
        "Connect your license key",
        "Start selling",
      ],
      noteBefore: "The detailed install page appears after sign-in under",
      noteHighlight: "Install Caisty POS",
      noteAfter: "in the customer portal.",
      mockTitle: "Customer portal · Install",
      previewBadge: "Preview",
      platformWin: "Windows",
      platformLinux: "Linux soon",
      platformMac: "macOS soon",
      downloadHint:
        "Download details appear in the portal after login — not on this public marketing page.",
      smallDownload: "Download",
      smallInstall: "Install",
      smallLicense: "Connect license",
    },
    fiscal: {
      title: "Fiscal information and international use",
      lead:
        "Caisty currently provides a generic POS mode without certified fiscalization. This mode can be used only where local law allows it. Examples of supported generic mode (non-exhaustive):",
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
      strict:
        "In countries with strict fiscal requirements, such as Germany, Austria, Italy, France, Spain or Portugal, certified fiscal hardware or certified software may be required. Caisty must only be used in these markets once the required fiscal module is available and legally approved. Always confirm local requirements with your tax advisor or local authority.",
      disclaimer:
        "Caisty helps with receipts, journals and exports, but does not replace legal or tax advice.",
    },
    demo: {
      sectionTitle: "POS screenshots",
      videoAria: "Play product video",
      closeLabel: "Close",
      clickOutside: "Click outside the image to close",
      shotDashboard: "Back office",
      shotPos: "POS checkout",
      shotPortal: "Customer portal",
    },
    portalBand: {
      title: "Customer portal (included)",
      description:
        "Licenses, devices, invoices and installers live in one hub — less admin, more time on the floor.",
      bullets: [
        "Trials, upgrades and license keys",
        "Device overview and installs",
        "Invoices and payment methods",
      ],
    },
    faq: {
      title: "FAQ",
      items: [
        {
          q: "Is Caisty POS or only a cloud portal?",
          a: "POS-first: checkout, orders, tables and printers. The cloud portal supports licenses, devices and billing.",
        },
        {
          q: "Can I start without payment details?",
          a: "Yes. The trial is free for three days with full Starter functionality on one device.",
        },
        {
          q: "Where do I download the POS app?",
          a: "After sign-up, open the customer portal and go to Install Caisty POS for the official installer.",
        },
        {
          q: "Does Caisty replace certified fiscal hardware?",
          a: "Caisty provides a generic POS mode. Confirm local fiscal rules with your advisor before going live.",
        },
      ],
    },
  },
  fr: {
    hero: {
      badge: "Caisty POS — restaurants, cafés & commerce",
      title: "Logiciel de caisse moderne pour restaurants, cafés et petits commerces.",
      description:
        "Encaissement rapide, tables, commandes et tickets ESC/POS — avec un portail cloud clair pour licences, appareils et factures.",
      ctaPrimary: "Commencer gratuitement",
      ctaSecondary: "Voir les tarifs",
      trialTrust: "Commencez avec un essai gratuit de 3 jours. Aucun moyen de paiement requis.",
    },
    preview: {
      title: "À la caisse",
      caption: "Priorité POS",
      items: [
        "Ventes tactiles rapides",
        "Tables & commandes",
        "Impression cuisine / bar",
        "Tickets ESC/POS",
        "Rapport de fin de journée",
        "Cloud : licences & appareils",
      ],
      liveBadge: "Session en direct",
      demoBadge: "Démo",
      devicesOnline: "2 terminaux · 1 imprimante en ligne",
      quote:
        "« Il nous fallait une caisse qui tienne le service — le portail suit quand on clôt la journée. » — bistrot fictif",
    },
    why: {
      title: "Pourquoi choisir Caisty ?",
      description:
        "Caisty s’adresse aux commerçants qui veulent un encaissement rapide sans logiciel de back-office compliqué.",
      feature1Title: "Démarrage rapide",
      feature1Text:
        "Créez votre compte, activez votre licence et connectez votre appareil sans longue phase de configuration.",
      feature2Title: "Vue claire",
      feature2Text:
        "Consultez licences actives, appareils connectés et factures depuis un seul portail simple.",
      feature3Title: "Tarification simple",
      feature3Text: "Commencez petit et passez à l’offre supérieure quand votre activité grandit.",
      feature4Title: "Prêt pour les équipes",
      feature4Text: "Droits simples et routines du quotidien pour garder le rythme au comptoir.",
    },
    forWhom: {
      title: "Pensé pour le quotidien",
      target1Title: "À emporter & street food",
      target1Text: "Commandes rapides, parcours simples et expérience POS axée sur la vitesse.",
      target2Title: "Bars & cafés",
      target2Text: "Produits flexibles, rapports du jour clairs et gestion d’appareils facile.",
      target3Title: "Petits commerces",
      target3Text: "Encaissement, tickets et reporting de base dans un système simple.",
    },
    plans: {
      title: "Des offres adaptées à votre activité",
      intro: "Commencez par un essai gratuit et passez à une offre payante quand vous êtes prêt.",
      trial: {
        name: "Essai",
        badge: "Gratuit",
        priceLine: "0 €",
        subline: "3 jours, 1 appareil",
        features: [
          "Fonctionnalités Starter complètes",
          "Aucun moyen de paiement requis",
          "Idéal pour tester Caisty en conditions réelles",
        ],
      },
      starter: {
        name: "Starter",
        badge: "1 appareil",
        recommended: "Recommandé",
        priceLine: "9,99 € / mois",
        subline: "1 appareil inclus",
        features: [
          "Parfait pour un seul lieu",
          "Accès au portail cloud",
          "Reporting de base",
          "Gestion des licences",
          "Passage à Pro à tout moment",
        ],
      },
      pro: {
        name: "Pro",
        badge: "Multi-appareils",
        priceLine: "19,99 € / mois",
        subline: "3 appareils inclus",
        features: [
          "Toutes les fonctionnalités Starter",
          "Plusieurs appareils sous une même licence",
          "Adapté à plusieurs caisses ou petites succursales",
          "Structure prête pour des fonctionnalités futures prioritaires",
        ],
      },
      note:
        "Les prix s’entendent hors TVA le cas échéant. La facturation mensuelle ou annuelle pourra être gérée dans le portail client.",
    },
    payment: {
      title: "Moyens de paiement sécurisés",
      description: "Caisty propose des options de paiement simples et sécurisées pour votre abonnement.",
      paypal: {
        title: "PayPal",
        description: "Payez facilement avec votre compte PayPal.",
      },
      stripe: {
        title: "Carte bancaire via Stripe",
        description:
          "Payez par Visa ou Mastercard. Les transactions sont traitées en toute sécurité via Stripe.",
      },
      footnote: "Le prélèvement SEPA et le paiement sur facture pourront être ajoutés ultérieurement.",
    },
    install: {
      title: "Du téléchargement à la vente en quelques minutes",
      description:
        "L’installateur Caisty POS sera disponible dans le portail client. Téléchargez-le, reliez votre clé de licence et utilisez le POS.",
      steps: [
        "Créer un compte et recevoir la licence",
        "Télécharger l’installateur depuis le portail client",
        "Installer Caisty POS sur votre caisse",
        "Connecter votre clé de licence",
        "Commencer à vendre",
      ],
      noteBefore: "La page d’installation détaillée est visible après connexion sous",
      noteHighlight: "Installer Caisty POS",
      noteAfter: "dans le portail client.",
      mockTitle: "Portail client · Installation",
      previewBadge: "Aperçu",
      platformWin: "Windows",
      platformLinux: "Linux bientôt",
      platformMac: "macOS bientôt",
      downloadHint:
        "Les détails de téléchargement apparaissent dans le portail après connexion — pas sur ce site marketing.",
      smallDownload: "Téléchargement",
      smallInstall: "Installation",
      smallLicense: "Licence",
    },
    fiscal: {
      title: "Informations fiscales et usage international",
      lead:
        "Caisty propose actuellement un mode POS générique sans fiscalisation certifiée. Ce mode n’est utilisable que là où la loi locale l’autorise. Exemples (liste non exhaustive) :",
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
      strict:
        "Dans les pays à obligations fiscales strictes (Allemagne, Autriche, Italie, France, Espagne, Portugal, etc.), un matériel ou un logiciel certifié peut être obligatoire. N’utilisez Caisty dans ces marchés qu’une fois le module fiscal requis disponible et légalement validé. Vérifiez toujours les exigences locales avec un conseiller fiscal ou l’administration compétente.",
      disclaimer:
        "Caisty aide pour les tickets, journaux et exports, mais ne remplace pas un conseil juridique ou fiscal.",
    },
    demo: {
      sectionTitle: "Captures POS",
      videoAria: "Lire la vidéo produit",
      closeLabel: "Fermer",
      clickOutside: "Cliquez en dehors de l’image pour fermer",
      shotDashboard: "Back-office",
      shotPos: "Caisse POS",
      shotPortal: "Portail client",
    },
    portalBand: {
      title: "Portail client (inclus)",
      description:
        "Licences, appareils, factures et installateurs au même endroit — moins d’admin, plus de temps en salle.",
      bullets: [
        "Essais, mises à niveau et clés de licence",
        "Vue appareils et installations",
        "Factures et moyens de paiement",
      ],
    },
    faq: {
      title: "FAQ",
      items: [
        {
          q: "Caisty, c’est un POS ou seulement un portail cloud ?",
          a: "Priorité POS : caisse, commandes, tables et imprimantes. Le portail cloud gère licences, appareils et facturation.",
        },
        {
          q: "Puis-je commencer sans carte bancaire ?",
          a: "Oui. L’essai est gratuit 3 jours avec les fonctions Starter sur un appareil.",
        },
        {
          q: "Où télécharger l’application POS ?",
          a: "Après inscription, ouvrez le portail client puis « Installer Caisty POS » pour l’installateur officiel.",
        },
        {
          q: "Caisty remplace-t-il un matériel fiscal certifié ?",
          a: "Caisty propose un mode POS générique. Vérifiez toujours la réglementation locale avec un conseiller.",
        },
      ],
    },
  },
  de: {
    hero: {
      badge: "Caisty POS — Gastronomie & Einzelhandel",
      title: "Moderne POS-Software für Restaurants, Cafés und kleine Läden.",
      description:
        "Schnelle Kasse, Tische, Bestellungen und Belegdrucker — plus ein klares Cloud-Portal für Lizenzen, Geräte und Rechnungen.",
      ctaPrimary: "Kostenlos starten",
      ctaSecondary: "Preise ansehen",
      trialTrust: "Starte mit einer kostenlosen 3-Tage-Testphase. Keine Zahlungsdaten nötig.",
    },
    preview: {
      title: "Direkt an der Kasse",
      caption: "POS zuerst",
      items: [
        "Schneller Touchscreen-Verkauf",
        "Tische & Bestellungen",
        "Küchen- / Bar-Druck",
        "ESC/POS-Belege",
        "Tagesabschluss-Verkauf",
        "Cloud: Lizenzen & Geräte",
      ],
      liveBadge: "Live-Session",
      demoBadge: "Demo",
      devicesOnline: "2 Kassen · 1 Drucker online",
      quote:
        "„Wir brauchten eine Kasse, die zur Rushhour mitkommt — das Portal holen wir beim Tagesabschluss.“ – fiktives Bistro",
    },
    why: {
      title: "Warum Caisty?",
      description:
        "Caisty richtet sich an Betreiberinnen und Betreiber, die schnell kassieren wollen – ohne komplizierte Backoffice-Software.",
      feature1Title: "Schnell startklar",
      feature1Text:
        "Konto anlegen, Lizenz aktivieren, Gerät verbinden – ohne lange Einrichtungsphase.",
      feature2Title: "Klare Übersicht",
      feature2Text:
        "Aktive Lizenzen, verbundene Geräte und Rechnungen in einem einfachen Portal.",
      feature3Title: "Einfache Preise",
      feature3Text: "Klein starten und später upgraden, wenn Ihr Geschäft wächst.",
      feature4Title: "Team-tauglich",
      feature4Text: "Klare Berechtigungen und Abläufe, damit die Schicht schnell bleibt.",
    },
    forWhom: {
      title: "Für den täglichen Betrieb gemacht",
      target1Title: "Take-away & Street Food",
      target1Text: "Schnelle Bestellungen, einfache Abläufe und POS mit Fokus auf Tempo.",
      target2Title: "Bars & Cafés",
      target2Text: "Flexible Artikel, klare Tagesauswertungen und einfache Geräteverwaltung.",
      target3Title: "Kleine Läden",
      target3Text: "Kasse, Belege und Basis-Reporting in einem schlanken System.",
    },
    plans: {
      title: "Pläne, die zu Ihrem Betrieb passen",
      intro: "Starten Sie mit einer kostenlosen Testphase und upgraden Sie, wenn Sie bereit sind.",
      trial: {
        name: "Trial",
        badge: "Kostenlos testen",
        priceLine: "0 €",
        subline: "3 Tage, 1 Gerät",
        features: [
          "Voller Starter-Funktionsumfang",
          "Keine Zahlungsdaten erforderlich",
          "Ideal zum Testen im echten Einsatz",
        ],
      },
      starter: {
        name: "Starter",
        badge: "1 Gerät",
        recommended: "Empfohlen",
        priceLine: "9,99 € / Monat",
        subline: "1 Gerät inklusive",
        features: [
          "Perfekt für einen Standort",
          "Zugang zum Cloud-Portal",
          "Basis-Reporting",
          "Lizenzverwaltung",
          "Upgrade auf Pro jederzeit möglich",
        ],
      },
      pro: {
        name: "Pro",
        badge: "Mehrere Geräte",
        priceLine: "19,99 € / Monat",
        subline: "3 Geräte inklusive",
        features: [
          "Alle Starter-Funktionen",
          "Mehrere Geräte unter einer Lizenz",
          "Geeignet für mehrere Kassen oder kleine Filialen",
          "Struktur priorisiert für künftige Funktionen",
        ],
      },
      note:
        "Alle Preise zzgl. USt., soweit anwendbar. Monats- und Jahresabrechnung können im Kundenportal ergänzt werden.",
    },
    payment: {
      title: "Sichere Zahlungsmethoden",
      description: "Caisty unterstützt einfache und sichere Zahlungsoptionen für Ihr Abonnement.",
      paypal: {
        title: "PayPal",
        description: "Zahlen Sie bequem mit Ihrem PayPal-Konto.",
      },
      stripe: {
        title: "Kreditkarte über Stripe",
        description:
          "Zahlung mit Visa oder Mastercard. Transaktionen werden sicher über Stripe abgewickelt.",
      },
      footnote: "SEPA-Lastschrift und Rechnungskauf können später ergänzt werden.",
    },
    install: {
      title: "Vom Download zur Kasse in wenigen Minuten",
      description:
        "Der Caisty-POS-Installer wird im Kundenportal bereitgestellt. Installer herunterladen, Lizenzschlüssel verbinden und loslegen.",
      steps: [
        "Konto anlegen und Lizenz erhalten",
        "Installer aus dem Kundenportal herunterladen",
        "Caisty POS auf dem Kassengerät installieren",
        "Lizenzschlüssel verbinden",
        "Verkauf starten",
      ],
      noteBefore: "Die ausführliche Installationsseite findest du nach dem Login unter",
      noteHighlight: "Caisty POS installieren",
      noteAfter: "im Kundenportal.",
      mockTitle: "Kundenportal · Installation",
      previewBadge: "Vorschau",
      platformWin: "Windows",
      platformLinux: "Linux bald",
      platformMac: "macOS bald",
      downloadHint:
        "Download-Details erscheinen nach Login im Portal — nicht auf dieser öffentlichen Website.",
      smallDownload: "Download",
      smallInstall: "Installation",
      smallLicense: "Lizenz verbinden",
    },
    fiscal: {
      title: "Fiskalinformationen und internationale Nutzung",
      lead:
        "Caisty bietet derzeit einen generischen POS-Modus ohne zertifizierte Fiskalisierung. Dieser Modus darf nur genutzt werden, wo das lokale Recht es erlaubt. Beispiele für unterstützten generischen Modus (nicht abschließend):",
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
      strict:
        "In Ländern mit strengen fiskalen Anforderungen (z. B. Deutschland, Österreich, Italien, Frankreich, Spanien, Portugal) können zertifizierte Hardware oder zertifizierte Software vorgeschrieben sein. Nutzen Sie Caisty in diesen Märkten erst, wenn das erforderliche Fiskalmodul verfügbar und rechtlich zugelassen ist. Klären Sie Anforderungen immer mit Steuerberatung oder Behörde.",
      disclaimer:
        "Caisty unterstützt bei Belegen, Journalen und Exporten, ersetzt aber keine Rechts- oder Steuerberatung.",
    },
    demo: {
      sectionTitle: "POS-Screenshots",
      videoAria: "Produktvideo abspielen",
      closeLabel: "Schließen",
      clickOutside: "Zum Schließen außerhalb des Bildes klicken",
      shotDashboard: "Backoffice",
      shotPos: "POS-Kasse",
      shotPortal: "Kundenportal",
    },
    portalBand: {
      title: "Kundenportal (inklusive)",
      description:
        "Lizenzen, Geräte, Rechnungen und Installer an einem Ort — weniger Verwaltung, mehr Zeit im Service.",
      bullets: [
        "Tests, Upgrades und Lizenzschlüssel",
        "Geräteübersicht und Installationen",
        "Rechnungen und Zahlungsarten",
      ],
    },
    faq: {
      title: "FAQ",
      items: [
        {
          q: "Ist Caisty POS oder nur ein Cloud-Portal?",
          a: "POS zuerst: Kasse, Bestellungen, Tische und Drucker. Das Cloud-Portal unterstützt Lizenzen, Geräte und Abrechnung.",
        },
        {
          q: "Kann ich ohne Zahlungsdaten starten?",
          a: "Ja. Die Testphase ist drei Tage kostenlos mit vollem Starter-Funktionsumfang auf einem Gerät.",
        },
        {
          q: "Wo lade ich die POS-App herunter?",
          a: "Nach der Registrierung findest du im Kundenportal unter „Caisty POS installieren“ den offiziellen Installer.",
        },
        {
          q: "Ersetzt Caisty zertifizierte Fiskal-Hardware?",
          a: "Caisty bietet einen generischen POS-Modus. Kläre lokale Fiskalvorschriften immer mit deiner Beratung.",
        },
      ],
    },
  },
  ar: {
    hero: {
      badge: "Caisty POS — مطاعم ومقاهٍ وتجزئة",
      title: "برنامج نقاط بيع حديث للمطاعم والمقاهي والمتاجر الصغيرة.",
      description:
        "دفع سريع وطاولات وطلبات وطابعات إيصالات — مع بوابة سحابية واضحة للتراخيص والأجهزة والفواتير عند الحاجة.",
      ctaPrimary: "ابدأ مجاناً",
      ctaSecondary: "عرض الأسعار",
      trialTrust: "ابدأ بتجربة مجانية لمدة 3 أيام. دون بيانات دفع.",
    },
    preview: {
      title: "عند نقطة البيع",
      caption: "الأولوية للـ POS",
      items: [
        "بيع سريع بالشاشة اللمسية",
        "طاولات وطلبات",
        "طباعة مطبخ / بار",
        "إيصالات ESC/POS",
        "تقرير مبيعات نهاية اليوم",
        "سحابة: تراخيص وأجهزة",
      ],
      liveBadge: "جلسة مباشرة",
      demoBadge: "تجريبي",
      devicesOnline: "جهازان · طابعة واحدة متصلة",
      quote: "« نحتاج صندوقاً يتحمل زحمة الغداء — البوابة عند إغلاق اليوم. » — مقهى افتراضي",
    },
    why: {
      title: "لماذا Caisty؟",
      description:
        "صُمم Caisty لأصحاب الأعمال الذين يريدون نقطة دفع سريعة دون برامج خلفية معقدة.",
      feature1Title: "بدء سريع",
      feature1Text: "أنشئ حسابك، فعّل الترخيص وصِل جهازك دون إعداد طويل.",
      feature2Title: "نظرة واضحة",
      feature2Text: "اطلع على التراخيص النشطة والأجهزة المتصلة والفواتير من بوابة واحدة بسيطة.",
      feature3Title: "تسعير بسيط",
      feature3Text: "ابدأ صغيراً وقم بالترقية لاحقاً عند نمو عملك.",
      feature4Title: "جاهز للطاقم",
      feature4Text: "صلاحيات واضحة وسير عمل يومي للحفاظ على السرعة عند الكاشير.",
    },
    forWhom: {
      title: "مصمم للعمل اليومي",
      target1Title: "الوجبات الجاهزة والطعام الشارعي",
      target1Text: "طلبات سريعة وتدفقات بسيطة وتجربة نقاط بيع تركز على السرعة.",
      target2Title: "الحانات والمقاهي",
      target2Text: "منتجات مرنة وتقارير يومية واضحة وإدارة سهلة للأجهزة.",
      target3Title: "متاجر صغيرة",
      target3Text: "الدفع والإيصالات والتقارير الأساسية في نظام واحد بسيط.",
    },
    plans: {
      title: "خطط تناسب عملك",
      intro: "ابدأ بتجربة مجانية وقم بالترقية عندما تكون جاهزاً.",
      trial: {
        name: "تجريبي",
        badge: "مجاني",
        priceLine: "0 €",
        subline: "3 أيام، جهاز واحد",
        features: [
          "جميع ميزات Starter",
          "دون بيانات دفع",
          "مثالي لاختبار Caisty عملياً",
        ],
      },
      starter: {
        name: "Starter",
        badge: "جهاز واحد",
        recommended: "موصى به",
        priceLine: "9.99 € / شهر",
        subline: "جهاز واحد مشمول",
        features: [
          "مثالي لموقع واحد",
          "الوصول إلى البوابة السحابية",
          "تقارير أساسية",
          "إدارة التراخيص",
          "الترقية إلى Pro في أي وقت",
        ],
      },
      pro: {
        name: "Pro",
        badge: "أجهزة متعددة",
        priceLine: "19.99 € / شهر",
        subline: "3 أجهزة مشمولة",
        features: [
          "جميع ميزات Starter",
          "عدة أجهزة تحت ترخيص واحد",
          "أنسب لعدة صناديق أو فروع صغيرة",
          "هيكل جاهز أولويةً للميزات المستقبلية",
        ],
      },
      note:
        "جميع الأسعار بدون ضريبة القيمة المضافة حيث ينطبق ذلك. يمكن إضافة الفوترة الشهرية أو السنوية في بوابة العملاء.",
    },
    payment: {
      title: "طرق دفع آمنة",
      description: "يدعم Caisty خيارات دفع بسيطة وآمنة لاشتراكك.",
      paypal: {
        title: "PayPal",
        description: "ادفع بسهولة عبر حساب PayPal.",
      },
      stripe: {
        title: "بطاقة ائتمان عبر Stripe",
        description: "الدفع بـ Visa أو Mastercard. تتم المعاملات بأمان عبر Stripe.",
      },
      footnote: "يمكن إضافة الخصم المباشر SEPA والدفع بالفاتورة لاحقاً.",
    },
    install: {
      title: "من التحميل إلى البيع في دقائق",
      description:
        "سيُتاح مثبت Caisty POS داخل بوابة العملاء. حمّل المثبت، اربط مفتاح الترخيص وابدأ استخدام نقاط البيع.",
      steps: [
        "إنشاء حساب والحصول على الترخيص",
        "تحميل المثبت من بوابة العملاء",
        "تثبيت Caisty POS على جهاز الكاشير",
        "ربط مفتاح الترخيص",
        "ابدأ البيع",
      ],
      noteBefore: "صفحة التثبيت التفصيلية تظهر بعد تسجيل الدخول تحت",
      noteHighlight: "تثبيت Caisty POS",
      noteAfter: "في بوابة العملاء.",
      mockTitle: "بوابة العملاء · التثبيت",
      previewBadge: "معاينة",
      platformWin: "Windows",
      platformLinux: "Linux قريباً",
      platformMac: "macOS قريباً",
      downloadHint: "تفاصيل التحميل تظهر في البوابة بعد تسجيل الدخول — وليس على هذا الموقع العلني.",
      smallDownload: "تحميل",
      smallInstall: "تثبيت",
      smallLicense: "ربط الترخيص",
    },
    fiscal: {
      title: "معلومات ضريبية واستخدام دولي",
      lead:
        "يوفر Caisty حالياً وضع نقاط بيع عاماً دون تخصيص ضريبي معتمد. يُستخدم هذا الوضع فقط حيث يسمح القانون المحلي. أمثلة على الوضع العام (غير شاملة):",
      countries: [
        "هولندا (EUR)",
        "أيرلندا (EUR)",
        "سويسرا (CHF)",
        "المملكة المتحدة (GBP)",
        "التشيك (CZK)",
        "تونس (TND)",
        "المغرب (MAD)",
        "الجزائر (DZD)",
        "ليبيا (LYD)",
      ],
      strict:
        "في البلدان ذات متطلبات ضريبية صارمة مثل ألمانيا والنمسا وإيطاليا وفرنسا وإسبانيا والبرتغال قد تُطلب أجهزة أو برمجيات معتمدة. لا تستخدم Caisty في هذه الأسواق إلا بعد توفر الوحدة الضريبية المطلوبة والموافقة القانونية. تأكد دائماً من المتطلبات مع مستشارك الضريبي أو الجهة المختصة.",
      disclaimer:
        "يساعد Caisty على الإيصالات والدفاتر والتصدير، ولا يغني عن استشارة قانونية أو ضريبية.",
    },
    demo: {
      sectionTitle: "لقطات POS",
      videoAria: "تشغيل فيديو المنتج",
      closeLabel: "إغلاق",
      clickOutside: "انقر خارج الصورة للإغلاق",
      shotDashboard: "الإدارة",
      shotPos: "شاشة الكاشير",
      shotPortal: "بوابة العملاء",
    },
    portalBand: {
      title: "بوابة العملاء (مشمولة)",
      description: "التراخيص والأجهزة والفواتير والمثبتات في مكان واحد — إدارة أقل ووقت أكثر في الصالة.",
      bullets: [
        "تجارب وترقيات ومفاتيح ترخيص",
        "نظرة عامة على الأجهزة والتثبيت",
        "الفواتير وطرق الدفع",
      ],
    },
    faq: {
      title: "الأسئلة الشائعة",
      items: [
        {
          q: "هل Caisty نقاط بيع أم بوابة سحابية فقط؟",
          a: "الأولوية للـ POS: الكاشير والطلبات والطاولات والطابعات. تدعم البوابة السحابية التراخيص والأجهزة والفوترة.",
        },
        {
          q: "هل أبدأ دون بيانات دفع؟",
          a: "نعم. التجربة مجانية 3 أيام مع ميزات Starter على جهاز واحد.",
        },
        {
          q: "أين أحمّل تطبيق نقاط البيع؟",
          a: "بعد التسجيل، افتح بوابة العملاء ثم «تثبيت Caisty POS» للمثبت الرسمي.",
        },
        {
          q: "هل يستبدل Caisty أجهزة تخصيص ضريبي معتمدة؟",
          a: "يوفر Caisty وضع POS عاماً. تأكد دائماً من القواعد المحلية مع مستشارك.",
        },
      ],
    },
  },
};

export type LandingCopy = TranslationSchema<(typeof landingLocales)["en"]>;
export const landing: Record<Language, LandingCopy> = landingLocales;
