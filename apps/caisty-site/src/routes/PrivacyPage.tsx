// apps/caisty-site/src/routes/PrivacyPage.tsx
export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold">Datenschutzerklärung</h1>
        <p className="text-sm text-slate-400">
          Stand: {new Date().toLocaleDateString("de-DE", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="prose prose-invert prose-sm max-w-none space-y-6 text-slate-300">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-100">1. Verantwortlicher</h2>
          <p>
            Verantwortlicher für die Datenverarbeitung ist:
          </p>
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
            <p className="font-semibold text-slate-100">Caisty</p>
            <p className="text-sm">Musterstraße 123</p>
            <p className="text-sm">12345 Musterstadt</p>
            <p className="text-sm">Deutschland</p>
            <p className="text-sm mt-2">
              E-Mail: <a href="mailto:privacy@caisty.com" className="text-emerald-400 hover:underline">privacy@caisty.com</a>
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-100">2. Erhebung und Speicherung personenbezogener Daten</h2>
          <p>
            Wir erheben und speichern personenbezogene Daten, die Sie uns im Rahmen der Registrierung 
            und Nutzung unserer Services zur Verfügung stellen:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Name und E-Mail-Adresse</li>
            <li>Rechnungsadresse (falls angegeben)</li>
            <li>Zahlungsinformationen (über PayPal, nicht direkt bei uns gespeichert)</li>
            <li>Nutzungsdaten (Lizenzen, Geräte, Rechnungen)</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-100">3. Zweck der Datenverarbeitung</h2>
          <p>
            Wir verwenden Ihre Daten ausschließlich für:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Die Bereitstellung und Verwaltung Ihres Caisty-Kontos</li>
            <li>Die Abrechnung und Rechnungsstellung</li>
            <li>Die Kommunikation bezüglich Ihrer Nutzung unserer Services</li>
            <li>Die Erfüllung gesetzlicher Verpflichtungen</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-100">4. Weitergabe von Daten</h2>
          <p>
            Wir geben Ihre Daten nicht an Dritte weiter, außer:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>An Zahlungsdienstleister (PayPal) zur Abwicklung von Zahlungen</li>
            <li>Wenn wir gesetzlich dazu verpflichtet sind</li>
            <li>Mit Ihrer ausdrücklichen Einwilligung</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-100">5. Ihre Rechte</h2>
          <p>
            Sie haben das Recht:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Auskunft über Ihre gespeicherten Daten zu erhalten</li>
            <li>Berichtigung unrichtiger Daten zu verlangen</li>
            <li>Löschung Ihrer Daten zu verlangen</li>
            <li>Einschränkung der Verarbeitung zu verlangen</li>
            <li>Widerspruch gegen die Verarbeitung einzulegen</li>
            <li>Datenübertragbarkeit zu verlangen</li>
          </ul>
          <p>
            Kontaktieren Sie uns hierfür unter: <a href="mailto:privacy@caisty.com" className="text-emerald-400 hover:underline">privacy@caisty.com</a>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-100">6. Cookies und Tracking</h2>
          <p>
            Wir verwenden technisch notwendige Cookies für die Funktionalität unserer Website. 
            Weitere Tracking-Technologien werden nur mit Ihrer Einwilligung verwendet.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-100">7. Datensicherheit</h2>
          <p>
            Wir setzen technische und organisatorische Maßnahmen ein, um Ihre Daten vor unbefugtem 
            Zugriff, Verlust oder Zerstörung zu schützen.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-100">8. Änderungen dieser Datenschutzerklärung</h2>
          <p>
            Wir behalten uns vor, diese Datenschutzerklärung anzupassen. Die aktuelle Version ist 
            jederzeit auf dieser Seite abrufbar.
          </p>
        </section>
      </div>
    </div>
  );
}

