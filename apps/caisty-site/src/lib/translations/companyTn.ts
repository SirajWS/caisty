// Tunisia subdomain — French only (tn.caisty.com)
import type { CompanyCopy } from "./company";
import { TECH_STACK_ICONS } from "./common";

export const companyTn: CompanyCopy = {
  hero: {
    badge: "Caisty",
    headline: "Logiciels métier pour les entreprises modernes.",
    subtitle:
      "Nous développons des logiciels cloud, des plateformes SaaS et des solutions IA pour aider les entreprises à gagner en efficacité. En commençant par Caisty POS — disponible en Tunisie — et la suite de notre feuille de route.",
    ctaExplore: "Découvrir Caisty POS",
    ctaContact: "Nous contacter",
  },
  mock: {
    caption: "Suite produits",
    liveBadge: "Plateforme",
    items: ["Caisty POS", "WorkTrack", "Portail cloud", "Licences", "Factures", "Appareils"],
    footerNote: "Nous développons nos propres produits logiciels — pas une agence web.",
  },
  about: {
    title: "À propos de Caisty",
    paragraphs: [
      "Caisty est une société logicielle centrée sur le cloud, les plateformes SaaS, l’automatisation et les solutions métier assistées par l’IA.",
      "Nous créons des produits qui aident les entreprises à simplifier leurs opérations, à gagner en efficacité et à croître avec des technologies modernes.",
      "En commençant par Caisty POS pour l’hôtellerie-restauration et le commerce (disponible en Tunisie), notre feuille de route s’étend à la gestion des équipes, aux outils d’automatisation et aux futures solutions logicielles métier.",
      "Notre objectif est simple : des logiciels fiables, évolutifs et pratiques que les équipes aiment utiliser au quotidien.",
    ],
    highlights: [
      { title: "Notre feuille de route", body: "De Caisty POS aujourd’hui vers la gestion des équipes, l’automatisation et au-delà — nous livrons nos propres produits." },
      { title: "Conçu pour l’usage réel", body: "Des outils pour les opérations concrètes : moins de friction, des flux plus clairs, une logique du quotidien." },
      { title: "Pensé pour durer", body: "Des plateformes fiables et évolutives, pensées pour un usage quotidien — pas des projets jetables." },
    ],
  },
  products: {
    title: "Nos produits",
    statusAvailableNow: "Disponible",
    statusComingSoon: "Bientôt disponible",
    pos: {
      name: "Caisty POS",
      description:
        "Caisse cloud moderne pour cafés, restaurants, snacks et commerces — disponible en Tunisie, tarifs en TND sur ce site.",
      features: [
        "Encaissement rapide",
        "Commandes et produits",
        "Impression des tickets",
        "Portail cloud",
        "Factures et licences",
      ],
      ctaLearn: "Ouvrir Caisty POS",
    },
    worktrack: {
      name: "WorkTrack",
      description: "Gestion des équipes et suivi du temps pour les organisations en croissance.",
      features: ["Suivi du temps", "Planification des shifts", "Pointage employés", "Gestion d’équipe", "Rapports"],
      ctaDisabled: "Bientôt disponible",
    },
  },
  whatWeDo: {
    title: "Ce que nous faisons",
    subtitle: "Des plateformes cloud aux outils IA — des logiciels pensés pour les opérations réelles.",
    items: [
      {
        iconKey: "cloud",
        title: "SaaS & solutions cloud",
        description:
          "Développement et exploitation de plateformes logicielles cloud : scalables, fiables, accessibles partout.",
      },
      {
        iconKey: "monitor",
        title: "Logiciels métier",
        description:
          "POS, gestion des équipes, portails clients et outils opérationnels pour la restauration, le retail et les équipes qui grandissent.",
      },
      {
        iconKey: "bot",
        title: "IA & automatisation",
        description:
          "Outils IA et automatisation des flux pour réduire le travail manuel et éclairer les décisions.",
      },
      {
        iconKey: "smartphone",
        title: "Applications web & mobiles",
        description:
          "Applications web et mobiles et outils numériques adaptés à des besoins opérationnels précis.",
      },
    ],
  },
  whyChoose: {
    title: "Pourquoi les entreprises choisissent Caisty",
    points: [
      "Cloud — accès partout, sans installation locale lourde",
      "Prêt pour l’IA — conçu pour intégrer des fonctions intelligentes",
      "Automatisation — moins de tâches manuelles dans les opérations",
      "Multilingue — pensé pour un usage international",
      "Multidevise — prêt pour des marchés mondiaux",
      "Offline-first — fonctionne même sans connexion internet",
      "Infrastructure évolutive — grandit avec votre activité",
      "Conçu pour le terrain — par des personnes qui comprennent les opérations réelles",
    ],
  },
  roadmap: {
    title: "Feuille de route produit",
    subtitle: "Nous construisons bien plus qu’un système de caisse.",
    colProduct: "Produit",
    colStatus: "Statut",
    rows: [
      { product: "Caisty POS", status: "Disponible", variant: "available" },
      { product: "WorkTrack", status: "Bientôt disponible", variant: "soon" },
      { product: "Modules CRM futurs", status: "Planifié", variant: "planned" },
      { product: "Outils d’automatisation", status: "Planifié", variant: "planned" },
      { product: "Assistant IA métier", status: "En recherche", variant: "research" },
    ],
  },
  technology: {
    title: "Stack technologique",
    lead: "Construit avec des technologies modernes et éprouvées",
    stack: TECH_STACK_ICONS,
  },
  contactCta: {
    headline: "Construire la prochaine génération de logiciels métier.",
    body: "Du cloud et du SaaS à l’IA et à l’automatisation — Caisty développe des outils pour aider les entreprises à croître et à opérer plus efficacement.",
    ctaPrimary: "Découvrir Caisty POS",
    ctaSecondary: "Nous contacter",
  },
};
