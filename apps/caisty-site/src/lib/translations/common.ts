// Gemeinsame Übersetzungen (Buttons, Labels, etc.)
import type { Language } from "./types";

export const common: Record<Language, {
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
    dashboard: string;
    licenses: string;
    plan: string;
    devices: string;
    invoices: string;
    support: string;
    account: string;
  };
}> = {
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
      dashboard: "Dashboard",
      licenses: "Lizenzen",
      plan: "Pläne",
      devices: "Geräte",
      invoices: "Rechnungen",
      support: "Support",
      account: "Konto",
    },
  },
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
      dashboard: "Dashboard",
      licenses: "Licenses",
      plan: "Plans",
      devices: "Devices",
      invoices: "Invoices",
      support: "Support",
      account: "Account",
    },
  },
  fr: {
    buttons: {
      login: "Connexion",
      register: "S'inscrire",
      startFree: "Commencer gratuitement",
      viewPricing: "Voir les prix",
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
      dashboard: "Tableau de bord",
      licenses: "Licences",
      plan: "Plans",
      devices: "Appareils",
      invoices: "Factures",
      support: "Support",
      account: "Compte",
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
      dashboard: "لوحة التحكم",
      licenses: "التراخيص",
      plan: "الخطط",
      devices: "الأجهزة",
      invoices: "الفواتير",
      support: "الدعم",
      account: "الحساب",
    },
  },
};

