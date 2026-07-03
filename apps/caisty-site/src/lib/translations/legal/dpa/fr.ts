import { legalContact } from "../shared/contact";
import { legalLinkLabels, legalRelatedLabels } from "../shared/labels";
import type { DpaCopy } from "./types";

export const dpaFr: DpaCopy = {
  documentLabel: "Accord de traitement des données (DPA)",
  title: "Accord de traitement des données (DPA)",
  lastUpdatedLabel: "Dernière mise à jour",
  effectiveDate: "1 juillet 2026",
  versionLabel: "Version",
  version: "2.0 (Master Edition)",
  intro:
    "Le présent Accord de traitement des données (« DPA » ou « AVV ») régit le traitement des données personnelles lorsque Caisty agit en tant que sous-traitant pour le compte du client (responsable du traitement). Il répond aux exigences de l'art. 28 du RGPD et complète le {{eula}}, les {{terms}} et la {{privacy}}. En cas de contradiction relative au traitement des données, le présent DPA prévaut dans la mesure requise par le droit de la protection des données.",
  linkLabels: legalLinkLabels.fr,
  sections: [
    {
      title: "Partie I – Dispositions générales",
      subsections: [
        {
          title: "Article 1 – Objet",
          paragraphs: [
            "Le présent DPA fait partie de la relation contractuelle entre Caisty (« Sous-traitant ») et le client (« Responsable du traitement ») et régit le traitement des données personnelles dans le cadre des services fournis par Caisty.",
            "Il vise à satisfaire aux exigences de l'art. 28 du Règlement (UE) 2016/679 (« RGPD ») et des autres lois applicables en matière de protection des données. Lorsque Caisty traite des données personnelles pour le compte du client, le présent DPA régit les droits et obligations des deux parties.",
            "Le présent DPA complète et doit être lu conjointement avec :",
          ],
          list: [
            "Contrat de licence utilisateur final (CLUF) ;",
            "Conditions générales ;",
            "contrat d'abonnement ;",
            "Politique de confidentialité ;",
            "bons de commande ou accords de service applicables.",
          ],
        },
        {
          title: "Article 2 – Définitions",
          list: [
            "**Responsable du traitement** – personne physique ou morale qui détermine les finalités et les moyens du traitement",
            "**Sous-traitant** – Caisty lorsqu'il traite pour le compte du Responsable",
            "**données personnelles** – informations relatives à des personnes physiques identifiées ou identifiables au sens du droit applicable",
            "**traitement** – toute opération effectuée sur des données personnelles (collecte, stockage, organisation, consultation, utilisation, divulgation, transfert, suppression, etc.)",
            "**personne concernée** – personne dont les données personnelles sont traitées",
            "**sous-traitant ultérieur** – tiers qui traite des données personnelles pour le compte des parties",
            "**violation de données personnelles** – incident de sécurité impliquant un accès non autorisé, une perte, une destruction ou une divulgation",
          ],
          paragraphs: ["Les termes non définis ont la signification donnée dans le CLUF ou les CGV."],
        },
        {
          title: "Article 3 – Champ d'application",
          paragraphs: [
            "Le présent DPA s'applique lorsque Caisty traite des données personnelles pour le compte du Responsable dans le cadre des services.",
            "Le présent DPA ne s'applique pas lorsque Caisty agit en tant que responsable indépendant (p. ex. facturation propre, conformité, prévention de la fraude, sécurité, administration de l'entreprise). Cela est régi par la Politique de confidentialité.",
          ],
          list: [
            "Caisty POS ;",
            "portail client ;",
            "services cloud ;",
            "interfaces administratives ;",
            "API ;",
            "licences logicielles ;",
            "systèmes de support client ;",
            "infrastructure de sauvegarde ;",
            "services d'authentification ;",
            "futurs services exploités par Caisty.",
          ],
        },
        {
          title: "Article 4 – Objet du traitement",
          paragraphs: [
            "L'objet est la fourniture, l'exploitation, la maintenance, la sécurité, le support et l'amélioration continue des services. Le traitement peut inclure :",
            "Le traitement est effectué uniquement aux fins déterminées par le Responsable.",
          ],
          list: [
            "hébergement des données client ;",
            "stockage et transmission de données personnelles ;",
            "organisation et synchronisation cloud ;",
            "fourniture de fonctionnalités logicielles ;",
            "support client, mises à jour, maintenance technique ;",
            "reprise après sinistre et sauvegarde.",
          ],
        },
        {
          title: "Article 5 – Durée du traitement",
          paragraphs: [
            "Le traitement dure pendant la durée de la relation contractuelle. À la résiliation, les données sont conservées, restituées, supprimées ou anonymisées conformément au présent DPA, à la documentation contractuelle, aux obligations légales de conservation et au droit de la protection des données. La poursuite est autorisée lorsque la loi l'exige ou pour faire valoir des droits.",
          ],
        },
        {
          title: "Article 6 – Nature et finalités du traitement",
          paragraphs: [
            "Caisty traite les données personnelles uniquement pour fournir les services demandés par le Responsable, notamment collecte, stockage, organisation, consultation, transmission, synchronisation, hébergement, sauvegarde, restauration, support technique, maintenance, surveillance de sécurité et suppression.",
            "Caisty ne traite pas de données personnelles à ses propres fins indépendantes, sauf lorsque la loi l'autorise expressément ou lorsque Caisty agit en tant que responsable indépendant.",
          ],
        },
        {
          title: "Article 7 – Catégories de données personnelles",
          paragraphs: [
            "Selon les services utilisés, les catégories suivantes peuvent notamment être traitées :",
            "Les catégories précises dépendent de l'utilisation par le Responsable.",
          ],
          list: [
            "noms, coordonnées professionnelles, e-mail, téléphone ;",
            "données employés, clients et fournisseurs ;",
            "données de facturation et de transaction, informations de compte ;",
            "informations d'authentification, identifiants d'appareils ;",
            "journaux techniques, communications de support, données opérationnelles.",
          ],
        },
        {
          title: "Article 8 – Catégories de personnes concernées",
          paragraphs: [
            "Les personnes concernées peuvent inclure :",
            "Le Responsable détermine seul les catégories traitées.",
          ],
          list: [
            "employés, utilisateurs autorisés, clients, prospects ;",
            "fournisseurs, sous-traitants, conseillers, partenaires commerciaux ;",
            "autres personnes dont les données sont saisies dans les services par le Responsable.",
          ],
        },
        {
          title: "Article 9 – Rôles des parties",
          paragraphs: [
            "Le client est le Responsable ; Caisty est le Sous-traitant lors du traitement pour le compte du Responsable. Rien dans le présent DPA ne transfère la propriété ou le contrôle des données personnelles du Responsable à Caisty. Chaque partie remplit ses obligations en vertu du droit de la protection des données.",
          ],
        },
        {
          title: "Article 10 – Obligations générales du sous-traitant",
          paragraphs: [
            "Caisty :",
            "Caisty ne vend, ne loue ni ne commercialise les données personnelles traitées.",
          ],
          list: [
            "traite les données personnelles uniquement sur instruction documentée, sauf obligation légale contraire ;",
            "assure que le personnel autorisé est tenu à la confidentialité ;",
            "met en œuvre des mesures techniques et organisationnelles appropriées ;",
            "assiste le Responsable dans ses obligations de protection des données ;",
            "tient les registres de traitement requis ;",
            "signale les violations de données personnelles ;",
            "coopère avec les autorités de contrôle lorsque la loi l'exige ;",
            "veille à ce que les sous-traitants ultérieurs assument des obligations équivalentes.",
          ],
        },
      ],
    },
    {
      title: "Partie II – Sécurité et confidentialité",
      subsections: [
        {
          title: "Article 11 – Confidentialité",
          paragraphs: [
            "Caisty veille à ce que toutes les personnes ayant accès aux données personnelles soient soumises à une obligation de confidentialité appropriée – y compris employés, prestataires, sous-traitants ultérieurs et autres personnes autorisées. L'obligation subsiste après la fin du contrat de travail/de prestation ou du présent DPA. L'accès est strictement limité au besoin d'en connaître.",
          ],
        },
        {
          title: "Article 12 – Mesures techniques et organisationnelles (MTO)",
          paragraphs: [
            "Caisty met en œuvre des MTO appropriées pour protéger les données personnelles contre la destruction, la perte, l'altération, la divulgation ou l'accès non autorisés. Selon le service, cela peut inclure :",
            "Les détails figurent à l'Annexe II. Les MTO peuvent être mises à jour pour autant que le niveau de protection ne soit pas sensiblement réduit.",
          ],
          list: [
            "chiffrement en transit et – le cas échéant – au repos ;",
            "authentification sécurisée, hachage des mots de passe, MFA lorsque disponible ;",
            "accès basé sur les rôles, moindre privilège, segmentation réseau, pare-feu ;",
            "sécurité des terminaux, gestion des vulnérabilités, protection anti-malware ;",
            "surveillance de sécurité, sauvegardes, reprise après sinistre, revues de sécurité régulières.",
          ],
        },
        {
          title: "Article 13 – Sécurité du traitement",
          paragraphs: [
            "Compte tenu de l'état de l'art, des coûts de mise en œuvre, de la nature, de l'étendue, du contexte et des finalités du traitement, ainsi que des risques pour les droits et libertés des personnes physiques, Caisty met en œuvre des mesures de sécurité appropriées conformément à l'art. 32 RGPD – pour garantir la confidentialité, l'intégrité, la disponibilité et la résilience des systèmes. Caisty améliore régulièrement son programme de sécurité par des analyses de risques, des revues, des mises à jour, des améliorations d'infrastructure et de la surveillance.",
          ],
        },
        {
          title: "Article 14 – Contrôles d'accès",
          paragraphs: [
            "L'accès est limité au personnel autorisé. Les mesures peuvent inclure des comptes individuels, des autorisations basées sur les rôles, l'authentification, des politiques de mots de passe, la gestion des sessions, la gestion des accès privilégiés, la journalisation des activités administratives, des revues d'accès régulières et la révocation rapide des droits inutiles.",
          ],
        },
        {
          title: "Article 15 – Gestion des incidents",
          paragraphs: [
            "Caisty maintient des procédures documentées pour identifier, évaluer, contenir, enquêter, remédier et résoudre les incidents de sécurité – y compris détection, classification, évaluation des risques, analyse forensique, reprise et revue post-incident avec mesures correctives.",
          ],
        },
        {
          title: "Article 16 – Violations de données personnelles",
          paragraphs: [
            "Si Caisty prend connaissance d'une violation de données personnelles lors d'un traitement pour le compte du Responsable, Caisty informe le Responsable sans délai indu. Dans la mesure du possible, Caisty communique la nature de la violation, les catégories de données et de personnes concernées, les conséquences probables et les mesures prises/proposées – éventuellement par étapes. Caisty assiste le Responsable dans ses obligations de notification aux autorités de contrôle.",
          ],
        },
        {
          title: "Article 17 – Continuité d'activité",
          paragraphs: [
            "Caisty maintient des procédures d'urgence et de reprise pour les services critiques (notamment redondance, sauvegardes chiffrées, tests de restauration, plans d'urgence). Les RTO/RPO garantis ne s'appliquent que dans le cadre d'un SLA écrit séparé.",
          ],
        },
        {
          title: "Article 18 – Audits",
          paragraphs: [
            "Le Responsable peut demander des preuves de conformité raisonnables (documentation de sécurité, rapports d'audit, certificats, questionnaires, descriptions des MTO). Audits sur site uniquement si légalement requis et non remplaçables par documentation – de bonne foi, pendant les heures ouvrables habituelles, sans perturbation disproportionnée, sous confidentialité. Les coûts sont généralement supportés par le Responsable.",
          ],
        },
      ],
    },
    {
      title: "Partie III – Sous-traitants ultérieurs et transferts internationaux",
      subsections: [
        {
          title: "Article 19 – Sous-traitants ultérieurs autorisés",
          paragraphs: [
            "Le Responsable accorde à Caisty une autorisation générale d'engager des sous-traitants ultérieurs, sous réserve d'obligations contractuelles équivalentes en matière de protection des données. Les services peuvent inclure hébergement, infrastructure, stockage, sauvegarde, paiement, e-mail, surveillance, cybersécurité, authentification et support. Caisty reste responsable ; l'engagement ne libère pas Caisty de ses obligations DPA.",
          ],
        },
        {
          title: "Article 20 – Engagement de nouveaux sous-traitants ultérieurs",
          paragraphs: [
            "Caisty peut engager des sous-traitants ultérieurs supplémentaires si nécessaire pour les services. Caisty :",
            "En cas d'opposition justifiée, les parties recherchent une solution de bonne foi ; si cela échoue et que l'opposition est juridiquement fondée, le traitement concerné peut être arrêté.",
          ],
          list: [
            "tient une liste à jour ;",
            "la publie sur le site web, dans le portail client ou via {{subprocessors}} ;",
            "informe de manière appropriée en cas de modifications substantielles.",
          ],
        },
        {
          title: "Article 21 – Transferts internationaux de données",
          paragraphs: [
            "Les transferts hors EEE n'ont lieu qu'avec des garanties appropriées (décision d'adéquation, clauses contractuelles types de l'UE, certifications, codes de conduite, mesures techniques/organisationnelles supplémentaires) et uniquement dans la mesure requise pour les services. Caisty examine régulièrement les mécanismes de transfert.",
          ],
        },
        {
          title: "Article 22 – Assistance au Responsable",
          paragraphs: [
            "Caisty assiste raisonnablement le Responsable pour les demandes des personnes concernées, les AIPD, les consultations avec les autorités, les mesures de sécurité, la gestion des violations, la documentation de conformité et les demandes réglementaires. Des frais raisonnables peuvent s'appliquer pour une assistance au-delà des obligations standard lorsque contractuellement permis.",
          ],
        },
        {
          title: "Article 23 – Droits des personnes concernées",
          paragraphs: [
            "Caisty assiste le Responsable pour l'accès, la rectification, l'effacement, la limitation, la portabilité, l'opposition et les décisions automatisées, lorsque juridiquement et techniquement possible. Les demandes directes des personnes concernées sont transmises au Responsable ; Caisty ne répond pas directement sauf autorisation ou obligation légale.",
          ],
        },
        {
          title: "Article 24 – Demandes des autorités",
          paragraphs: [
            "Pour les demandes légitimes des autorités, Caisty examine la base juridique, ne divulgue que le nécessaire, met en œuvre les mesures de protection disponibles et informe le Responsable sans délai indu lorsque permis. Aucune divulgation volontaire sauf obligation légale ou approbation expresse du Responsable.",
          ],
        },
        {
          title: "Article 25 – Registre des activités de traitement",
          paragraphs: [
            "Caisty tient des registres de traitement conformément à l'art. 30 RGPD, le cas échéant, et les met à disposition des autorités de contrôle lorsque la loi l'exige. Le Responsable reste responsable de ses propres obligations de registre.",
          ],
        },
      ],
    },
    {
      title: "Partie IV – Restitution, suppression et dispositions finales",
      subsections: [
        {
          title: "Article 26 – Restitution ou suppression des données personnelles",
          paragraphs: [
            "À la fin des services, Caisty – sur instruction et dans la mesure techniquement possible – restitue les données, permet l'export, ou les supprime ou anonymise de manière sécurisée. La conservation est autorisée pour les obligations légales, fiscales, judiciaires ou réglementaires et la défense juridique. Les données restantes restent protégées jusqu'à suppression ou anonymisation.",
          ],
        },
        {
          title: "Article 27 – Responsabilité",
          paragraphs: [
            "Chaque partie est responsable de ses obligations en matière de protection des données. Caisty n'est pas responsable des décisions de traitement prises uniquement par le Responsable lorsque Caisty suit les instructions documentées et les obligations DPA. Le Responsable est responsable des finalités, bases légales, exactitude, consentements et de sa propre conformité. Les dispositions de responsabilité des CGV/CLUF s'appliquent de manière supplémentaire lorsque permis.",
          ],
        },
        {
          title: "Article 28 – Résiliation",
          paragraphs: [
            "Le présent DPA prend fin automatiquement lorsque tout traitement pour le compte du Responsable a cessé et que les relations contractuelles sont terminées, sauf obligations légales persistantes. Les obligations survivantes (confidentialité, protection des données, suppression, responsabilité) restent en vigueur.",
          ],
        },
        {
          title: "Article 29 – Droit applicable",
          paragraphs: [
            "Le présent DPA est régi par le droit de la **République fédérale d'Allemagne** et s'interprète en conséquence, sauf disposition impérative contraire du droit de la protection des données. Les exigences impératives du RGPD ou d'autres lois prévalent. Les litiges sont réglés en complément des dispositions de règlement des litiges des CGV ou d'autres accords contractuels. Les pouvoirs des autorités de contrôle restent inchangés.",
          ],
        },
        {
          title: "Article 30 – Dispositions finales",
          paragraphs: [
            "Le présent DPA constitue l'accord complet sur le traitement et remplace les accords antérieurs sur ce sujet. Les dispositions invalides n'affectent pas les autres. Le non-exercice d'une disposition ne constitue pas une renonciation. Caisty peut modifier le DPA pour des changements juridiques, réglementaires ou techniques ; les modifications substantielles seront communiquées.",
          ],
        },
      ],
    },
    {
      title: "Annexe I – Description du traitement",
      paragraphs: [
        "**Objet :** Fourniture de logiciels métier cloud et services associés.",
        "**Nature du traitement :** Collecte, enregistrement, organisation, stockage, consultation, transmission, synchronisation, hébergement, sauvegarde, restauration, suppression, anonymisation.",
        "**Finalité :** Fourniture des services, licences logicielles, portail client, synchronisation cloud, support, sécurité, maintenance, reprise après sinistre.",
        "**Catégories de données personnelles :** Données d'identification, de contact, d'authentification, de facturation, de transaction, employés, clients, journaux techniques et données d'appareils.",
        "**Catégories de personnes concernées :** Clients, utilisateurs, employés, clients/fournisseurs du Responsable, sous-traitants, conseillers et autres personnes saisies dans les services.",
      ],
    },
    {
      title: "Annexe II – Mesures techniques et organisationnelles (MTO)",
      paragraphs: [
        "Caisty maintient des MTO appropriées, notamment :",
        "Les mesures sont revues régulièrement et peuvent être mises à jour pour autant que le niveau de protection ne soit pas sensiblement réduit.",
      ],
      list: [
        "chiffrement en transit et – le cas échéant – au repos ;",
        "contrôle d'accès basé sur les rôles, administration au moindre privilège ;",
        "authentification sécurisée, hachage des mots de passe, MFA lorsque disponible ;",
        "sécurité réseau, pare-feu, protection contre vulnérabilités et malware ;",
        "surveillance d'infrastructure, journalisation de sécurité ;",
        "sauvegardes chiffrées, reprise après sinistre, continuité d'activité ;",
        "confidentialité du personnel, revues de sécurité régulières, réponse aux incidents.",
      ],
    },
    {
      title: "Annexe III – Sous-traitants ultérieurs autorisés",
      paragraphs: [
        "Selon les services utilisés, des sous-traitants ultérieurs peuvent être engagés pour l'hébergement, l'infrastructure, les paiements, l'e-mail, l'authentification, la surveillance, la cybersécurité, la sauvegarde et le support.",
        "La liste actuelle et contraignante des sous-traitants ultérieurs autorisés est disponible sur {{subprocessors}}.",
      ],
    },
  ],
  contactSectionTitle: "Parties / Contact",
  contactSectionIntro: "Pour toute question concernant ce DPA, contactez-nous à :",
  contact: legalContact.fr,
  related: legalRelatedLabels.fr,
  showOwnerInContact: false,
};
