// apps/caisty-site/src/routes/ImprintPage.tsx
export default function ImprintPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold">Impressum</h1>
      </div>

      <div className="prose prose-invert prose-sm max-w-none space-y-6 text-slate-300">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-100">Angaben gemäß § 5 TMG</h2>
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800 space-y-2">
            <p className="font-semibold text-slate-100">Caisty</p>
            <p>Musterstraße 123</p>
            <p>12345 Musterstadt</p>
            <p>Deutschland</p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-100">Kontakt</h2>
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800 space-y-2">
            <p>
              E-Mail: <a href="mailto:info@caisty.com" className="text-emerald-400 hover:underline">info@caisty.com</a>
            </p>
            <p>
              Support: <a href="mailto:support@caisty.com" className="text-emerald-400 hover:underline">support@caisty.com</a>
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-100">Hinweis</h2>
          <p className="text-sm text-slate-400 italic">
            Diese Angaben sind Platzhalter. Bitte ersetzen Sie diese durch die tatsächlichen 
            Firmendaten, sobald die Firma gegründet wurde.
          </p>
        </section>
      </div>
    </div>
  );
}

