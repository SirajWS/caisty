import type { Language } from "./types";
import type { TranslationSchema } from "./types";

const shiftiqLocales = {
  en: {
    documentTitle: "ShiftIQ",
    hero: {
      badge: "Coming soon",
      title: "ShiftIQ",
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
    whyTitle: "Why ShiftIQ",
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
    documentTitle: "ShiftIQ",
    hero: {
      badge: "Bientôt disponible",
      title: "ShiftIQ",
      subtitle: "Gestion des équipes et suivi du temps de travail pour les organisations modernes.",
    },
    featuresTitle: "Fonctionnalités prévues",
    features: [
      "Suivi du temps",
      "Planning des shifts",
      "Pointage employés",
      "Gestion d’équipe",
      "Présences",
      "Rapports",
      "Gestion des congés",
      "Indicateurs RH",
    ],
    whyTitle: "Pourquoi ShiftIQ",
    whyBody: [
      "Suivi du temps des employés",
      "Planification des équipes",
      "Gestion d’équipe",
      "Rapports dans le cloud",
    ],
    ctaComingSoon: "Bientôt disponible",
    ctaContact: "Nous contacter",
  },
  de: {
    documentTitle: "ShiftIQ",
    hero: {
      badge: "Demnächst verfügbar",
      title: "ShiftIQ",
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
    whyTitle: "Warum ShiftIQ",
    whyBody: [
      "Zeiterfassung für Mitarbeitende",
      "Personaleinsatzplanung",
      "Teamführung",
      "Reporting in der Cloud",
    ],
    ctaComingSoon: "Demnächst verfügbar",
    ctaContact: "Kontakt",
  },
  ar: {
    documentTitle: "ShiftIQ",
    hero: {
      badge: "قريباً",
      title: "ShiftIQ",
      subtitle: "إدارة القوى العاملة وتتبع وقت الموظفين للفرق الحديثة.",
    },
    featuresTitle: "القدرات المخطط لها",
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
    whyTitle: "لماذا ShiftIQ",
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

export type ShiftIQPageCopy = TranslationSchema<(typeof shiftiqLocales)["en"]>;
export const shiftiqPage: Record<Language, ShiftIQPageCopy> = shiftiqLocales;
