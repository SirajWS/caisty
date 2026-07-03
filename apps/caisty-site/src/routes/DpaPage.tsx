import { LegalDocumentPage } from "../components/LegalDocumentPage";
import { translations } from "../lib/translations/index";

export default function DpaPage() {
  return <LegalDocumentPage getCopy={(language) => translations[language].legal.dpa} />;
}
