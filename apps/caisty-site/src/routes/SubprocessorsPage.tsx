import { LegalDocumentPage } from "../components/LegalDocumentPage";
import { translations } from "../lib/translations/index";

export default function SubprocessorsPage() {
  return (
    <LegalDocumentPage
      getCopy={(language) => translations[language].legal.subprocessors}
      includeSubprocessorsInRelated={false}
    />
  );
}
