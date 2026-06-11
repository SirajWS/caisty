// Tunisia subdomain — French only (tn.caisty.com/company)
import type { CompanyCopy } from "./company";
import { TECH_STACK_ICONS } from "./common";

export const companyTn: CompanyCopy = {
  hero: {
    badge: "Caisty",
    headline: "Logiciels métier pour les entreprises modernes.",
    subtitle:
      "Nous créons des logiciels métier modernes qui aident les restaurants, les commerces de détail et les équipes en croissance à piloter leurs opérations plus efficacement. Caisty POS est disponible en Tunisie.",
    subtitleSecondary:
      "Des systèmes de caisse à la gestion des équipes, nos produits sont pensés pour être fiables, évolutifs et simples à utiliser.",
    ctaExplore: "Découvrir Caisty POS",
    ctaContact: "Nous contacter",
  },
  mock: {
    caption: "Suite produits",
    liveBadge: "Plateforme",
    items: ["Caisty POS", "ShiftIQ", "Portail cloud", "Licences", "Factures", "Appareils"],
    footerNote: "Nous développons nos propres produits logiciels — pas une agence web.",
  },
  stats: {
    cards: [
      { stat: "2", label: "Produits" },
      { stat: "1", label: "Plateforme" },
      { stat: "4", label: "Langues" },
      { stat: "—", label: "Cloud" },
    ],
  },
  products: {
    title: "Nos produits",
    statusAvailableNow: "Disponible",
    statusComingSoon: "Bientôt disponible",
    pos: {
      name: "Caisty POS",
      description:
        "Logiciel de caisse cloud moderne pour cafés, restaurants, snacks et commerces — disponible en Tunisie, tarifs en TND sur ce site.",
      features: [
        "Encaissement rapide",
        "Commandes et produits",
        "Impression des tickets",
        "Portail cloud",
        "Factures et licences",
      ],
      ctaLearn: "Ouvrir Caisty POS",
    },
    shiftiq: {
      name: "ShiftIQ",
      description:
        "Gestion des équipes et suivi du temps de travail pour les organisations modernes.",
      features: [
        "Suivi du temps",
        "Planification des shifts",
        "Pointage employés",
        "Gestion d’équipe",
        "Rapports",
      ],
      ctaDisabled: "Bientôt disponible",
    },
  },
  whyChoose: {
    title: "Pourquoi les entreprises choisissent Caisty",
    points: [
      "Logiciels fiables",
      "Architecture offline-first",
      "Portail de gestion cloud",
      "Support multilingue",
      "Support multidevise",
      "Conçu pour les opérations réelles",
    ],
  },
  technology: {
    title: "Stack technologique",
    stack: TECH_STACK_ICONS,
  },
  building: {
    title: "Ce que nous construisons",
    posTitle: "Caisty POS",
    posSub: "Disponible aujourd’hui",
    posItems: [
      "Caisty POS (disponible en Tunisie)",
      "Commandes",
      "Stocks",
      "Licences",
      "Appareils",
      "Portail cloud",
    ],
    shiftiqTitle: "ShiftIQ",
    shiftiqSub: "Bientôt disponible",
    shiftiqItems: [
      "Suivi du temps",
      "Planification des shifts",
      "Gestion des employés",
      "Présences",
      "Rapports",
    ],
  },
  contactCta: {
    headline: "Construisons de meilleurs logiciels métier.",
    body: "Intéressé par Caisty POS ou les futurs produits Caisty ? Contactez-nous et parlons-en.",
    ctaStart: "Commencer gratuitement",
    ctaContact: "Nous contacter",
  },
};
