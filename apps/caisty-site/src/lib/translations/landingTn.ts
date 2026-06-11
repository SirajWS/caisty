// Tunisia subdomain (tn.caisty.com) — French-only marketing copy, same shape as global `LandingCopy`.
import type { LandingCopy } from "./landing";

export const landingTn: LandingCopy = {
  hero: {
    badge: "Caisty POS · Tunisie",
    title: "Une caisse moderne pour cafés, restaurants et commerces en Tunisie.",
    description:
      "Encaissez rapidement, gérez vos produits, imprimez vos tickets et suivez vos ventes en temps réel — avec un portail cloud pour licences, appareils et facturation.",
    ctaPrimary: "Commencer gratuitement",
    ctaSecondary: "Demander une démo",
    trialTrust: "Essai gratuit 3 jours. Sans engagement. Passez à Starter ou Pro quand vous êtes prêt.",
  },
  preview: {
    title: "Au comptoir",
    caption: "Priorité caisse",
    items: [
      "Caisse tactile rapide",
      "Commandes & tables",
      "Impression cuisine / bar",
      "Tickets ESC/POS",
      "Suivi des ventes",
      "Portail : licences & appareils",
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
      "Une solution POS moderne, fiable et pensée pour les cafés, restaurants et commerces — avec un portail cloud clair pour l’administratif.",
    feature1Title: "Caisse tactile rapide",
    feature1Text: "Interface fluide pour encaisser vite, même aux heures de pointe.",
    feature2Title: "Impression tickets ESC/POS",
    feature2Text: "Tickets clairs pour la cuisine, le bar et le client — compatibles imprimantes courantes.",
    feature3Title: "Gestion des stocks",
    feature3Text: "Suivez vos produits et évitez les ruptures avec des mouvements simples.",
    feature4Title: "Rapports de ventes",
    feature4Text: "Vue en temps réel sur vos ventes pour décider vite, chaque jour.",
  },
  forWhom: {
    title: "Pour qui ?",
    target1Title: "Cafés & salons de thé",
    target1Text: "Cartes courtes, ventes rapides et tickets propres pour le service.",
    target2Title: "Restaurants & snacks",
    target2Text: "Commandes, tables et flux de caisse adaptés au service sur place et à emporter.",
    target3Title: "Commerces de proximité",
    target3Text: "Encaissement, inventaire léger et rapports pour piloter votre point de vente.",
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
    title: "Usage en Tunisie",
    lead:
      "Caisty propose un mode POS générique. Vérifiez toujours les obligations locales (facturation, conservation des données, fiscalité) avec un conseiller ou l’administration compétente avant la mise en production.",
    countries: ["Tunisie (TND)"],
    strict:
      "Les exigences peuvent évoluer. Caisty ne remplace pas un conseil juridique, comptable ou fiscal.",
    disclaimer:
      "Caisty aide pour les tickets, journaux et exports, mais ne remplace pas un professionnel du droit ou des impôts.",
  },
  demo: {
    sectionTitle: "Aperçu POS & portail",
    videoAria: "Lire la vidéo produit",
    closeLabel: "Fermer",
    clickOutside: "Cliquez en dehors de l’image pour fermer",
    shotDashboard: "Tableau de bord",
    shotPos: "Caisse POS",
    shotPortal: "Portail client",
  },
  portalBand: {
    title: "Portail client (inclus)",
    description:
      "Licences, appareils, factures et installateurs au même endroit — pour que vous restiez concentré sur la vente.",
    bullets: [
      "Essais, mises à niveau et clés de licence",
      "Vue des appareils et téléchargements",
      "Factures et moyens de paiement",
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
    ],
  },
};
