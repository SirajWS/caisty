import type { Language } from "./types";
import type { TranslationSchema } from "./types";

const worktrackLocales = {
  en: {
    documentTitle: "Caisty Staff",
    hero: {
      badge: "Coming soon",
      title: "Caisty Staff",
      subtitle: "Workforce management and employee time tracking for modern teams.",
    },
    featuresTitle: "Planned capabilities",
    features: [
      "Time tracking",
      "Shift planning",
      "Employee check-in",
      "Team management",
      "Attendance",
      "Reports",
      "Leave management",
      "Workforce insights",
    ],
    whyTitle: "Why Caisty Staff",
    whyBody: [
      "Employee time tracking",
      "Workforce scheduling",
      "Team management",
      "Cloud reporting",
    ],
    ctaComingSoon: "Coming soon",
    ctaContact: "Contact us",
  },
  fr: {
    documentTitle: "Caisty Staff",
    hero: {
      badge: "Bientôt disponible",
      title: "Caisty Staff",
      subtitle: "Gestion des équipes et suivi du temps de travail pour les organisations modernes.",
    },
    featuresTitle: "Fonctionnalités prévues",
    features: [
      "Suivi du temps",
      "Planning des shifts",
      "Pointage employés",
      "Gestion d'équipe",
      "Présences",
      "Rapports",
      "Gestion des congés",
      "Indicateurs RH",
    ],
    whyTitle: "Pourquoi Caisty Staff",
    whyBody: [
      "Suivi du temps des employés",
      "Planification des équipes",
      "Gestion d'équipe",
      "Rapports dans le cloud",
    ],
    ctaComingSoon: "Bientôt disponible",
    ctaContact: "Nous contacter",
  },
  de: {
    documentTitle: "Caisty Staff",
    hero: {
      badge: "Demnächst verfügbar",
      title: "Caisty Staff",
      subtitle: "Workforce-Management und Zeiterfassung für moderne Teams.",
    },
    featuresTitle: "Geplante Funktionen",
    features: [
      "Zeiterfassung",
      "Schichtplanung",
      "Mitarbeiter-Check-in",
      "Teamverwaltung",
      "Anwesenheit",
      "Berichte",
      "Urlaubsverwaltung",
      "Workforce-Insights",
    ],
    whyTitle: "Warum Caisty Staff",
    whyBody: [
      "Zeiterfassung für Mitarbeitende",
      "Schichtplanung",
      "Teamverwaltung",
      "Cloud-Berichte",
    ],
    ctaComingSoon: "Demnächst verfügbar",
    ctaContact: "Kontakt",
  },
  ar: {
    documentTitle: "Caisty Staff",
    hero: {
      badge: "قريباً",
      title: "Caisty Staff",
      subtitle: "إدارة القوى البشرية وتتبع الوقت للفرق الحديثة.",
    },
    featuresTitle: "القدرات المخططة",
    features: [
      "تتبع الوقت",
      "تخطيط الورديات",
      "تسجيل حضور الموظفين",
      "إدارة الفريق",
      "الحضور",
      "التقارير",
      "إدارة الإجازات",
      "رؤى القوى العاملة",
    ],
    whyTitle: "لماذا Caisty Staff",
    whyBody: [
      "تتبع وقت الموظفين",
      "جدولة القوى العاملة",
      "إدارة الفريق",
      "التقارير السحابية",
    ],
    ctaComingSoon: "قريباً",
    ctaContact: "تواصل معنا",
  },
};

export type WorkTrackPageCopy = TranslationSchema<(typeof worktrackLocales)["en"]>;
export const worktrackPage: Record<Language, WorkTrackPageCopy> = worktrackLocales;
