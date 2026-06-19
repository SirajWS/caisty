// Landing Page Übersetzungen — Reihenfolge Sprachen: en, fr, de, ar
import type { Language } from "./types";
import type { TranslationSchema } from "./types";

const landingLocales = {
  en: {
    hero: {
      badge: "Caisty POS — restaurants, cafés & retail",
      title: "Modern POS software for restaurants, cafés and small shops.",
      description:
        "Run sales, orders, tables, inventory, reporting and staff workflows from one touchscreen-first interface—professional depth without the enterprise stack. Optimised for fast training; plus a clear cloud portal for licenses, devices and invoices when you need them.",
      ctaPrimary: "Start free",
      ctaSecondary: "View pricing",
      trialTrust: "Start with a free 3-day trial. No payment details required.",
      tagline: "Fast. Modern. Reliable.",
      taglineLead:
        "The simplicity of a classic till—with modern cloud tools so you can focus on customers and growth.",
    },
    preview: {
      title: "Everything in one solution",
      caption: "POS-first",
      items: [
        "Modern touchscreen POS",
        "PIN login for cashiers & admins",
        "Table management & orders",
        "Queue & ticket system",
        "Products, categories & daily close",
        "Inventory, stock & waste / loss",
        "Multi-language UI · dark & light themes",
        "Cloud, licenses & offline with automatic sync",
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
        "Caisty pairs ease of use with capabilities you often only see in much more expensive stacks—built for real service pressure, with offline-friendly operation and intelligent sync when you reconnect.",
      feature1Title: "Fast to start",
      feature1Text:
        "Create your account, activate your license and connect your device without a long setup process.",
      feature2Title: "Clear overview",
      feature2Text: "See active licenses, connected devices and invoices from one simple portal.",
      feature3Title: "Simple pricing",
      feature3Text: "Start small and upgrade later when your business grows.",
      feature4Title: "Staff-ready",
      feature4Text: "Straightforward permissions and daily workflows so teams stay fast at the counter.",
      feature5Title: "Inventory & loss control",
      feature5Text:
        "Track stock movements and waste so everyday shrinkage is visible—not buried in a separate spreadsheet.",
      feature6Title: "Offline-first checkout",
      feature6Text:
        "Keep selling when connectivity is weak or down; changes sync automatically once you are back online.",
    },
    forWhom: {
      title: "Built for daily business",
      target1Title: "Take-away & street food",
      target1Text: "Fast orders, simple workflows and a POS experience focused on speed.",
      target2Title: "Bars & cafés",
      target2Text: "Flexible products, clear daily reports and easy device management.",
      target3Title: "Small shops",
      target3Text: "Checkout, receipts and basic reporting in one simple system.",
      target4Title: "Fast food & bakeries",
      target4Text:
        "High-volume counters and bakery-style assortments—same responsive UI for crews, less training overhead.",
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
        priceLine: "14.99 € / month",
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
        priceLine: "24.99 € / month",
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
      carouselPrev: "Previous screenshot",
      carouselNext: "Next screenshot",
      closeLabel: "Close",
      clickOutside: "Click outside the image to close",
      shotPosDarkMode: "Caisty POS — dark mode checkout",
      shotDashboard: "Back office",
      shotPos: "POS checkout",
      shotPortal: "Customer portal",
      shotAdminPin: "POS — admin PIN at the till",
      shotProductMgmt: "Product management",
      shotCashierLogin: "Cashier PIN login",
      shotQueueTicket: "Queue ticket",
      shotAdminPinsSettings: "Admin & register PIN settings",
      shotRegister: "Customer portal — create account",
      scrollStripHint:
        "Choose a thumbnail below or use the arrows on the large preview. Click the preview to open it full size.",
      mainStageZoomAria: "Open this screenshot at full size",
      thumbStripLabel: "Screenshot thumbnails",
      thumbStripScrollPrev: "Scroll thumbnails left",
      thumbStripScrollNext: "Scroll thumbnails right",
    },
    portalBand: {
      title: "Customer portal (included)",
      description:
        "Licenses, devices, invoices and installers live in one hub — less admin, more time on the floor.",
      bullets: [
        "Trials, upgrades and license keys",
        "Device overview and installs",
        "Invoices and payment methods",
        "Designed to scale from one counter to multiple sites and devices",
      ],
    },
    howItWorksProbe: {
      title: "How it works",
      steps: [
        "Create your Caisty account",
        "Activate your license in the customer portal",
        "Install Caisty POS on your till PC",
        "Open a shift and start selling",
      ],
    },
    hardwareProbe: {
      title: "Hardware support",
      intro:
        "Caisty targets common restaurant and retail peripherals — see portal documentation for supported models where applicable.",
      items: [
        "Receipt printers (80 mm, ESC/POS)",
        "USB / serial barcode scanners",
        "Touchscreen PCs or Windows kiosk setups",
        "Cash drawers (via printer pulse)",
        "Kitchen and bar printers",
      ],
    },
    compareProbe: {
      title: "Caisty vs. a typical legacy stack",
      intro: "Illustrative summary only — your rollout depends on hardware, channels and local regulations.",
      colFeature: "Capability",
      colLegacy: "Typical legacy POS",
      colCaisty: "Caisty",
      disclaimer: "Confirm fiscal, ticketing and payment rules for your country before going live.",
      rows: [
        { feature: "Offline-first checkout", legacy: "Varies widely", caisty: "Core product focus" },
        { feature: "License & device hub", legacy: "Often scattered tools", caisty: "Central customer portal" },
        { feature: "Multi-language POS UI", legacy: "Often limited", caisty: "Broad language coverage" },
        { feature: "Multi-currency support", legacy: "Often limited", caisty: "Supported for operations" },
        { feature: "Modern touch-first UI", legacy: "Mixed generations", caisty: "Designed for counter speed" },
        {
          feature: "Inventory, stock & waste/loss",
          legacy: "Often a separate tool",
          caisty: "Part of day-to-day POS flows",
        },
        {
          feature: "Offline sessions with sync",
          legacy: "Uneven or manual",
          caisty: "Resume online; data catches up automatically",
        },
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
        {
          q: "Does Caisty work offline?",
          a: "Yes—continue checkout when connectivity is weak or unavailable, then sync when the link returns.",
        },
        {
          q: "Can I manage stock and waste in Caisty?",
          a: "Stock and waste/loss tracking is built for operational use alongside sales, orders and reporting.",
        },
      ],
    },
  },
  fr: {
    hero: {
      badge: "Caisty POS — restaurants, cafés & commerce",
      title: "Logiciel de caisse moderne pour restaurants, cafés et petits commerces.",
      description:
        "Gérez ventes, commandes, tables, inventaire, rapports et équipes depuis une interface tactile unique—des fonctions pro sans la complexité d’une suite enterprise. Idéal pour une prise en main rapide ; plus un portail cloud clair pour licences, appareils et factures.",
      ctaPrimary: "Commencer gratuitement",
      ctaSecondary: "Voir les tarifs",
      trialTrust: "Commencez avec un essai gratuit de 3 jours. Aucun moyen de paiement requis.",
      tagline: "Rapide. Moderne. Fiable.",
      taglineLead:
        "La simplicité d’une caisse classique — avec le cloud pour licences, appareils et croissance quand vous en avez besoin.",
    },
    preview: {
      title: "Tout-en-un",
      caption: "Priorité POS",
      items: [
        "Caisse tactile moderne",
        "Connexion PIN caissiers & admins",
        "Tables & commandes",
        "File d’attente & tickets",
        "Produits, catégories & clôture du jour",
        "Stocks, inventaire & pertes / gaspillage",
        "Interface multilingue · thèmes clair & sombre",
        "Cloud, licences & hors ligne avec synchro auto",
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
        "Caisty allie simplicité d’usage et fonctions qu’on trouve souvent dans des solutions bien plus chères—pensé pour le rush du service, avec mode hors ligne et synchro intelligente au retour du réseau.",
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
      feature5Title: "Stocks & pertes",
      feature5Text:
        "Suivez mouvements de stock et gaspillage pour que les écarts du quotidien restent visibles — pas noyés dans un tableur.",
      feature6Title: "Caisse hors ligne",
      feature6Text:
        "Continuez à encaisser si la connexion faiblit ou tombe ; les données se synchronisent quand le réseau revient.",
    },
    forWhom: {
      title: "Pensé pour le quotidien",
      target1Title: "À emporter & street food",
      target1Text: "Commandes rapides, parcours simples et expérience POS axée sur la vitesse.",
      target2Title: "Bars & cafés",
      target2Text: "Produits flexibles, rapports du jour clairs et gestion d’appareils facile.",
      target3Title: "Petits commerces",
      target3Text: "Encaissement, tickets et reporting de base dans un système simple.",
      target4Title: "Fast-food & boulangeries",
      target4Text:
        "Comptoirs à fort débit et assortiments type boulangerie—même interface réactive, moins de temps de formation.",
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
        priceLine: "14,99 € / mois",
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
        priceLine: "24,99 € / mois",
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
      carouselPrev: "Capture précédente",
      carouselNext: "Capture suivante",
      closeLabel: "Fermer",
      clickOutside: "Cliquez en dehors de l’image pour fermer",
      shotPosDarkMode: "Caisty POS — caisse (mode sombre)",
      shotDashboard: "Back-office",
      shotPos: "Caisse POS",
      shotPortal: "Portail client",
      shotAdminPin: "POS — code admin à la caisse",
      shotProductMgmt: "Gestion des produits",
      shotCashierLogin: "Connexion caissier (PIN)",
      shotQueueTicket: "Ticket de file d’attente",
      shotAdminPinsSettings: "PIN admin & caisses",
      shotRegister: "Portail client — création de compte",
      scrollStripHint:
        "Choisissez une miniature ci-dessous ou utilisez les flèches sur la grande prévisualisation. Cliquez sur l’aperçu pour l’agrandir.",
      mainStageZoomAria: "Ouvrir cette capture en grand",
      thumbStripLabel: "Miniatures des captures",
      thumbStripScrollPrev: "Faire défiler les miniatures vers la gauche",
      thumbStripScrollNext: "Faire défiler les miniatures vers la droite",
    },
    portalBand: {
      title: "Portail client (inclus)",
      description:
        "Licences, appareils, factures et installateurs au même endroit — moins d’admin, plus de temps en salle.",
      bullets: [
        "Essais, mises à niveau et clés de licence",
        "Vue appareils et installations",
        "Factures et moyens de paiement",
        "Évolue d’une caisse à plusieurs sites et appareils",
      ],
    },
    howItWorksProbe: {
      title: "Comment ça marche",
      steps: [
        "Créer votre compte Caisty",
        "Activer votre licence dans le portail client",
        "Installer Caisty POS sur votre PC de caisse",
        "Ouvrir un service et encaisser",
      ],
    },
    hardwareProbe: {
      title: "Compatibilité matérielle",
      intro:
        "Caisty vise les périphériques courants en restauration et commerce — consultez la documentation du portail pour les modèles pris en charge.",
      items: [
        "Imprimantes tickets (80 mm, ESC/POS)",
        "Douchettes USB / série",
        "PC tactiles ou kiosques Windows",
        "Tiroirs-caisses (impulsion via imprimante)",
        "Imprimantes cuisine / bar",
      ],
    },
    compareProbe: {
      title: "Caisty face à une stack POS classique",
      intro: "Vue d’ensemble illustrative — votre déploiement dépend du matériel, des canaux et de la réglementation locale.",
      colFeature: "Critère",
      colLegacy: "POS classique typique",
      colCaisty: "Caisty",
      disclaimer: "Validez toujours fiscalité, tickets et paiements pour votre pays avant la mise en production.",
      rows: [
        { feature: "Caisse avec mode hors ligne", legacy: "Très variable", caisty: "Priorité produit" },
        { feature: "Hub licences & appareils", legacy: "Souvent dispersé", caisty: "Portail client central" },
        { feature: "Interface POS multilingue", legacy: "Souvent limitée", caisty: "Large couverture" },
        { feature: "Multi-devises", legacy: "Souvent limité", caisty: "Pris en charge pour l’exploitation" },
        { feature: "Interface tactile moderne", legacy: "Générations mixtes", caisty: "Pensée pour la vitesse au comptoir" },
        {
          feature: "Stocks, inventaire & pertes",
          legacy: "Souvent un autre outil",
          caisty: "Intégré aux flux POS du quotidien",
        },
        {
          feature: "Sessions hors ligne & synchro",
          legacy: "Inégal ou manuel",
          caisty: "Retour en ligne : rattrapage automatique",
        },
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
        {
          q: "Caisty fonctionne-t-il hors ligne ?",
          a: "Oui — poursuivez la vente si la connexion est faible ou coupée, puis synchronisez au retour du réseau.",
        },
        {
          q: "Puis-je gérer stocks et gaspillage dans Caisty ?",
          a: "Le suivi des stocks et des pertes est pensé pour l’exploitation, avec ventes, commandes et rapports.",
        },
      ],
    },
  },
  de: {
    hero: {
      badge: "Caisty POS — Gastronomie, Einzelhandel & mehr",
      title: "Die moderne Kassensoftware für Gastronomie und Einzelhandel.",
      description:
        "Für Restaurants, Cafés, Fast Food, Bäckereien und den Einzelhandel: Verkauf, Bestellungen, Tische, Inventar und Auswertungen in einer Oberfläche — für Touchscreens optimiert, schnell erlernbar ohne lange Schulungen, dazu Cloud-Portal für Lizenzen, Geräte und Rechnungen.",
      ctaPrimary: "Kostenlos starten",
      ctaSecondary: "Preise ansehen",
      trialTrust: "Starte mit einer kostenlosen 3-Tage-Testphase. Keine Zahlungsdaten nötig.",
      tagline: "Schnell. Modern. Zuverlässig.",
      taglineLead:
        "Die Einfachheit einer klassischen Kasse — mit Cloud-Tools für Lizenzen, Geräte und Wachstum, wenn du sie brauchst.",
    },
    preview: {
      title: "Alles in einer Lösung",
      caption: "POS zuerst",
      items: [
        "Moderne Touch-POS-Kasse",
        "PIN-Login für Kassierer & Administratoren",
        "Tischverwaltung & Bestellungen",
        "Warteschlange & Ticketsystem",
        "Produkte, Kategorien & Tagesabschlüsse",
        "Inventar, Bestand & Schwund (Waste)",
        "Mehrsprachige Oberfläche · Hell- & Dunkelmodus",
        "Cloud, Lizenzen & Offline mit automatischer Synchronisation",
      ],
      liveBadge: "Live-Session",
      demoBadge: "Demo",
      devicesOnline: "2 Kassen · 1 Drucker online",
      quote:
        "„Schnell an der Theke, verständlich fürs Team — und wir bleiben auch ohne stabiles WLAN verkaufsfähig.“ – fiktives Bistro",
    },
    why: {
      title: "Warum Caisty?",
      description:
        "Caisty verbindet einfache Bedienung mit Funktionen, die oft erst in deutlich teureren Systemen vorkommen — entwickelt für den echten Arbeitsalltag mit lokaler Performance und intelligenter Offline-Synchronisation.",
      feature1Title: "Schnell startklar",
      feature1Text:
        "Konto anlegen, Lizenz aktivieren, Gerät verbinden — ohne lange Einrichtungsphase.",
      feature2Title: "Klare Übersicht",
      feature2Text:
        "Aktive Lizenzen, verbundene Geräte und Rechnungen in einem einfachen Portal.",
      feature3Title: "Einfache Preise",
      feature3Text: "Klein starten und später upgraden, wenn Ihr Geschäft wächst.",
      feature4Title: "Team-tauglich",
      feature4Text:
        "Klare Berechtigungen und Abläufe für Schichtbetrieb — damit die Kasse im Stress zuverlässig bleibt.",
      feature5Title: "Bestand & Schwund",
      feature5Text:
        "Lagerbewegungen und Verluste im Blick — statt verstreuter Tabellenblätter neben der Kasse.",
      feature6Title: "Offline-Kasse mit Sync",
      feature6Text:
        "Weiterverkaufen bei schwachem oder fehlendem Netz; danach automatische Synchronisation, sobald die Verbindung steht.",
    },
    forWhom: {
      title: "Für den täglichen Betrieb gemacht",
      target1Title: "Fast Food & Take-away",
      target1Text: "Schnelle Bestellungen, Tickets und ein POS, das Tempo und Warteschlangen mitdenkt.",
      target2Title: "Bars, Cafés & Restaurants",
      target2Text: "Tische, flexible Artikel, Küchendruck und klare Tagesauswertungen.",
      target3Title: "Bäckereien & Einzelhandel",
      target3Text: "Kasse, Belege, Basis-Reporting und Inventar in einem schlanken System — skalierbar für mehrere Standorte.",
      target4Title: "Skalierung & mehrere Standorte",
      target4Text:
        "Von einer Kasse bis zu Filialen und mehreren Geräten — Lizenzen und Gerätemanagement im gleichen Portal.",
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
        priceLine: "14,99 € / Monat",
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
        priceLine: "24,99 € / Monat",
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
      carouselPrev: "Vorheriges Bild",
      carouselNext: "Nächstes Bild",
      closeLabel: "Schließen",
      clickOutside: "Zum Schließen außerhalb des Bildes klicken",
      shotPosDarkMode: "Caisty POS — Kasse im Dark Mode",
      shotDashboard: "Backoffice",
      shotPos: "POS-Kasse",
      shotPortal: "Kundenportal",
      shotAdminPin: "POS — Admin-PIN an der Kasse",
      shotProductMgmt: "Produktverwaltung",
      shotCashierLogin: "Kassen-Login (PIN)",
      shotQueueTicket: "Warteschlangen-Ticket",
      shotAdminPinsSettings: "Admin- & Kassen-PINs",
      shotRegister: "Kundenportal — Konto anlegen",
      scrollStripHint:
        "Wählen Sie unten eine Miniatur oder nutzen Sie die Pfeile an der großen Vorschau. Klick auf die Vorschau öffnet sie groß.",
      mainStageZoomAria: "Diese Ansicht in groß öffnen",
      thumbStripLabel: "Miniatur-Ansichten",
      thumbStripScrollPrev: "Miniaturen nach links scrollen",
      thumbStripScrollNext: "Miniaturen nach rechts scrollen",
    },
    portalBand: {
      title: "Kundenportal (inklusive)",
      description:
        "Lizenzen, Geräte, Rechnungen und Installer an einem Ort — für einen Standort oder mehrere Kassen, mit weniger Verwaltung und mehr Zeit im Betrieb.",
      bullets: [
        "Tests, Upgrades und Lizenzschlüssel",
        "Geräteübersicht und Installationen",
        "Rechnungen und Zahlungsarten",
        "Skalierbar von einer Kasse bis zu mehreren Standorten und Geräten",
      ],
    },
    howItWorksProbe: {
      title: "So funktioniert’s",
      steps: [
        "Caisty-Konto anlegen",
        "Lizenz im Kundenportal aktivieren",
        "Caisty POS auf dem Kassen-PC installieren",
        "Schicht öffnen und verkaufen",
      ],
    },
    hardwareProbe: {
      title: "Hardware-Unterstützung",
      intro:
        "Caisty richtet sich an gängige Gastro- und Retail-Peripherie — unterstützte Modelle siehe Portaldokumentation.",
      items: [
        "Bondrucker (80 mm, ESC/POS)",
        "USB- / Serien-Barcodescanner",
        "Touch-PCs oder Windows-Kiosk-Setups",
        "Kassenschubladen (Impuls über Drucker)",
        "Küchen- und Barbondrucker",
      ],
    },
    compareProbe: {
      title: "Caisty vs. typische Legacy-Kasse",
      intro: "Illustrativer Vergleich — der Rollout hängt von Hardware, Kanälen und lokalen Vorschriften ab.",
      colFeature: "Kriterium",
      colLegacy: "Typische Legacy-POS",
      colCaisty: "Caisty",
      disclaimer: "Fiskal-, Beleg- und Zahlungsregeln vor Produktion immer lokal prüfen.",
      rows: [
        { feature: "Offline-fähige Kasse", legacy: "Sehr unterschiedlich", caisty: "Produktfokus" },
        { feature: "Lizenz- & Geräte-Hub", legacy: "Oft verstreut", caisty: "Zentrales Kundenportal" },
        { feature: "Mehrsprachige POS-Oberfläche", legacy: "Oft begrenzt", caisty: "Breite Abdeckung" },
        { feature: "Multi-Währung", legacy: "Oft begrenzt", caisty: "Für den Betrieb unterstützt" },
        { feature: "Moderne Touch-UI", legacy: "Gemischte Generationen", caisty: "Für Tempo an der Theke" },
        {
          feature: "Bestand, Lager & Schwund",
          legacy: "Oft separates Tool",
          caisty: "Teil der täglichen POS-Abläufe",
        },
        {
          feature: "Offline-Sitzungen mit Sync",
          legacy: "Uneinheitlich oder manuell",
          caisty: "Wieder online — Daten holen automatisch auf",
        },
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
        {
          q: "Funktioniert Caisty offline?",
          a: "Ja — du kannst bei schwacher oder fehlender Verbindung weiterverkaufen und später synchronisieren.",
        },
        {
          q: "Kann ich Bestand und Schwund in Caisty verwalten?",
          a: "Bestandsführung und Schwund sind für den Betrieb neben Verkauf, Bestellungen und Reporting vorgesehen.",
        },
      ],
    },
  },
  ar: {
    hero: {
      badge: "Caisty POS — مطاعم ومقاهٍ وتجزئة",
      title: "برنامج نقاط بيع حديث للمطاعم والمقاهي والمتاجر الصغيرة.",
      description:
        "أدرِ المبيعات والطلبات والطاولات والمخزون والتقارير وعمليات الموظفين من واجهة واحدة مُحسّنة للمس—بعمق احترافي دون تعقيد حلول المؤسسات. مناسب للتدريب السريع؛ مع بوابة سحابية واضحة للتراخيص والأجهزة والفواتير.",
      ctaPrimary: "ابدأ مجاناً",
      ctaSecondary: "عرض الأسعار",
      trialTrust: "ابدأ بتجربة مجانية لمدة 3 أيام. دون بيانات دفع.",
      tagline: "سريع. حديث. موثوق.",
      taglineLead: "بساطة الصندوق التقليدي—مع أدوات سحابية للتراخيص والأجهزة والنمو عند الحاجة.",
    },
    preview: {
      title: "كل شيء في حل واحد",
      caption: "الأولوية للـ POS",
      items: [
        "نقاط بيع حديثة باللمس",
        "دخول برمز PIN للكاشير والمسؤولين",
        "إدارة الطاولات والطلبات",
        "طابور وتذاكر",
        "المنتجات والفئات وإغلاق اليوم",
        "المخزون والتتبع والهدر/الخسائر",
        "واجهة متعددة اللغات · وضع فاتح وداكن",
        "سحابة وتراخيص ووضع دون اتصال مع مزامنة تلقائية",
      ],
      liveBadge: "جلسة مباشرة",
      demoBadge: "تجريبي",
      devicesOnline: "جهازان · طابعة واحدة متصلة",
      quote: "« نحتاج صندوقاً يتحمل زحمة الغداء — البوابة عند إغلاق اليوم. » — مقهى افتراضي",
    },
    why: {
      title: "لماذا Caisty؟",
      description:
        "يجمع Caisty سهولة الاستخدام مع ميزات غالباً ما تظهر في أنظمة أغلى بكثير—مصمم لضغط الخدمة الفعلي مع عمل دون اتصال ومزامنة ذكية عند عودة الشبكة.",
      feature1Title: "بدء سريع",
      feature1Text: "أنشئ حسابك، فعّل الترخيص وصِل جهازك دون إعداد طويل.",
      feature2Title: "نظرة واضحة",
      feature2Text: "اطلع على التراخيص النشطة والأجهزة المتصلة والفواتير من بوابة واحدة بسيطة.",
      feature3Title: "تسعير بسيط",
      feature3Text: "ابدأ صغيراً وقم بالترقية لاحقاً عند نمو عملك.",
      feature4Title: "جاهز للطاقم",
      feature4Text: "صلاحيات واضحة وسير عمل يومي للحفاظ على السرعة عند الكاشير.",
      feature5Title: "المخزون والخسائر",
      feature5Text:
        "تتبع حركات المخزون والهدر حتى تبقى الفروقات اليومية ظاهرة—لا تضيع في جداول منفصلة.",
      feature6Title: "كاشير يعمل دون اتصال",
      feature6Text:
        "تابع البيع عند ضعف الاتصال أو انقطاعه؛ تُزامن التغييرات تلقائياً عند عودة الشبكة.",
    },
    forWhom: {
      title: "مصمم للعمل اليومي",
      target1Title: "الوجبات الجاهزة والطعام الشارعي",
      target1Text: "طلبات سريعة وتدفقات بسيطة وتجربة نقاط بيع تركز على السرعة.",
      target2Title: "الحانات والمقاهي",
      target2Text: "منتجات مرنة وتقارير يومية واضحة وإدارة سهلة للأجهزة.",
      target3Title: "متاجر صغيرة",
      target3Text: "الدفع والإيصالات والتقارير الأساسية في نظام واحد بسيط.",
      target4Title: "وجبات سريعة ومخابز",
      target4Text:
        "كاونترات مزدحمة ومنتجات شبيهة بالمخابز—نفس واجهة سريعة للطاقم وتدريب أقل.",
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
        priceLine: "14.99 € / شهر",
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
        priceLine: "24.99 € / شهر",
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
      carouselPrev: "لقطة سابقة",
      carouselNext: "لقطة تالية",
      closeLabel: "إغلاق",
      clickOutside: "انقر خارج الصورة للإغلاق",
      shotPosDarkMode: "Caisty POS — وضع داكن في الكاشير",
      shotDashboard: "الإدارة",
      shotPos: "شاشة الكاشير",
      shotPortal: "بوابة العملاء",
      shotAdminPin: "نقاط البيع — رمز المسؤول عند الكاشير",
      shotProductMgmt: "إدارة المنتجات",
      shotCashierLogin: "تسجيل دخول الكاشير (رمز)",
      shotQueueTicket: "تذكرة الطابور",
      shotAdminPinsSettings: "إعدادات رمز المسؤول والكاشير",
      shotRegister: "بوابة العملاء — إنشاء حساب",
      scrollStripHint:
        "اختر صورة مصغّرة أدناه أو استخدم الأسهم على المعاينة الكبيرة. انقر المعاينة لفتحها بالحجم الكامل.",
      mainStageZoomAria: "فتح هذه اللقطة بالحجم الكامل",
      thumbStripLabel: "صور مصغّرة للقطات",
      thumbStripScrollPrev: "تمرير المصغّرات إلى اليسار",
      thumbStripScrollNext: "تمرير المصغّرات إلى اليمين",
    },
    portalBand: {
      title: "بوابة العملاء (مشمولة)",
      description: "التراخيص والأجهزة والفواتير والمثبتات في مكان واحد — إدارة أقل ووقت أكثر في الصالة.",
      bullets: [
        "تجارب وترقيات ومفاتيح ترخيص",
        "نظرة عامة على الأجهزة والتثبيت",
        "الفواتير وطرق الدفع",
        "مصمم للنمو من كاشير واحد إلى عدة مواقع وأجهزة",
      ],
    },
    howItWorksProbe: {
      title: "كيف يعمل",
      steps: [
        "أنشئ حساب Caisty",
        "فعّل الترخيص في بوابة العملاء",
        "ثبّت Caisty POS على جهاز الكاشير",
        "افتح وردية وابدأ البيع",
      ],
    },
    hardwareProbe: {
      title: "دعم الأجهزة",
      intro:
        "يركّز Caisty على ملحقات المطاعم والتجزئة الشائعة — راجع وثائق البوابة للطرازات المدعومة عند الحاجة.",
      items: [
        "طابعات الإيصالات (80 مم، ESC/POS)",
        "ماسحات الباركود USB / تسلسلي",
        "أجهزة تعمل باللمس أو إعدادات كشك Windows",
        "أدراج النقد (نبض عبر الطابعة)",
        "طابعات المطبخ والبار",
      ],
    },
    compareProbe: {
      title: "Caisty مقارنةً بكاشير تقليدي نموذجي",
      intro: "ملخص توضيحي فقط — يعتمد التشغيل على الأجهزة والقنوات والأنظمة المحلية.",
      colFeature: "النقطة",
      colLegacy: "نقاط بيع تقليدية نموذجية",
      colCaisty: "Caisty",
      disclaimer: "أكد قواعد الضرائب والإيصالات والدفع في بلدك قبل الإنتاج.",
      rows: [
        { feature: "كاشير يعمل دون اتصال", legacy: "يختلف كثيراً", caisty: "تركيز المنتج" },
        { feature: "مركز الترخيص والأجهزة", legacy: "غالباً مبعثر", caisty: "بوابة عملاء مركزية" },
        { feature: "واجهة POS متعددة اللغات", legacy: "غالباً محدودة", caisty: "تغطية واسعة" },
        { feature: "دعم عملات متعددة", legacy: "غالباً محدود", caisty: "مدعوم للتشغيل" },
        { feature: "واجهة لمس حديثة", legacy: "أجيال مختلطة", caisty: "مصممة لسرعة الكاشير" },
        {
          feature: "مخزون ومستودع وهدر/خسائر",
          legacy: "غالباً نظام منفصل",
          caisty: "جزء من تدفقات POS اليومية",
        },
        {
          feature: "جلسات دون اتصال مع مزامنة",
          legacy: "غير متسق أو يدوي",
          caisty: "عند عودة الشبكة تُحدَّث البيانات تلقائياً",
        },
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
        {
          q: "هل يعمل Caisty دون اتصال؟",
          a: "نعم — تابع البيع عند ضعف أو انقطاع الاتصال، ثم تُزامن البيانات عند عودة الشبكة.",
        },
        {
          q: "هل أدير المخزون والهدر في Caisty؟",
          a: "تتبع المخزون والهدر مدمج للتشغيل مع المبيعات والطلبات والتقارير.",
        },
      ],
    },
  },
};

export type LandingCopy = TranslationSchema<(typeof landingLocales)["en"]>;
export const landing: Record<Language, LandingCopy> = landingLocales;
