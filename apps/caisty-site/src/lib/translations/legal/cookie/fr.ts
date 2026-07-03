import { legalContact } from "../shared/contact";
import { legalLinkLabels, legalRelatedLabels } from "../shared/labels";
import type { CookiePolicyCopy } from "./types";

export const cookiePolicyFr: CookiePolicyCopy = {
  documentLabel: "Politique relative aux cookies",
  title: "Politique relative aux cookies",
  lastUpdatedLabel: "Dernière mise à jour",
  effectiveDate: "1er juillet 2026",
  intro:
    "La présente politique relative aux cookies explique comment Caisty utilise les cookies et technologies similaires lorsque vous utilisez notre site web, Caisty POS, le portail client et les services en ligne associés.",
  linkLabels: legalLinkLabels.fr,
  sections: [
    {
      title: "1. Responsable du traitement",
      paragraphs: [
        "Le responsable du traitement au sens de la présente politique est Caisty, propriétaire Siraj Bettaieb, Mollwitzstraße 5A, 14059 Berlin, Allemagne. Les coordonnées complètes figurent à la section 11.",
      ],
    },
    {
      title: "2. Champ d'application",
      paragraphs: [
        "La présente politique s'applique aux cookies et technologies comparables en lien avec :",
        "Elle complète notre {{privacy}}, applicable dès que les cookies traitent des données personnelles.",
      ],
      list: [
        "caisty.com et les sites web associés ;",
        "Caisty POS et les fonctionnalités web/cloud intégrées ;",
        "le portail client Caisty ;",
        "les services cloud et fonctions de synchronisation ;",
        "les API et interfaces d'administration ;",
        "les futurs services en ligne proposés par Caisty.",
      ],
    },
    {
      title: "3. Que sont les cookies ?",
      paragraphs: [
        "Les cookies sont de petits fichiers texte qui peuvent être enregistrés sur votre appareil lors de la visite d'un site web ou de l'utilisation d'un service en ligne. Ils permettent de mémoriser des paramètres, de maintenir des sessions, d'améliorer la sécurité et de simplifier l'utilisation.",
        "Les cookies ne vous identifient pas automatiquement par votre nom. Toutefois, lorsqu'ils sont associés à d'autres informations, ils peuvent constituer des données personnelles.",
        "Outre les cookies classiques du navigateur, des technologies comparables peuvent être utilisées, notamment le stockage local, le stockage de session, des jetons d'authentification sécurisés ou des identifiants de session chiffrés. La présente politique inclut ces technologies lorsqu'elles remplissent des fonctions comparables.",
      ],
    },
    {
      title: "4. Quels cookies utilisons-nous ?",
      paragraphs: ["Selon le service utilisé, différentes catégories peuvent s'appliquer :"],
      subsections: [
        {
          title: "Cookies strictement nécessaires",
          paragraphs: [
            "Ces cookies sont indispensables au fonctionnement des services, par exemple pour une navigation sécurisée, les fonctions de base, la logique panier/session ou le stockage techniquement requis. Sans eux, des fonctions essentielles ne peuvent pas être fournies.",
          ],
        },
        {
          title: "Cookies d'authentification",
          paragraphs: [
            "Ces cookies reconnaissent les utilisateurs connectés et permettent l'accès sécurisé aux zones protégées telles que le portail client. Ils évitent de devoir vous reconnecter à chaque page.",
          ],
        },
        {
          title: "Cookies de sécurité",
          paragraphs: [
            "Les cookies de sécurité contribuent à la protection des comptes et des systèmes, par exemple en détectant des activités suspectes, en prévenant les abus et en sécurisant les sessions.",
          ],
        },
        {
          title: "Cookies de préférences",
          paragraphs: [
            "Ces cookies enregistrent les paramètres que vous choisissez, tels que la langue, le thème (clair/sombre) ou d'autres options d'affichage, afin de rendre votre utilisation plus confortable.",
          ],
        },
        {
          title: "Cookies fonctionnels",
          paragraphs: [
            "Les cookies fonctionnels permettent des fonctions de confort avancées qui ne sont pas strictement nécessaires au fonctionnement de base, par exemple la mémorisation de choix antérieurs ou une utilisation simplifiée lors de visites ultérieures.",
          ],
        },
        {
          title: "Cookies d'analyse",
          paragraphs: [
            "Les cookies d'analyse nous aident à comprendre comment le site et les services sont utilisés (par ex. pages consultées, parcours de navigation, utilisation des fonctionnalités sous forme agrégée). Ils servent à améliorer nos services.",
          ],
        },
        {
          title: "Cookies de performance",
          paragraphs: [
            "Les cookies de performance mesurent les temps de chargement, la réactivité, la stabilité et la fiabilité technique afin d'identifier les goulets d'étranglement et d'améliorer la qualité des services.",
          ],
        },
      ],
    },
    {
      title: "5. Base juridique",
      paragraphs: [
        "Les **cookies strictement nécessaires** sont utilisés sur la base de notre intérêt légitime et/ou pour fournir les services que vous demandez. Le consentement n'est en règle générale pas requis pour ces cookies.",
        "Les **cookies d'analyse, de performance, fonctionnels et de préférences** qui ne sont pas strictement nécessaires ne sont utilisés que lorsqu'une base juridique valable existe — notamment votre consentement au sens de l'art. 6, par. 1, let. a du RGPD et/ou de l'art. 25 de la loi TTDSG, lorsque la loi l'exige.",
        "Dans la mesure permise, certaines mesures de sécurité et de stabilité peuvent également reposer sur des intérêts légitimes (art. 6, par. 1, let. f du RGPD), pour autant que vos intérêts ne prévalent pas.",
      ],
    },
    {
      title: "6. Bannière cookies et consentement",
      paragraphs: [
        "Lors de votre première visite sur notre site, vous pouvez utiliser notre bannière cookies pour décider si des cookies optionnels peuvent être déposés. Vous disposez des options suivantes :",
        "Vous pouvez retirer votre consentement à tout moment avec effet pour l'avenir en rouvrant vos paramètres cookies :",
      ],
      list: [
        "accepter tous les cookies ;",
        "refuser les cookies non essentiels ;",
        "personnaliser vos préférences par catégorie ;",
        "modifier votre choix ultérieurement.",
      ],
      cookiePreferencesLabel: "Ouvrir les paramètres cookies",
    },
    {
      title: "7. Paramètres du navigateur",
      paragraphs: [
        "Vous pouvez également gérer, bloquer ou supprimer les cookies directement dans votre navigateur. Veuillez noter que la désactivation des cookies requis peut empêcher certaines parties du site ou du portail client de fonctionner correctement.",
        "Des instructions sont disponibles dans l'aide de votre navigateur (par ex. Chrome, Firefox, Safari, Edge). Après la suppression des cookies, la bannière cookies peut réapparaître.",
      ],
    },
    {
      title: "8. Durée de conservation",
      paragraphs: [
        "Les **cookies de session** sont supprimés lorsque vous fermez votre navigateur ou mettez fin à la session de l'application. Ils servent principalement à l'authentification, à la continuité de session et aux paramètres temporaires.",
        "Les **cookies persistants** restent sur votre appareil pendant une durée définie ou jusqu'à leur suppression manuelle. Ils peuvent par exemple enregistrer la langue, le thème ou vos choix en matière de cookies. La durée de conservation dépend de la finalité respective et des exigences légales applicables.",
      ],
    },
    {
      title: "9. Confidentialité",
      paragraphs: [
        "Lorsque les cookies traitent des données personnelles, le traitement est effectué conformément à notre {{privacy}}. Vous y trouverez des informations sur vos droits, les durées de conservation, les destinataires et les mesures de sécurité.",
      ],
    },
    {
      title: "10. Modifications",
      paragraphs: [
        "Caisty peut adapter la présente politique lorsque le cadre juridique, les technologies utilisées ou nos services évoluent. Les modifications importantes seront communiquées via le site web, le portail client ou d'autres canaux appropriés. La version en vigueur est disponible sur cette page.",
      ],
    },
  ],
  contactSectionTitle: "11. Contact",
  contactSectionIntro: "Pour toute question relative aux cookies ou au consentement, contactez-nous :",
  contact: legalContact.fr,
  related: legalRelatedLabels.fr,
};
