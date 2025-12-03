// apps/caisty-site/src/routes/TermsPage.tsx

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold">Allgemeine Geschäftsbedingungen</h1>
        <p className="text-sm text-slate-400">
          Stand: {new Date().toLocaleDateString("de-DE", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="prose prose-invert prose-sm max-w-none space-y-6 text-slate-300">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-100">1. Geltungsbereich</h2>
          <p>
            Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge zwischen Caisty (nachfolgend "Anbieter" oder "wir") 
            und den Nutzern (nachfolgend "Kunde" oder "Sie") der Caisty POS & Cloud Platform.
          </p>
          <p>
            Abweichende Bedingungen des Kunden werden nicht anerkannt, es sei denn, der Anbieter stimmt ihrer Geltung ausdrücklich schriftlich zu.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-100">2. Vertragsgegenstand</h2>
          <p>
            Caisty bietet eine Cloud-basierte POS-Software (Point of Sale) mit zugehörigem Kundenportal an. 
            Der Vertragsgegenstand umfasst:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Die Caisty POS Software für den Betrieb auf Kassen-PCs</li>
            <li>Zugang zum Caisty Kundenportal zur Verwaltung von Lizenzen, Geräten und Rechnungen</li>
            <li>Cloud-Services für die Synchronisation und Verwaltung</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-100">3. Registrierung und Konto</h2>
          <p>
            Für die Nutzung von Caisty ist eine Registrierung erforderlich. Der Kunde verpflichtet sich, 
            wahrheitsgemäße und vollständige Angaben zu machen und diese bei Änderungen zu aktualisieren.
          </p>
          <p>
            Der Kunde ist für die Geheimhaltung seiner Zugangsdaten verantwortlich und haftet für alle 
            Handlungen, die unter Verwendung seiner Zugangsdaten erfolgen.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-100">4. Lizenzen und Preise</h2>
          <p>
            Caisty bietet verschiedene Lizenzmodelle (Trial, Starter, Pro) mit unterschiedlichen Preisen 
            und Funktionsumfängen. Die aktuellen Preise sind im Kundenportal und auf der Website einsehbar.
          </p>
          <p>
            Alle Preise verstehen sich in Euro zzgl. der gesetzlichen Mehrwertsteuer. Die Abrechnung 
            erfolgt monatlich oder jährlich je nach gewähltem Plan.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-100">5. Zahlungsbedingungen</h2>
          <p>
            Die Zahlung erfolgt per PayPal oder anderen im Kundenportal angegebenen Zahlungsmethoden. 
            Bei Zahlungsverzug behält sich der Anbieter vor, den Zugang zum Service zu sperren.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-100">6. Leistungsumfang und Verfügbarkeit</h2>
          <p>
            Der Anbieter bemüht sich um eine hohe Verfügbarkeit der Services, kann jedoch keine 
            Garantie für eine unterbrechungsfreie Verfügbarkeit geben. Geplante Wartungsarbeiten 
            werden nach Möglichkeit im Voraus angekündigt.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-100">7. Kündigung</h2>
          <p>
            Der Kunde kann seinen Vertrag jederzeit mit einer Frist von einem Monat zum Monatsende kündigen. 
            Die Kündigung erfolgt über das Kundenportal oder per E-Mail an support@caisty.com.
          </p>
          <p>
            Der Anbieter kann den Vertrag aus wichtigem Grund fristlos kündigen, insbesondere bei 
            Verstößen gegen diese AGB oder bei Zahlungsverzug.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-100">8. Haftung</h2>
          <p>
            Der Anbieter haftet nur für Vorsatz und grobe Fahrlässigkeit. Die Haftung für leichte 
            Fahrlässigkeit ist ausgeschlossen, soweit nicht Schäden aus der Verletzung des Lebens, 
            des Körpers oder der Gesundheit resultieren.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-100">9. Datenschutz</h2>
          <p>
            Der Umgang mit personenbezogenen Daten erfolgt in Übereinstimmung mit der 
            Datenschutzerklärung, die unter /privacy einsehbar ist.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-100">10. Schlussbestimmungen</h2>
          <p>
            Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts. Gerichtsstand ist der 
            Geschäftssitz des Anbieters.
          </p>
          <p>
            Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die 
            Wirksamkeit der übrigen Bestimmungen unberührt.
          </p>
        </section>
      </div>
    </div>
  );
}

