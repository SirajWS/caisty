// Tunisia subdomain (tn.caisty.com) — French-only marketing copy, same shape as global `LandingCopy`.
import type { LandingCopy } from "./landing";

export const landingTn: LandingCopy = {
  hero: {
    badge: "Caisty POS · Tunisie",
    title: "Une caisse moderne pour cafés, restaurants et commerces en Tunisie.",
    description:
      "Encaissez rapidement, gérez produits, stocks, commandes et tables depuis une interface tactile — avec rapports utiles et un portail cloud pour licences, appareils et facturation.",
    ctaPrimary: "Commencer gratuitement",
    ctaSecondary: "Demander une démo",
    trialTrust: "Essai gratuit 3 jours. Sans engagement. Passez à Starter ou Pro quand vous êtes prêt.",
    tagline: "Rapide. Moderne. Fiable.",
    taglineLead:
      "La simplicité d’une caisse classique — avec le cloud pour licences, appareils et croissance quand vous en avez besoin.",
  },
  preview: {
    title: "Tout-en-un au comptoir",
    caption: "Priorité caisse",
    items: [
      "Caisse tactile moderne",
      "Connexion PIN caissiers & admins",
      "Commandes & tables",
      "File d’attente & tickets",
      "Produits, catégories & clôture du jour",
      "Stocks, inventaire & pertes / gaspillage",
      "Interface multilingue · thèmes clair & sombre",
      "Cloud, licences & hors ligne avec synchro auto",
    ],
    liveBadge: "Session active",
    demoBadge: "Démo",
    devicesOnline: "2 caisses · 1 imprimante",
    quote:
      "« Une caisse qui tient le rush du midi — et un portail simple pour clôturer la journée. » — café fictif",
  },
  why: {
    title: "Pourquoi Caisty en Tunisie ?",
    description:
      "Une solution POS moderne et fiable — simple à prendre en main, avec des fonctions pro et un portail cloud clair pour l’administratif.",
    feature1Title: "Caisse tactile rapide",
    feature1Text: "Interface fluide pour encaisser vite, même aux heures de pointe.",
    feature2Title: "Impression tickets ESC/POS",
    feature2Text: "Tickets clairs pour la cuisine, le bar et le client — compatibles imprimantes courantes.",
    feature3Title: "Gestion des stocks",
    feature3Text: "Suivez vos produits et évitez les ruptures avec des mouvements simples.",
    feature4Title: "Rapports de ventes",
    feature4Text: "Vue en temps réel sur vos ventes pour décider vite, chaque jour.",
    feature5Title: "Pertes & écarts",
    feature5Text:
      "Suivez gaspillage et écarts pour que le quotidien reste visible — pas noyé dans des fichiers à côté de la caisse.",
    feature6Title: "Caisse hors ligne",
    feature6Text:
      "Continuez à encaisser si la connexion faiblit ; synchronisation automatique au retour du réseau.",
  },
  bento: {
    title: "Pourquoi choisir Caisty",
    subtitle: "Des avantages concrets pour cafés, restaurants et commerces en Tunisie.",
    items: [
      {
        id: "offline",
        title: "Architecture offline-first",
        body: "Continuez à encaisser si la connexion faiblit ; synchronisation automatique au retour du réseau.",
      },
      {
        id: "verticals",
        title: "Pensé pour restauration & commerce",
        body: "Parcours tactiles pour service, cafés et commerces de proximité.",
      },
      {
        id: "portal",
        title: "Portail client cloud",
        body: "Licences, appareils, factures et installateurs dans un portail dédié.",
      },
      {
        id: "windows",
        title: "Application Windows de bureau",
        body: "Installateur natif pour PC caisse tactile au comptoir.",
      },
      {
        id: "i18n",
        title: "Support multilingue",
        body: "Interface en plusieurs langues avec thèmes clair et sombre.",
      },
      {
        id: "germany",
        title: "Développé en Allemagne",
        body: "Plateforme cloud-native conçue en Allemagne pour les entreprises européennes.",
      },
    ],
  },
  security: {
    title: "Sécurité de confiance",
    subtitle: "Protection des données, appareils et opérations quotidiennes.",
    items: [
      { title: "Sauvegardes cloud", body: "Données métier stockées dans le cloud, accessibles via le portail." },
      { title: "Connexions chiffrées", body: "Portail et services cloud en HTTPS chiffré." },
      { title: "PIN & droits par rôle", body: "PIN caissier et admin séparés avec droits adaptés." },
      { title: "Activation d’appareil", body: "Licences liées aux appareils activés via le portail." },
      { title: "Protection hors ligne", body: "Encaissez sans réseau ; synchro au retour en ligne." },
      { title: "Mises à jour automatiques", body: "Mises à jour POS via le flux d’installation du portail." },
    ],
  },
  supportedHardware: {
    title: "Matériel pris en charge",
    intro: "Compatible avec le matériel essentiel utilisé au comptoir.",
    items: ["PC tactiles", "Imprimante tickets 80 mm", "Tiroir-caisses"],
    note: "D’autres périphériques seront ajoutés progressivement.",
  },
  deployment: {
    title: "Du téléchargement à la vente en quelques minutes",
    subtitle: "Téléchargez Caisty POS depuis le portail, connectez votre licence et encaissez.",
    channels: [
      { title: "Bureau Windows", body: "Installateur Windows pour PC caisse tactile." },
      { title: "Portail client", body: "Licences, appareils, factures et installateurs en un hub." },
      { title: "Cloud", body: "Licences et appareils cloud avec synchronisation automatique." },
      { title: "Mode hors ligne", body: "Vente sans réseau fiable ; données à jour à la reconnexion." },
    ],
    platforms: [
      { label: "Windows", status: "available" as const },
      { label: "Linux bientôt", status: "soon" as const },
      { label: "macOS bientôt", status: "soon" as const },
    ],
    steps: [
      "Créer un compte et recevoir la licence d’essai",
      "Télécharger l’installateur depuis le portail",
      "Installer Caisty POS sur votre PC de caisse",
      "Connecter la clé de licence",
      "Commencer à vendre",
    ],
    noteBefore: "La page d’installation détaillée est disponible après connexion sous",
    noteHighlight: "Installer Caisty POS",
    noteAfter: "dans le portail client.",
  },
  cta: {
    headline: "Prêt à moderniser votre caisse ?",
    subline: "Essai gratuit 3 jours — sans engagement.",
    ctaPrimary: "Commencer gratuitement",
    ctaSecondary: "Demander une démo",
  },
  forWhom: {
    title: "Pour qui ?",
    target1Title: "Cafés & salons de thé",
    target1Text: "Cartes courtes, ventes rapides et tickets propres pour le service.",
    target2Title: "Restaurants & snacks",
    target2Text: "Commandes, tables et flux de caisse adaptés au service sur place et à emporter.",
    target3Title: "Commerces de proximité",
    target3Text: "Encaissement, inventaire léger et rapports pour piloter votre point de vente.",
    target4Title: "Fast-food & boulangeries",
    target4Text:
      "Comptoirs à fort débit et assortiments variés — même interface réactive, moins de temps de formation.",
  },
  plans: {
    title: "Tarifs (TND)",
    intro: "Commencez gratuitement, puis choisissez l’offre qui correspond à votre activité.",
    trial: {
      name: "Essai",
      badge: "Gratuit",
      priceLine: "0 TND",
      subline: "3 jours, 1 appareil",
      features: [
        "Fonctions Starter complètes",
        "Sans carte bancaire",
        "Idéal pour tester en conditions réelles",
      ],
    },
    starter: {
      name: "Starter",
      badge: "1 appareil",
      recommended: "Populaire",
      priceLine: "29 TND / mois",
      subline: "1 appareil inclus",
      features: ["1 appareil", "Tickets", "Rapports", "Support e-mail"],
    },
    pro: {
      name: "Pro",
      badge: "Multi-caisses",
      priceLine: "49 TND / mois",
      subline: "Jusqu’à 3 appareils",
      features: [
        "Multi-appareils",
        "Gestion stock",
        "Comptes employés",
        "Support prioritaire",
        "Mode hors ligne (app POS)",
      ],
    },
    business: {
      name: "Business",
      badge: "Appareils illimités",
      priceLine: "34,99 € / mois",
      subline: "Appareils POS illimités",
      features: [
        "Toutes les fonctionnalités de Pro",
        "Nombre illimité d’appareils POS actifs",
        "Gestion centralisée des appareils et des licences",
        "Rapports avancés et fonctions d’exportation",
        "Support prioritaire",
      ],
    },
    note:
      "Paiements locaux en Tunisie : activation progressive. Les tarifs sont indicatifs TND hors taxes le cas échéant. Contactez-nous pour une démo ou un devis.",
  },
  payment: {
    title: "Paiement & abonnement",
    description:
      "Nous activons progressivement des moyens de paiement adaptés à la Tunisie. En attendant, l’essai reste gratuit et l’équipe vous accompagne pour la mise en route.",
    paypal: {
      title: "PayPal (international)",
      description: "Disponible selon les comptes éligibles — utile pour les clients internationaux.",
    },
    stripe: {
      title: "Carte bancaire (Stripe)",
      description: "Paiement sécurisé par carte lorsque Stripe est activé sur votre compte.",
    },
    footnote:
      "Solutions locales (virement, mobile money, etc.) : contactez-nous pour connaître les options disponibles.",
  },
  install: {
    title: "Du téléchargement à la vente en quelques minutes",
    description:
      "Après inscription, téléchargez Caisty POS depuis le portail client, connectez votre clé de licence et encaissez.",
    steps: [
      "Créer un compte et recevoir la licence d’essai",
      "Télécharger l’installateur depuis le portail",
      "Installer Caisty POS sur votre PC de caisse",
      "Connecter la clé de licence",
      "Commencer à vendre",
    ],
    noteBefore: "La page d’installation détaillée est disponible après connexion sous",
    noteHighlight: "Installer Caisty POS",
    noteAfter: "dans le portail client.",
    mockTitle: "Portail client · Installation",
    previewBadge: "Aperçu",
    platformWin: "Windows",
    platformLinux: "Linux bientôt",
    platformMac: "macOS bientôt",
    downloadHint:
      "Les liens de téléchargement officiels apparaissent dans le portail après connexion.",
    smallDownload: "Téléchargement",
    smallInstall: "Installation",
    smallLicense: "Licence",
  },
  fiscal: {
    title: "Informations fiscales et exigences par pays",
    paragraphs: [
      "Caisty est actuellement en préparation pour une utilisation fiscale certifiée dans les pays aux exigences légales spécifiques.",
      "Tant que le module fiscal requis n’est pas disponible et activé pour un pays, Caisty ne doit être utilisé qu’en mode POS générique lorsque la loi locale le permet.",
      "Pour les pays à exigences fiscales strictes, comme l’Allemagne et d’autres marchés réglementés, un matériel ou logiciel fiscal certifié peut être exigé avant toute mise en service en conditions réelles.",
      "Vérifiez toujours les exigences locales avec votre conseiller fiscal ou l’administration compétente avant la mise en production.",
    ],
    disclaimer:
      "Caisty aide pour les tickets, journaux et exports, mais ne remplace pas un conseil juridique ou fiscal.",
  },
  demo: {
    sectionTitle: "Aperçu POS & portail",
    videoAria: "Lire la vidéo produit",
    carouselPrev: "Capture précédente",
    carouselNext: "Capture suivante",
    closeLabel: "Fermer",
    clickOutside: "Cliquez en dehors de l’image pour fermer",
    shotPosDarkMode: "Caisty POS — caisse (mode sombre)",
    shotDashboard: "Tableau de bord",
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
    heroImageAlt: "Écran de caisse Caisty POS — mode sombre",
    heroPlaceholderNote: "TODO : capture POS finale",
    portalDashboardNote: "TODO : capture tableau de bord portail finale",
  },
  portalBand: {
    title: "Portail client (inclus)",
    description:
      "Licences, appareils, factures et installateurs au même endroit — pour que vous restiez concentré sur la vente.",
    bullets: [
      "Essais, mises à niveau et clés de licence",
      "Vue des appareils et téléchargements",
      "Factures et moyens de paiement",
      "Évolue d’une caisse à plusieurs appareils et points de vente",
    ],
  },
  howItWorksProbe: {
    title: "Comment ça marche",
    steps: [
      "Créer votre compte Caisty",
      "Activer votre licence dans le portail",
      "Installer Caisty POS sur votre PC de caisse",
      "Ouvrir un service et encaisser",
    ],
  },
  hardwareProbe: {
    title: "Compatibilité matérielle",
    intro:
      "Caisty cible les périphériques courants en restauration et commerce — voir la documentation du portail pour les modèles pris en charge.",
    items: [
      "Imprimantes tickets (80 mm, ESC/POS)",
      "Douchettes USB / série",
      "PC tactiles ou kiosques Windows",
      "Tiroirs-caisses (impulsion via imprimante)",
      "Imprimantes cuisine / bar",
    ],
  },
  compareProbe: {
    title: "Caisty vs. une caisse classique",
    intro: "Comparaison indicative — le déploiement dépend du matériel, des canaux et de la réglementation locale.",
    colFeature: "Critère",
    colLegacy: "POS classique typique",
    colCaisty: "Caisty",
    disclaimer: "Validez fiscalité, tickets et paiements avant la mise en production.",
    rows: [
      { feature: "Caisse avec mode hors ligne", legacy: "Très variable", caisty: "Priorité produit" },
      { feature: "Hub licences & appareils", legacy: "Souvent dispersé", caisty: "Portail central" },
      { feature: "Interface multilingue", legacy: "Souvent limitée", caisty: "Large couverture" },
      { feature: "Multi-devises", legacy: "Souvent limité", caisty: "Pris en charge" },
      { feature: "Interface tactile moderne", legacy: "Générations mixtes", caisty: "Pensée pour le comptoir" },
      {
        feature: "Stocks, inventaire & pertes",
        legacy: "Souvent un autre outil",
        caisty: "Intégré aux flux quotidiens",
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
        q: "Caisty remplace-t-il ma caisse enregistreuse actuelle ?",
        a: "Caisty POS tourne sur PC Windows (Linux/macOS à venir). Vous gardez votre matériel compatible (tactile, imprimante ESC/POS) dans la mesure du support actuel.",
      },
      {
        q: "Puis-je essayer sans payer ?",
        a: "Oui : essai gratuit 3 jours avec les fonctions Starter sur un appareil, sans carte bancaire.",
      },
      {
        q: "Le portail sert à quoi ?",
        a: "À gérer licences, téléchargements, appareils et facturation — la vente se fait sur l’app POS.",
      },
      {
        q: "Comment demander une démo ?",
        a: "Utilisez le bouton « Demander une démo » ou écrivez à info@caisty.com — nous répondons rapidement.",
      },
      {
        q: "Caisty fonctionne-t-il hors ligne ?",
        a: "Oui — poursuivez la vente si la connexion est instable, puis synchronisez au retour du réseau.",
      },
      {
        q: "Puis-je suivre stocks et pertes ?",
        a: "Oui : mouvements de stock et pertes sont pensés pour l’exploitation au quotidien, avec les ventes et rapports.",
      },
    ],
  },
};
