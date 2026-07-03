import { legalContact } from "../shared/contact";
import { legalLinkLabels, legalRelatedLabels } from "../shared/labels";
import type { TermsCopy } from "./types";

export const termsFr: TermsCopy = {
  documentLabel: "Mentions légales",
  title: "Conditions générales",
  lastUpdatedLabel: "Dernière mise à jour",
  effectiveDate: "1er juillet 2026",
  intro:
    "Les présentes conditions générales régissent la relation contractuelle entre Caisty et les clients qui utilisent ou souscrivent à nos logiciels, services cloud et portail client. Elles font partie du cadre juridique de Caisty et doivent être lues conjointement avec la {{privacy}}, la {{cookie}}, le {{eula}}, le {{dpa}} et les {{imprint}}.",
  linkLabels: legalLinkLabels.fr,
  emphasis: {
    licensedNotSold: "concédé sous licence, non vendu",
    commercialEfforts: "efforts commercialement raisonnables",
  },
  sections: [
    {
      title: "1. Champ d'application",
      paragraphs: [
        "Les présentes conditions s'appliquent à tous les contrats et relations d'utilisation entre Caisty, représentée par Siraj Bettaieb, Mollwitzstraße 5A, 14059 Berlin, Allemagne (ci-après « Caisty », « nous » ou « Prestataire »), et les personnes physiques ou morales qui utilisent nos services (ci-après « Client » ou « vous »).",
        "Elles s'appliquent à l'acquisition, l'abonnement, la licence et l'utilisation du logiciel Caisty POS, du portail client, des services cloud associés ainsi que d'autres produits et services numériques proposés par Caisty.",
        "Les conditions divergentes ou complémentaires du Client ne s'appliquent que si Caisty en a expressément accepté l'application par écrit. En vous inscrivant, en commandant, en souscrivant un abonnement, en installant ou en utilisant les services, vous acceptez les présentes conditions.",
      ],
    },
    {
      title: "2. Objet du contrat",
      paragraphs: [
        "Caisty fournit notamment les services suivants :",
        "L'étendue, les fonctionnalités et la disponibilité des services dépendent de l'abonnement souscrit, de la description produit en vigueur sur le site web ou dans le portail client, ainsi que d'éventuels accords individuels.",
      ],
      list: [
        "Caisty POS – logiciel de caisse cloud pour une utilisation en entreprise",
        "Accès au portail client Caisty pour la gestion des licences, appareils, abonnements et factures",
        "Synchronisation cloud, fonctions d'administration et support technique dans le cadre du plan choisi",
        "Autres produits logiciels et services que Caisty pourra proposer à l'avenir",
      ],
    },
    {
      title: "3. Inscription et compte client",
      paragraphs: [
        "La création d'un compte client est requise pour utiliser certains services. Vous vous engagez à fournir des informations exactes, complètes et à jour lors de l'inscription et à les mettre à jour sans délai en cas de modification.",
        "Vous êtes responsable de la confidentialité de vos identifiants de connexion et devez veiller à ce que seules des personnes autorisées accèdent à votre compte. Les actions effectuées à l'aide de vos identifiants vous seront imputées, sauf si vous démontrez qu'un incident de sécurité est exclusivement imputable à Caisty.",
        "Caisty est en droit de restreindre ou de suspendre temporairement l'accès au compte lorsque cela est nécessaire pour protéger la sécurité, l'intégrité ou l'utilisation conforme des services.",
      ],
    },
    {
      title: "4. Licence et utilisation du logiciel",
      paragraphs: [
        "Caisty POS et les autres produits logiciels de Caisty sont {{licensedNotSold}}. Une licence limitée, non exclusive, non transférable et révocable vous est accordée pour utiliser le logiciel dans le cadre de votre abonnement et conformément au {{eula}}.",
        "Les droits de propriété et de propriété intellectuelle sur le logiciel restent la propriété de Caisty et de ses concédants. Toute utilisation au-delà de l'étendue des services convenus — notamment la reproduction, la distribution, la sous-licence ou l'exploitation commerciale non autorisées — est interdite.",
        "Vous êtes seul responsable de l'utilisation licite du logiciel et du respect de la législation applicable. Caisty ne fournit pas de conseils juridiques, fiscaux ou comptables.",
        "Caisty peut fournir des mises à jour, des améliorations de sécurité et de nouvelles versions. Certaines mises à jour peuvent être installées automatiquement lorsque cela est nécessaire pour la sécurité ou le fonctionnement.",
      ],
    },
    {
      title: "5. Abonnements, tarifs et paiements",
      paragraphs: [
        "L'utilisation des services s'effectue généralement sur la base d'abonnements récurrents avec différents plans, fonctionnalités et tarifs. Les prix et étendues de service en vigueur sont indiqués sur le site web et dans le portail client.",
        "Sauf indication contraire, les prix sont exprimés en euros. Des taxes et prélèvements légaux peuvent s'ajouter dans la mesure où ils sont légalement dus.",
        "La facturation suit la période de facturation choisie (par ex. mensuelle ou annuelle). Les paiements doivent être effectués via les moyens de paiement proposés dans le portail client — actuellement principalement carte bancaire et PayPal.",
        "En cas de retard de paiement, d'échec de paiement ou d'utilisation non autorisée, Caisty est en droit d'envoyer des relances, de suspendre temporairement l'accès et de faire valoir d'autres droits. Les frais déjà engagés restent dus dans tous les cas.",
        "Les abonnements se renouvellent automatiquement pour la période de facturation correspondante, sauf résiliation dans les délais.",
      ],
    },
    {
      title: "6. Période d'essai",
      paragraphs: [
        "Caisty peut proposer des périodes d'essai ou d'évaluation gratuites. L'étendue, la durée et la disponibilité d'une période d'essai figurent dans la description de l'offre correspondante dans le portail client ou sur le site web.",
        "À l'expiration de la période d'essai, l'accès gratuit prend fin, sauf si vous souscrivez un abonnement payant. Caisty est en droit de modifier ou d'interrompre les offres d'essai à tout moment.",
      ],
    },
    {
      title: "7. Disponibilité et maintenance",
      paragraphs: [
        "Caisty s'efforce de fournir les services de manière fiable et sécurisée. Sauf accord écrit distinct prévoyant autre chose, les services sont fournis sur la base d'{{commercialEfforts}}. Une disponibilité ininterrompue ou exempte d'erreurs n'est pas garantie.",
        "Des limitations temporaires peuvent notamment résulter de la maintenance, des mises à jour, des travaux d'infrastructure, de pannes chez des tiers, de problèmes réseau, d'incidents de sécurité ou de force majeure. Les opérations de maintenance planifiées seront annoncées à l'avance dans la mesure du raisonnable.",
      ],
    },
    {
      title: "8. Obligations du Client",
      paragraphs: [
        "Vous vous engagez notamment à :",
        "Vous restez responsable du respect des réglementations fiscales, comptables, du droit du travail, de la protection des données et des règles sectorielles applicables à votre activité. Caisty ne se substitue pas à un conseil juridique ou en conformité indépendant.",
      ],
      list: [
        "utiliser les services uniquement à des fins commerciales licites ;",
        "respecter la législation applicable, les présentes conditions et le CLUF ;",
        "protéger de manière appropriée les identifiants, appareils et réseaux ;",
        "ne pas effectuer d'accès, de manipulations ou de perturbations non autorisés ;",
        "ne pas introduire de logiciels malveillants ni contourner les mécanismes de sécurité ;",
        "collecter et utiliser licitement les contenus et données que vous traitez ;",
        "signaler sans délai à Caisty tout incident de sécurité ou usage suspecté.",
      ],
    },
    {
      title: "9. Protection des données",
      paragraphs: [
        "Caisty traite les données personnelles conformément à la législation applicable en matière de protection des données. Les détails sur la nature, l'étendue et la finalité du traitement, vos droits et les relations de sous-traitance figurent dans la {{privacy}} et, le cas échéant, le {{dpa}}.",
        "Vous êtes responsable de vous assurer que les données que vous saisissez dans les services sont collectées et traitées licitement et que les informations requises sont communiquées aux personnes concernées.",
      ],
    },
    {
      title: "10. Prestataires tiers",
      paragraphs: [
        "Les services peuvent être connectés à des produits ou services de tiers indépendants, tels que des prestataires de paiement, une infrastructure cloud, des services d'authentification, des fabricants de matériel ou des services fiscaux.",
        "Caisty ne contrôle pas ces tiers et n'assume aucune responsabilité quant à leur disponibilité, leur fonctionnement, leur sécurité, leurs tarifs ou leurs conditions. L'utilisation des services tiers est soumise aux conditions et avis de confidentialité du prestataire concerné.",
      ],
    },
    {
      title: "11. Résiliation",
      paragraphs: [
        "Vous pouvez résilier votre abonnement à tout moment via le portail client ou par e-mail à {{supportEmail}}. La résiliation prend effet à la fin de la période de facturation en cours, sauf droit de résiliation légal différent.",
        "La résiliation ne donne en principe pas droit au remboursement des sommes déjà payées pour la période en cours. Les créances de paiement déjà échues restent inchangées.",
        "Caisty peut résilier le contrat pour motif grave sans préavis ou suspendre l'accès, notamment en cas de violation grave des présentes conditions ou du CLUF, de retard de paiement, d'utilisation frauduleuse, de risques de sécurité importants ou si la poursuite de la fourniture serait illicite. Dans la mesure du raisonnable, Caisty fixera préalablement un délai de mise en conformité.",
        "À la fin du contrat, votre droit d'utiliser les services prend fin. Dans la mesure du possible sur le plan technique, vous devez exporter les données pertinentes avant la fin du contrat. Caisty peut supprimer ou anonymiser les données après l'expiration des délais de conservation légaux ou contractuels.",
      ],
    },
    {
      title: "12. Responsabilité",
      paragraphs: [
        "Caisty est responsable sans limitation en cas de dol et de faute lourde ainsi qu'en cas de dommages résultant d'une atteinte à la vie, à l'intégrité corporelle ou à la santé. En cas de négligence légère dans la violation d'obligations contractuelles essentielles, la responsabilité est limitée au dommage prévisible et typique du contrat.",
        "Par ailleurs, la responsabilité pour négligence légère est exclue dans la mesure permise par la loi. Caisty n'est pas responsable des dommages indirects, du manque à gagner, de la perte de données ou de l'interruption d'activité, sauf disposition impérative contraire.",
        "Lorsque la responsabilité n'est pas exclue, la responsabilité globale de Caisty est limitée au montant que vous avez effectivement payé pour les services concernés au cours des douze mois précédant l'événement dommageable, sauf disposition impérative prévoyant une responsabilité plus étendue.",
      ],
    },
    {
      title: "13. Modifications des conditions",
      paragraphs: [
        "Caisty peut modifier les présentes conditions lorsque cela est nécessaire pour tenir compte d'évolutions juridiques, techniques ou opérationnelles ou pour faire évoluer les services.",
        "Les modifications substantielles affectant vos droits contractuels vous seront communiquées de manière appropriée, par exemple par e-mail, dans le portail client ou sur le site web. Dans la mesure permise par la loi, votre utilisation continue après l'entrée en vigueur de la version modifiée vaut acceptation. Si vous vous opposez à des modifications substantielles, vous pouvez résilier le contrat à la date d'entrée en vigueur des modifications.",
      ],
    },
    {
      title: "14. Dispositions finales",
      paragraphs: [
        "Les présentes conditions, le CLUF, la politique de confidentialité, la politique relative aux cookies, le DPA (le cas échéant) et les mentions légales constituent ensemble la base contractuelle, sauf accords écrits individuels prévoyant autre chose. En cas de contradiction, le document spécifiquement prévu pour l'objet concerné prévaut.",
        "Le droit de la République fédérale d'Allemagne s'applique, à l'exclusion de la Convention des Nations Unies sur les contrats de vente internationale de marchandises (CVIM). Pour les commerçants, le for exclusif est Berlin, dans la mesure permise par la loi.",
        "Si certaines dispositions des présentes conditions sont ou deviennent invalides, la validité des autres dispositions n'en est pas affectée. La disposition invalide sera remplacée par une disposition valide se rapprochant le plus de l'objet économique visé.",
        "Caisty est en droit de transférer les droits et obligations découlant du présent contrat dans le cadre de cessions d'entreprise, de restructurations ou de changements de participation à des sociétés affiliées ou successeurs juridiques.",
      ],
    },
  ],
  contactSectionTitle: "15. Contact",
  contactSectionIntro: "Pour toute question relative aux présentes conditions, vous pouvez nous contacter :",
  contact: legalContact.fr,
  related: legalRelatedLabels.fr,
  showOwnerInContact: false,
};
