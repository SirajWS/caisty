import { legalContact } from "../shared/contact";
import { legalLinkLabels, legalRelatedLabels } from "../shared/labels";
import type { PrivacyCopy } from "./types";

const { imprintNote: _imprintNote, ...privacyContactFr } = legalContact.fr;

export const privacyFr: PrivacyCopy = {
  documentLabel: "Mentions légales",
  title: "Politique de confidentialité",
  lastUpdatedLabel: "Dernière mise à jour",
  effectiveDate: "1er juillet 2026",
  intro:
    "La présente politique de confidentialité explique comment Caisty collecte, utilise, conserve et protège les données personnelles lorsque vous utilisez notre site web, Caisty POS, le portail client et les services associés. Elle fait partie du cadre juridique de Caisty et doit être lue conjointement avec les {{terms}}, la {{cookie}}, le {{eula}} et — le cas échéant — le {{dpa}}.",
  linkLabels: legalLinkLabels.fr,
  sections: [
    {
      title: "1. Responsable du traitement",
      paragraphs: [
        "Le responsable du traitement au sens du Règlement général sur la protection des données (RGPD) est :",
        "Caisty, propriétaire Siraj Bettaieb, Mollwitzstraße 5A, 14059 Berlin, Allemagne. Demandes générales : {{infoEmail}}. Support : {{supportEmail}}. Confidentialité : {{privacyEmail}}.",
        "Lorsque Caisty traite des données personnelles pour le compte de clients professionnels, Caisty peut agir en qualité de sous-traitant au sens de l'art. 28 RGPD. Les détails figurent dans le {{dpa}}.",
      ],
    },
    {
      title: "2. Champ d'application",
      paragraphs: [
        "La présente politique s'applique au traitement des données personnelles en lien avec :",
        "Elle s'applique que vous utilisiez nos services via le site web, le logiciel, le portail ou d'autres voies d'accès autorisées — avant, pendant et après une relation contractuelle, dans la mesure où les données continuent d'être traitées conformément à la loi.",
      ],
      list: [
        "le site web caisty.com et ses sous-pages ;",
        "Caisty POS (logiciel de bureau et fonctionnalités cloud associées) ;",
        "le portail client Caisty ;",
        "les services cloud, la synchronisation et les fonctions de gestion ;",
        "la licence, l'activation et la gestion des appareils ;",
        "la facturation, l'émission de factures et la gestion des abonnements ;",
        "les communications de support et les demandes clients ;",
        "les API et interfaces techniques, lorsqu'elles sont proposées.",
      ],
    },
    {
      title: "3. Données que nous traitons",
      paragraphs: [
        "Selon les services utilisés, nous pouvons traiter différentes catégories de données personnelles, notamment :",
        "Les mots de passe ne sont pas stockés en clair. Les données métier que vous saisissez dans Caisty POS ou le portail (p. ex. articles, commandes, clients de votre établissement) peuvent contenir des données personnelles de tiers ; en tant qu'exploitant, vous restez responsable de leur traitement licite.",
      ],
      list: [
        "nom et coordonnées ;",
        "raison sociale ou nom de l'entreprise ;",
        "adresse e-mail ;",
        "informations de facturation et de paiement ;",
        "données de compte (identifiant, paramètres de langue, informations de profil) ;",
        "données de licence (clé, formule, statut, durée) ;",
        "données d'appareil (identifiants, système d'exploitation, version de l'application, statut d'activation) ;",
        "adresse IP et données de connexion ;",
        "journaux techniques et rapports d'erreur ;",
        "messages de support et contenus de communication ;",
        "statut de paiement et références de transaction (sans données complètes de carte chez Caisty).",
      ],
    },
    {
      title: "4. Finalités du traitement",
      paragraphs: ["Nous traitons les données personnelles notamment aux fins suivantes :"],
      list: [
        "création et gestion des comptes clients ;",
        "vérification par e-mail et authentification ;",
        "inscription, connexion et contrôle d'accès ;",
        "activation, gestion des licences et attribution des appareils ;",
        "gestion des abonnements et des contrats ;",
        "facturation et comptabilité ;",
        "confirmation des paiements et relances ;",
        "support client et traitement des demandes ;",
        "sécurité, prévention de la fraude et détection des abus ;",
        "exploitation, maintenance et amélioration de nos services ;",
        "respect des obligations légales.",
      ],
    },
    {
      title: "5. Bases juridiques",
      paragraphs: ["Le traitement repose sur le RGPD, notamment :"],
      list: [
        "**Art. 6(1)(b) RGPD** — pour les mesures précontractuelles et l'exécution du contrat (compte, licence, facturation, support) ;",
        "**Art. 6(1)(c) RGPD** — pour le respect d'obligations légales (p. ex. conservation fiscale et commerciale) ;",
        "**Art. 6(1)(f) RGPD** — sur la base d'intérêts légitimes (p. ex. sécurité informatique, stabilité, analyse des erreurs, amélioration du service), lorsque vos intérêts ne prévalent pas ;",
        "**Art. 6(1)(a) RGPD** — sur la base de votre consentement lorsqu'il est requis (p. ex. cookies non essentiels ou communications marketing optionnelles).",
      ],
    },
    {
      title: "6. Prestataires de paiement",
      paragraphs: [
        "Les paiements peuvent être traités par des prestataires externes tels que **Stripe**, **PayPal** ou d'autres fournisseurs affichés dans le portail client.",
        "Caisty ne conserve pas les données complètes de carte bancaire. Les informations de paiement sont traitées directement par le prestataire concerné. Nous recevons en règle générale uniquement le statut du paiement, l'identifiant de transaction, le montant et des métadonnées de facturation limitées nécessaires au contrat et à la comptabilité.",
        "Le traitement par les prestataires de paiement est régi par leurs propres notices de confidentialité. Nous vous recommandons de les consulter lors du paiement.",
      ],
    },
    {
      title: "7. Hébergement et prestataires",
      paragraphs: [
        "Pour fournir nos services, nous faisons appel à des prestataires soigneusement sélectionnés, notamment pour :",
        "Ces prestataires ne traitent les données qu'au strict nécessaire et — lorsqu'ils agissent en qualité de sous-traitants — sur la base d'accords contractuels conformes à l'art. 28 RGPD. Nous tenons une vue d'ensemble séparée des principaux {{subprocessors}}.",
        "Un traitement en dehors de l'Espace économique européen n'a lieu que lorsque des garanties appropriées existent (p. ex. clauses contractuelles types).",
      ],
      list: [
        "l'hébergement et l'infrastructure cloud ;",
        "le stockage et l'exploitation des applications ;",
        "l'envoi d'e-mails et les communications transactionnelles ;",
        "le traitement des paiements ;",
        "les services de sécurité et de surveillance.",
      ],
    },
    {
      title: "8. Cookies",
      paragraphs: [
        "Notre site et nos services peuvent utiliser des cookies et technologies similaires, par exemple pour la connexion, la sécurité, les paramètres de langue ou — avec consentement — l'analyse.",
        "Les détails sur les cookies utilisés, leur durée de conservation et vos choix figurent dans notre {{cookie}}.",
      ],
    },
    {
      title: "9. Durée de conservation",
      paragraphs: [
        "Nous conservons les données personnelles uniquement le temps nécessaire aux finalités décrites ou lorsque des obligations légales de conservation s'appliquent.",
        "Les données contractuelles et de facturation peuvent être conservées pendant la relation contractuelle et au-delà conformément au droit commercial et fiscal. Les messages de support et journaux techniques ne sont conservés que le temps requis pour le support, la sécurité ou la preuve.",
        "À l'expiration des délais applicables, les données sont supprimées ou anonymisées, sauf si une conservation ultérieure est légalement autorisée ou requise.",
      ],
    },
    {
      title: "10. Vos droits",
      paragraphs: [
        "Sous réserve des conditions applicables, vous disposez des droits suivants au titre du RGPD :",
        "Pour exercer vos droits, contactez {{privacyEmail}}. Vous avez également le droit d'introduire une réclamation auprès d'une autorité de contrôle, notamment dans l'État membre de l'UE de votre résidence, de votre lieu de travail ou du lieu de la violation présumée.",
      ],
      list: [
        "**Droit d'accès** (art. 15 RGPD) aux informations sur le traitement de vos données ;",
        "**Droit de rectification** (art. 16 RGPD) des données inexactes ;",
        "**Droit à l'effacement** (art. 17 RGPD), sous réserve des obligations de conservation ;",
        "**Droit à la limitation du traitement** (art. 18 RGPD) ;",
        "**Droit à la portabilité** (art. 20 RGPD), le cas échéant ;",
        "**Droit d'opposition** (art. 21 RGPD) aux traitements fondés sur l'intérêt légitime ;",
        "**Droit de retirer votre consentement** (art. 7(3) RGPD) pour l'avenir.",
      ],
    },
    {
      title: "11. Sécurité",
      paragraphs: [
        "Caisty met en œuvre des mesures techniques et organisationnelles appropriées pour protéger les données personnelles contre l'accès non autorisé, la perte, la manipulation ou la divulgation, notamment :",
        "Une sécurité absolue ne peut être garantie. Vous êtes également responsable de la protection de vos identifiants et des appareils sur lesquels Caisty POS est utilisé.",
      ],
      list: [
        "communications chiffrées (p. ex. TLS/HTTPS) ;",
        "stockage sécurisé des mots de passe (hachage) ;",
        "contrôle d'accès basé sur les rôles ;",
        "sauvegardes régulières et procédures de restauration ;",
        "surveillance et journalisation des événements liés à la sécurité ;",
        "mises à jour et améliorations de sécurité régulières.",
      ],
    },
  ],
  contactSectionTitle: "12. Contact",
  contactSectionIntro:
    "Pour toute question relative à la confidentialité, à l'exercice de vos droits ou à la présente politique, vous pouvez nous contacter : Nous pouvons adapter cette politique lorsque le cadre juridique, nos services ou nos traitements évoluent. La version en vigueur est toujours disponible sur cette page.",
  contact: privacyContactFr,
  related: legalRelatedLabels.fr,
  showOwnerInContact: false,
};
