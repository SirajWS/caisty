// Tunisia subdomain — French only (tn.caisty.com)
import type { CompanyCopy } from "./company";

export const companyTn: CompanyCopy = {
  hero: {
    badge: "Cloud-native · Conçu en Allemagne",
    headline: "Caisse moderne et plateforme cloud pour la Tunisie.",
    subtitle:
      "Caisty réunit caisse tactile, portail client et infrastructure cloud dans un seul produit — fiable, sécurisé et adapté aux cafés, restaurants et commerces.",
    ctaExplore: "Découvrir Caisty POS",
    ctaRegister: "Commencer gratuitement",
  },
  trust: {
    title: "Pourquoi Caisty en Tunisie",
    subtitle: "Un produit pour le comptoir, l’administratif et le cloud.",
    points: [
      {
        title: "Caisse hors ligne",
        body: "Encaissez même si la connexion faiblit. Synchronisation automatique au retour du réseau.",
      },
      {
        title: "Portail client",
        body: "Licences, appareils et facturation dans un espace clair — moins de paperasse.",
      },
      {
        title: "Pensé pour le service",
        body: "Interface tactile rapide, multilingue et rapports utiles au quotidien.",
      },
      {
        title: "Sécurité cloud",
        body: "Configuration centralisée et liaison sécurisée des appareils.",
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
        body: "Caisse tactile pour cafés, restaurants et commerces — commandes, stocks et tickets.",
        cta: "Voir le produit",
      },
      {
        id: "portal",
        title: "Portail client",
        body: "Essais, licences, appareils et installation POS en self-service.",
        cta: "Commencer gratuitement",
      },
      {
        id: "cloud",
        title: "Plateforme Cloud",
        body: "Profils entreprise et synchro des appareils via Caisty Cloud.",
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
    subtitle: "Des outils modernes — du POS desktop à l’API cloud.",
  },
  cta: {
    headline: "Prêt à essayer Caisty POS ?",
    subline: "Essai gratuit 3 jours — sans engagement.",
    ctaExplore: "Découvrir Caisty POS",
    ctaRegister: "Commencer gratuitement",
  },
};
