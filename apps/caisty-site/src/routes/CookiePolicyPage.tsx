import { LegalDocumentPage } from "../components/LegalDocumentPage";
import { translations } from "../lib/translations/index";

export default function CookiePolicyPage() {
  return <LegalDocumentPage getCopy={(language) => translations[language].legal.cookie} />;
}
