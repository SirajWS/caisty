import type { Language } from "./types";
import type { TranslationSchema } from "./types";

const contactLocales = {
  en: {
    hero: {
      title: "Contact Us",
      subtitle:
        "We are happy to answer your questions about Caisty, our products and our services.",
    },
    cards: {
      general: {
        title: "General inquiries",
        email: "info@caisty.com",
        description: "For general questions, partnerships and business inquiries.",
      },
      support: {
        title: "Technical Support",
        email: "support@caisty.com",
        description:
          "Need help with your subscription, licenses or technical issues? Our support team is here to help.",
      },
    },
    hours: {
      title: "Business Hours",
      schedule: "Monday – Friday",
      time: "09:00 – 17:00 CET",
    },
    response: {
      title: "Response Time",
      body: "Usually within one business day.",
    },
    form: {
      title: "Send us a message",
      name: "Name",
      email: "Email",
      subject: "Subject",
      message: "Message",
      submit: "Send Message",
      success: "Your email client will open with your message ready to send.",
    },
  },
  de: {
    hero: {
      title: "Kontakt",
      subtitle:
        "Wir beantworten gerne Ihre Fragen zu Caisty, unseren Produkten und unseren Leistungen.",
    },
    cards: {
      general: {
        title: "Allgemeine Anfragen",
        email: "info@caisty.com",
        description: "Für allgemeine Fragen, Partnerschaften und geschäftliche Anfragen.",
      },
      support: {
        title: "Technischer Support",
        email: "support@caisty.com",
        description:
          "Hilfe bei Abonnement, Lizenzen oder technischen Problemen? Unser Support-Team ist für Sie da.",
      },
    },
    hours: {
      title: "Geschäftszeiten",
      schedule: "Montag – Freitag",
      time: "09:00 – 17:00 CET",
    },
    response: {
      title: "Antwortzeit",
      body: "In der Regel innerhalb eines Werktags.",
    },
    form: {
      title: "Nachricht senden",
      name: "Name",
      email: "E-Mail",
      subject: "Betreff",
      message: "Nachricht",
      submit: "Nachricht senden",
      success: "Ihr E-Mail-Programm öffnet sich mit Ihrer vorbereiteten Nachricht.",
    },
  },
  fr: {
    hero: {
      title: "Contact",
      subtitle:
        "Nous répondons volontiers à vos questions sur Caisty, nos produits et nos services.",
    },
    cards: {
      general: {
        title: "Demandes générales",
        email: "info@caisty.com",
        description: "Questions générales, partenariats et demandes commerciales.",
      },
      support: {
        title: "Support technique",
        email: "support@caisty.com",
        description:
          "Besoin d’aide avec votre abonnement, vos licences ou un problème technique ? Notre équipe support est là pour vous.",
      },
    },
    hours: {
      title: "Heures d’ouverture",
      schedule: "Lundi – Vendredi",
      time: "09:00 – 17:00 CET",
    },
    response: {
      title: "Délai de réponse",
      body: "En général sous un jour ouvré.",
    },
    form: {
      title: "Envoyer un message",
      name: "Nom",
      email: "E-mail",
      subject: "Objet",
      message: "Message",
      submit: "Envoyer le message",
      success: "Votre client e-mail s’ouvrira avec votre message prêt à envoyer.",
    },
  },
  ar: {
    hero: {
      title: "اتصل بنا",
      subtitle: "يسعدنا الإجابة على أسئلتك حول Caisty ومنتجاتنا وخدماتنا.",
    },
    cards: {
      general: {
        title: "استفسارات عامة",
        email: "info@caisty.com",
        description: "للأسئلة العامة والشراكات والاستفسارات التجارية.",
      },
      support: {
        title: "الدعم الفني",
        email: "support@caisty.com",
        description:
          "تحتاج مساعدة في الاشتراك أو التراخيص أو مشكلة تقنية؟ فريق الدعم جاهز لمساعدتك.",
      },
    },
    hours: {
      title: "ساعات العمل",
      schedule: "الاثنين – الجمعة",
      time: "09:00 – 17:00 CET",
    },
    response: {
      title: "وقت الاستجابة",
      body: "عادةً خلال يوم عمل واحد.",
    },
    form: {
      title: "أرسل رسالة",
      name: "الاسم",
      email: "البريد الإلكتروني",
      subject: "الموضوع",
      message: "الرسالة",
      submit: "إرسال الرسالة",
      success: "سيفتح برنامج البريد مع رسالتك جاهزة للإرسال.",
    },
  },
};

export type ContactCopy = TranslationSchema<(typeof contactLocales)["en"]>;
export const contact: Record<Language, ContactCopy> = contactLocales;
