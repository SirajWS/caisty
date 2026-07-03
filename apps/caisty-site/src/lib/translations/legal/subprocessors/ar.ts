import { legalContact } from "../shared/contact";
import { legalLinkLabels, legalRelatedLabels } from "../shared/labels";
import type { SubprocessorsCopy } from "./types";

export const subprocessorsAr: SubprocessorsCopy = {
  documentLabel: "المعالجون الفرعيون المعتمدون",
  title: "المعالجون الفرعيون",
  lastUpdatedLabel: "آخر تحديث",
  effectiveDate: "1 يوليو 2026",
  intro:
    "تسرد هذه الصفحة المعالجين الفرعيين الذين تستعين بهم Caisty وفقاً للمادة 28(2)(د) من اللائحة العامة لحماية البيانات (GDPR) و{{dpa}} الخاص بنا. يتم تحديث القائمة عند حدوث تغييرات جوهرية.",
  linkLabels: legalLinkLabels.ar,
  sections: [
    {
      title: "نظرة عامة أولية",
      notice:
        "**تنبيه:** قائمة المعالجين الفرعيين الرسمية والملزمة قيد الإعداد حالياً. المزوّدون المذكورون أدناه هم فئات نموذجية قد تستخدمها Caisty بحسب الخدمة. بمجرد نشر القائمة النهائية، ستحل محل هذه النظرة العامة الأولية.",
      table: {
        headers: ["المزوّد", "الغرض"],
        rows: [
          ["Hetzner", "استضافة سحابية وبنية تحتية"],
          ["Stripe", "معالجة المدفوعات"],
          ["PayPal", "معالجة المدفوعات"],
          ["Vercel", "استضافة الموقع ونشره"],
          ["Google", "مصادقة OAuth (عند التفعيل)"],
        ],
      },
    },
  ],
  contactSectionTitle: "الاتصال",
  contactSectionIntro: "أسئلة حول المعالجة الفرعية: {{privacyEmail}}",
  contact: legalContact.ar,
  related: legalRelatedLabels.ar,
};
