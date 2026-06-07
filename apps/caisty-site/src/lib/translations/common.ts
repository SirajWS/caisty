// Gemeinsame Übersetzungen (Buttons, Labels, etc.)
import type { Language } from "./types";

export const common: Record<
  Language,
  {
    buttons: {
      login: string;
      register: string;
      startFree: string;
      viewPricing: string;
      logout: string;
      save: string;
      cancel: string;
      delete: string;
      edit: string;
      back: string;
      next: string;
      submit: string;
    };
    nav: {
      product: string;
      pricing: string;
      payment: string;
      fiscal: string;
      dashboard: string;
      licenses: string;
      plan: string;
      devices: string;
      invoices: string;
      support: string;
      account: string;
    };
    layout: {
      menuOpen: string;
      menuClose: string;
      tagline: string;
    };
    footer: {
      brandTagline: string;
      contactTitle: string;
      legalTitle: string;
      terms: string;
      privacy: string;
      imprint: string;
      followTitle: string;
      facebook: string;
      instagram: string;
      youtube: string;
      copyright: string;
      companyNote: string;
    };
  }
> = {
  en: {
    buttons: {
      login: "Login",
      register: "Register",
      startFree: "Start free",
      viewPricing: "View pricing",
      logout: "Logout",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      back: "Back",
      next: "Next",
      submit: "Submit",
    },
    nav: {
      product: "Product",
      pricing: "Pricing",
      payment: "Payment",
      fiscal: "Fiscal info",
      dashboard: "Dashboard",
      licenses: "Licenses",
      plan: "Plans",
      devices: "Devices",
      invoices: "Invoices",
      support: "Support",
      account: "Account",
    },
    layout: {
      menuOpen: "Open menu",
      menuClose: "Close menu",
      tagline: "POS & cloud software for modern businesses",
    },
    footer: {
      brandTagline: "Modern POS and cloud software for restaurants, cafés and small shops.",
      contactTitle: "Contact",
      legalTitle: "Legal",
      terms: "Terms and Conditions",
      privacy: "Privacy Policy",
      imprint: "Imprint",
      followTitle: "Follow us",
      facebook: "Facebook",
      instagram: "Instagram",
      youtube: "YouTube",
      copyright: "© 2026 Caisty. All rights reserved.",
      companyNote: "Company details will be updated after final company registration.",
    },
  },
  fr: {
    buttons: {
      login: "Connexion",
      register: "S'inscrire",
      startFree: "Commencer gratuitement",
      viewPricing: "Voir les tarifs",
      logout: "Déconnexion",
      save: "Enregistrer",
      cancel: "Annuler",
      delete: "Supprimer",
      edit: "Modifier",
      back: "Retour",
      next: "Suivant",
      submit: "Envoyer",
    },
    nav: {
      product: "Produit",
      pricing: "Tarifs",
      payment: "Paiement",
      fiscal: "Infos fiscales",
      dashboard: "Tableau de bord",
      licenses: "Licences",
      plan: "Plans",
      devices: "Appareils",
      invoices: "Factures",
      support: "Support",
      account: "Compte",
    },
    layout: {
      menuOpen: "Ouvrir le menu",
      menuClose: "Fermer le menu",
      tagline: "Logiciel POS & cloud pour les entreprises modernes",
    },
    footer: {
      brandTagline:
        "Solution POS et cloud moderne pour restaurants, cafés et petits commerces.",
      contactTitle: "Contact",
      legalTitle: "Mentions légales",
      terms: "Conditions générales",
      privacy: "Politique de confidentialité",
      imprint: "Mentions légales / éditeur",
      followTitle: "Suivez-nous",
      facebook: "Facebook",
      instagram: "Instagram",
      youtube: "YouTube",
      copyright: "© 2026 Caisty. Tous droits réservés.",
      companyNote:
        "Les informations sur la société seront mises à jour après l'immatriculation définitive.",
    },
  },
  de: {
    buttons: {
      login: "Login",
      register: "Registrieren",
      startFree: "Kostenlos starten",
      viewPricing: "Preise ansehen",
      logout: "Abmelden",
      save: "Speichern",
      cancel: "Abbrechen",
      delete: "Löschen",
      edit: "Bearbeiten",
      back: "Zurück",
      next: "Weiter",
      submit: "Absenden",
    },
    nav: {
      product: "Produkt",
      pricing: "Preise",
      payment: "Zahlung",
      fiscal: "Steuer / Fiskal",
      dashboard: "Dashboard",
      licenses: "Lizenzen",
      plan: "Pläne",
      devices: "Geräte",
      invoices: "Rechnungen",
      support: "Support",
      account: "Konto",
    },
    layout: {
      menuOpen: "Menü öffnen",
      menuClose: "Menü schließen",
      tagline: "POS- & Cloud-Software für moderne Betriebe",
    },
    footer: {
      brandTagline:
        "Moderne POS- und Cloud-Software für Restaurants, Cafés und kleine Läden.",
      contactTitle: "Kontakt",
      legalTitle: "Rechtliches",
      terms: "Allgemeine Geschäftsbedingungen",
      privacy: "Datenschutzerklärung",
      imprint: "Impressum",
      followTitle: "Folge uns",
      facebook: "Facebook",
      instagram: "Instagram",
      youtube: "YouTube",
      copyright: "© 2026 Caisty. Alle Rechte vorbehalten.",
      companyNote:
        "Angaben zum Unternehmen werden nach finaler Firmengründung ergänzt.",
    },
  },
  ar: {
    buttons: {
      login: "تسجيل الدخول",
      register: "التسجيل",
      startFree: "ابدأ مجاناً",
      viewPricing: "عرض الأسعار",
      logout: "تسجيل الخروج",
      save: "حفظ",
      cancel: "إلغاء",
      delete: "حذف",
      edit: "تعديل",
      back: "رجوع",
      next: "التالي",
      submit: "إرسال",
    },
    nav: {
      product: "المنتج",
      pricing: "الأسعار",
      payment: "الدفع",
      fiscal: "المعلومات الضريبية",
      dashboard: "لوحة التحكم",
      licenses: "التراخيص",
      plan: "الخطط",
      devices: "الأجهزة",
      invoices: "الفواتير",
      support: "الدعم",
      account: "الحساب",
    },
    layout: {
      menuOpen: "فتح القائمة",
      menuClose: "إغلاق القائمة",
      tagline: "برنامج نقاط بيع وسحابة للأعمال الحديثة",
    },
    footer: {
      brandTagline: "برنامج نقاط بيع وسحابة حديث للمطاعم والمقاهي والمتاجر الصغيرة.",
      contactTitle: "اتصل بنا",
      legalTitle: "قانوني",
      terms: "الشروط والأحكام",
      privacy: "سياسة الخصوصية",
      imprint: "بيانات الناشر",
      followTitle: "تابعنا",
      facebook: "فيسبوك",
      instagram: "إنستغرام",
      youtube: "يوتيوب",
      copyright: "© 2026 Caisty. جميع الحقوق محفوظة.",
      companyNote: "ستُحدَّث بيانات الشركة بعد اكتمال التسجيل النهائي.",
    },
  },
};
