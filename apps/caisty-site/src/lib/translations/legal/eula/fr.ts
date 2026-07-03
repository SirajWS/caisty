import { legalContact } from "../shared/contact";
import { legalLinkLabels, legalRelatedLabels } from "../shared/labels";
import type { EulaCopy } from "./types";

export const eulaFr: EulaCopy = {
  documentLabel: "Contrat de licence utilisateur final (CLUF)",
  title: "Contrat de licence utilisateur final",
  lastUpdatedLabel: "Dernière mise à jour",
  effectiveDate: "1 juillet 2026",
  versionLabel: "Version",
  version: "2.0 (Master Edition)",
  intro:
    "Le présent Contrat de licence utilisateur final (« CLUF » ou « Contrat ») constitue un accord juridiquement contraignant entre Caisty et vous, en tant que client ou utilisateur, concernant l'octroi de licence et l'utilisation de Caisty POS, des services cloud associés, du portail client, des API et d'autres services. En installant, activant, enregistrant ou utilisant le logiciel, vous acceptez ce Contrat.",
  linkLabels: legalLinkLabels.fr,
  emphasis: {
    licensedNotSold: "concédé sous licence, non vendu",
    commercialEfforts: "efforts commercialement raisonnables",
  },
  sections: [
    {
      title: "Partie I – Dispositions générales",
      subsections: [
        {
          title: "1. Introduction",
          paragraphs: [
            "Le présent Contrat régit l'octroi de licence et l'utilisation du logiciel et fait partie intégrante de la relation contractuelle entre Caisty et le client. Si vous n'acceptez pas ces conditions, vous ne devez pas installer, activer ou utiliser le logiciel.",
          ],
        },
        {
          title: "2. Définitions",
          paragraphs: ["Principaux termes utilisés dans ce Contrat :"],
          list: [
            "**Logiciel** – Caisty POS, y compris mises à jour, modules et documentation",
            "**Services** – infrastructure cloud, portail client, gestion des licences, API, support",
            "**Client / Utilisateur** – entreprise ou personnes physiques autorisées",
            "**Compte, Appareil, Licence, Abonnement** – tels que définis dans la description du produit",
            "**Informations confidentielles** – informations commerciales, techniques ou de sécurité non publiques",
          ],
        },
        {
          title: "3. Champ d'application",
          paragraphs: [
            "Le présent CLUF s'applique à Caisty POS, au portail client, aux services cloud, aux mises à jour, aux API, à l'activation des licences, aux abonnements et aux contenus numériques associés. En cas de contradiction avec un accord individuel signé par les parties, l'accord individuel prévaut.",
          ],
        },
        {
          title: "4. Acceptation",
          paragraphs: [
            "Vous acceptez ce Contrat en créant un compte, en activant une licence, en installant le logiciel, en utilisant le portail client, en achetant ou renouvelant un abonnement, ou en confirmant électroniquement. Si vous agissez pour le compte d'une entreprise, vous déclarez être habilité à le faire.",
          ],
        },
        {
          title: "5. Éligibilité",
          paragraphs: [
            "Les Services sont destinés à un usage professionnel et commercial. Vous déclarez avoir au moins 18 ans ou la capacité juridique requise, fournir des données d'inscription exactes et utiliser les Services de manière licite.",
          ],
        },
        {
          title: "6. Formation du contrat",
          paragraphs: [
            "Le Contrat prend effet dès la première des opérations suivantes : création de compte, activation de licence, installation, accès au portail, achat d'abonnement ou utilisation. Une signature manuscrite n'est pas requise lorsque la loi le permet.",
          ],
        },
        {
          title: "7.–8. Octroi de licence et nature de la licence",
          paragraphs: [
            "Sous réserve du paiement de tous les frais et du respect du présent Contrat, Caisty vous accorde une licence limitée, non exclusive, non transférable, non sous-licenciable et révocable pour utiliser le Logiciel uniquement à des fins commerciales internes. Le Logiciel est {{licensedNotSold}}. Aucun transfert de propriété ou de droits de propriété intellectuelle n'intervient. L'étendue dépend de l'abonnement, des limites d'appareils/utilisateurs et des exigences techniques.",
          ],
        },
        {
          title: "9. Restrictions de licence",
          paragraphs: ["Sauf obligation légale ou autorisation écrite expresse, il est interdit de :"],
          list: [
            "copier, distribuer ou rendre le Logiciel accessible au public ;",
            "créer des œuvres dérivées ou procéder à de l'ingénierie inverse ;",
            "supprimer ou contourner les protections de droits d'auteur, marques ou licences ;",
            "utiliser des clés de licence ou mécanismes d'activation non autorisés ;",
            "louer, sous-licencier ou utiliser le Logiciel pour des produits concurrents ;",
            "introduire des logiciels malveillants ou attaquer abusivement les Services de manière automatisée.",
          ],
        },
        {
          title: "10. Réserve de droits",
          paragraphs: [
            "Caisty conserve tous les droits sur le Logiciel, le code source/objet, les bases de données, les API, la documentation, les marques, le savoir-faire et les évolutions. Le client ne reçoit que les droits d'utilisation expressément accordés.",
            "Les violations des restrictions de licence peuvent entraîner une suspension immédiate.",
          ],
        },
      ],
    },
    {
      title: "Partie II – Logiciel et services",
      subsections: [
        {
          title: "11. Compte utilisateur",
          paragraphs: [
            "Un compte client est requis pour certaines fonctionnalités. Vous êtes responsable de l'exactitude des données, de la confidentialité des identifiants, des utilisateurs autorisés et de toute activité du compte. Les incidents de sécurité doivent être signalés sans délai.",
          ],
        },
        {
          title: "12. Activation des appareils",
          paragraphs: [
            "Le Logiciel ne peut être activé que sur les appareils autorisés par l'abonnement. L'activation peut inclure une vérification en ligne, des limites d'appareils et une validation périodique. Toute manipulation ou contournement est interdit.",
          ],
        },
        {
          title: "13. Abonnements",
          paragraphs: [
            "L'accès est fourni via des formules d'abonnement avec des fonctionnalités, limites d'appareils/utilisateurs, support et intégrations variables. Les descriptions sont publiées sur le site web et dans le portail client.",
          ],
        },
        {
          title: "14. Installation",
          paragraphs: [
            "L'installation est autorisée uniquement via les canaux officiels Caisty. Vous êtes responsable du matériel, des systèmes d'exploitation et des réseaux compatibles. Caisty ne garantit pas la compatibilité avec les environnements non pris en charge.",
          ],
        },
        {
          title: "15. Mises à jour et upgrades",
          paragraphs: [
            "Pendant un abonnement actif, des mises à jour, correctifs de sécurité et nouvelles fonctionnalités peuvent être fournis. Les mises à jour de sécurité peuvent être installées automatiquement. Les versions obsolètes peuvent être arrêtées.",
          ],
        },
        {
          title: "16. Services cloud",
          paragraphs: [
            "Des fonctionnalités telles que l'authentification, la vérification des licences, la synchronisation et le portail nécessitent Internet. Caisty s'efforce d'assurer la disponibilité sur la base d'{{commercialEfforts}} ; un fonctionnement ininterrompu n'est pas garanti.",
          ],
        },
        {
          title: "17. Portail client",
          paragraphs: [
            "Via le portail, les utilisateurs autorisés peuvent notamment gérer les licences, appareils, abonnements, factures et paramètres de sécurité. Toutes les actions des utilisateurs autorisés sont imputées au client.",
          ],
        },
        {
          title: "18. API et intégrations",
          paragraphs: [
            "L'utilisation des API est soumise au présent Contrat, à la documentation, aux limites et aux exigences de sécurité. Les intégrations tierces sont régies par leurs propres conditions ; Caisty ne garantit pas une compatibilité permanente.",
          ],
        },
        {
          title: "19. Support",
          paragraphs: [
            "Le support inclus dans l'abonnement peut couvrir l'assistance technique, la documentation et le traitement des anomalies, mais pas le développement sur mesure, la maintenance matérielle ou les conseils juridiques/fiscaux. Les délais de réponse sont des objectifs sauf accord écrit contraire.",
          ],
        },
        {
          title: "20. Disponibilité",
          paragraphs: [
            "La maintenance, les incidents de sécurité, les perturbations d'infrastructure et la force majeure peuvent affecter la disponibilité. Les interruptions temporaires ne constituent généralement pas une violation contractuelle.",
          ],
        },
      ],
    },
    {
      title: "Partie III – Propriété intellectuelle et données",
      subsections: [
        {
          title: "21.–22. Propriété intellectuelle et marques",
          paragraphs: [
            "Le Logiciel et les Services restent la propriété exclusive de Caisty ou de ses concédants. Les marques, logos et noms de produits ne peuvent être utilisés ou modifiés sans autorisation.",
          ],
        },
        {
          title: "23. Confidentialité",
          paragraphs: [
            "Les deux parties protègent les informations confidentielles de l'autre et ne les utilisent qu'à des fins liées au contrat. Ces obligations survivent à la résiliation du Contrat.",
          ],
        },
        {
          title: "24. Données client",
          paragraphs: [
            "Le client conserve la propriété de ses données commerciales. Caisty ne reçoit que les droits de traitement nécessaires à la fourniture des Services. Le client est responsable de la licéité, de l'exactitude et des consentements requis.",
          ],
        },
        {
          title: "25. Protection des données",
          paragraphs: [
            "Les données personnelles sont traitées conformément au RGPD, à la {{privacy}} et – le cas échéant – au {{dpa}}. Lorsque Caisty traite des données pour le compte du client, Caisty agit en tant que sous-traitant.",
          ],
        },
        {
          title: "26. Sécurité",
          paragraphs: [
            "Caisty met en œuvre des mesures techniques et organisationnelles appropriées, notamment communication chiffrée, hachage des mots de passe, accès basé sur les rôles, surveillance, mises à jour et concepts de reprise. Une sécurité absolue ne peut être garantie ; le client partage la responsabilité.",
          ],
        },
        {
          title: "27.–28. Sauvegarde et conservation",
          paragraphs: [
            "Caisty peut effectuer des sauvegardes opérationnelles ; celles-ci ne remplacent pas la sauvegarde propre du client. Les données ne sont conservées que le temps nécessaire au contrat, à la loi et à l'exploitation, puis supprimées ou anonymisées.",
          ],
        },
        {
          title: "29.–30. Obligations et conformité du client",
          paragraphs: [
            "Le client utilise le Logiciel de manière licite, respecte les lois applicables (fiscalité, comptabilité, protection des données, réglementation sectorielle) et met en place des mesures de sécurité internes appropriées. Caisty ne fournit pas de conseils juridiques, fiscaux ou comptables.",
          ],
        },
      ],
    },
    {
      title: "Partie IV – Garantie, responsabilité et résiliation",
      subsections: [
        {
          title: "31. Exclusion de garantie",
          paragraphs: [
            "Caisty développe le Logiciel avec le soin d'un fournisseur SaaS diligent. Dans la mesure permise par la loi, le Logiciel est fourni « en l'état » et « selon disponibilité ». Aucune garantie n'est donnée quant à un fonctionnement sans erreur, ininterrompu ou adapté à tout usage, sauf disposition impérative contraire.",
          ],
        },
        {
          title: "32. Limitation de responsabilité",
          paragraphs: [
            "Caisty est entièrement responsable en cas d'intention, de faute lourde et de dommages corporels. Sinon, la responsabilité pour dommages indirects, perte de profits, perte de données ou interruption d'activité est exclue dans la mesure permise. La responsabilité totale est limitée aux frais d'abonnement payés au cours des douze mois précédant l'événement dommageable, sauf disposition impérative contraire.",
          ],
        },
        {
          title: "33. Indemnisation",
          paragraphs: [
            "Le client indemnise Caisty contre les réclamations résultant de violations du présent Contrat, d'une utilisation illicite, de données client contrefaisantes ou d'une protection insuffisante des identifiants d'accès.",
          ],
        },
        {
          title: "34.–35. Suspension et résiliation",
          paragraphs: [
            "Caisty peut suspendre ou résilier les Services en cas de risques de sécurité, de défaut de paiement, de fraude ou de violations graves. Le client peut résilier les abonnements via le portail. À la résiliation, la licence expire.",
          ],
        },
        {
          title: "36. Conséquences de la résiliation",
          paragraphs: [
            "À la résiliation, le droit d'utilisation prend fin ; les accès peuvent être désactivés. Les données sont conservées ou supprimées conformément à la politique de confidentialité et au DPA. Les dispositions survivantes (PI, confidentialité, responsabilité, indemnisation, droit applicable) restent en vigueur.",
          ],
        },
        {
          title: "37.–39. Force majeure, contrôle des exportations, audits",
          paragraphs: [
            "Aucune partie n'est responsable en cas de force majeure. Le client respecte le droit des exportations et des sanctions. Caisty peut demander des justificatifs raisonnables pour la vérification des licences sans exiger un accès système illimité.",
          ],
        },
      ],
    },
    {
      title: "Partie V – Dispositions finales",
      subsections: [
        {
          title: "41.–44. Modifications, cession, divisibilité, intégralité",
          paragraphs: [
            "Caisty peut modifier ce Contrat ; les modifications substantielles seront communiquées. L'utilisation continue vaut acceptation lorsque la loi le permet. La cession par le client nécessite un consentement. Les dispositions invalides sont remplacées par des dispositions valides au plus proche de l'objectif économique. Ce CLUF, avec les CGV, la politique de confidentialité, les cookies et le DPA, constitue l'accord contractuel complet.",
          ],
        },
        {
          title: "45.–46. Droit applicable et règlement des litiges",
          paragraphs: [
            "Le présent Contrat est régi par le droit de la **République fédérale d'Allemagne**, à l'exclusion de la Convention des Nations Unies sur les contrats de vente internationale de marchandises (CVIM) et sans égard aux règles de conflit de lois.",
            "Dans la mesure permise par la loi – notamment pour les contrats entre professionnels (B2B) – le for exclusif est **Berlin, Allemagne**.",
            "Les litiges sont d'abord réglés à l'amiable ; ensuite, les tribunaux compétents peuvent être saisis. Les mesures conservatoires restent réservées.",
          ],
        },
        {
          title: "47.–48. Acceptation électronique et langue",
          paragraphs: [
            "Le Contrat peut être accepté électroniquement et a – lorsque permis – la même force qu'une signature. En cas de divergence entre traductions et version faisant foi, le cadre juridique applicable ou la version maître convenue prévaut.",
          ],
        },
        {
          title: "49.–50. Contact et date d'entrée en vigueur",
          paragraphs: [
            "**Date d'entrée en vigueur :** 1 juillet 2026",
            "En utilisant les Services, vous confirmez avoir lu et accepté le présent Contrat.",
          ],
        },
      ],
    },
    {
      title: "Annexe A – Formules de licence",
      paragraphs: [
        "Les formules d'abonnement (par ex. Starter, Professional, Enterprise) définissent les limites d'appareils, d'utilisateurs et de fonctionnalités. Les détails sont publiés sur le site web et dans le portail client. Les licences ne sont pas transférables sauf accord écrit. Les règles d'usage équitable soutiennent la stabilité et la sécurité de la plateforme.",
      ],
    },
    {
      title: "Annexe B – Politique d'utilisation acceptable (PUA)",
      paragraphs: [
        "La PUA protège la sécurité, l'intégrité et l'utilisation licite. Sont interdits notamment l'usage illicite, les logiciels malveillants, l'accès non autorisé, le contournement des mécanismes de licence, la charge automatisée excessive, la revente sans autorisation et le développement de produits concurrents basés sur des composants propriétaires. Caisty peut avertir, suspendre ou résilier en cas de violation.",
      ],
    },
    {
      title: "Annexe C – Objectifs de niveau de service (SLO)",
      paragraphs: [
        "Caisty vise une haute disponibilité de l'infrastructure cloud (objectif : environ 99,5 % de disponibilité mensuelle, hors maintenance, force majeure et pannes tierces). Les SLO sont des objectifs opérationnels, non des niveaux de service garantis, sauf accord écrit séparé. Le support est fourni pendant les heures ouvrables communiquées.",
      ],
    },
  ],
  contactSectionTitle: "Contact et date d'entrée en vigueur",
  contactSectionIntro: "Pour toute question concernant ce Contrat, contactez-nous à :",
  contact: legalContact.fr,
  related: legalRelatedLabels.fr,
  showOwnerInContact: false,
};
