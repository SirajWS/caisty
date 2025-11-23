export default function RegisterPage() {
  return (
    <section className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/70 p-6 space-y-6 shadow-xl shadow-slate-950/50">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Konto erstellen</h1>
          <p className="text-xs text-slate-400">
            Lege dein Caisty-Konto an. In M7-C verknüpfen wir das direkt mit
            Subscription &amp; Payments.
          </p>
        </div>

        <form className="space-y-3 text-sm">
          <div className="space-y-1.5">
            <label className="text-slate-200">Name / Store-Name</label>
            <input
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 outline-none focus:border-emerald-500"
              placeholder="MixMax Chapati"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-slate-200">E-Mail</label>
            <input
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 outline-none focus:border-emerald-500"
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-slate-200">Passwort</label>
            <input
              type="password"
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 outline-none focus:border-emerald-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="button"
            className="w-full rounded-full bg-emerald-500 py-2 font-medium text-slate-950 hover:bg-emerald-400"
          >
            Konto anlegen (Dummy)
          </button>
        </form>

        <p className="text-xs text-slate-400 text-center">
          Schon ein Konto?{" "}
          <a href="/login" className="text-emerald-400 hover:text-emerald-300">
            Zum Login
          </a>
        </p>
      </div>
    </section>
  );
}
