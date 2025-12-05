// apps/caisty-site/src/routes/PortalAccountPage.tsx
import React from "react";
import {
  changePortalPassword,
  updatePortalAccount,
} from "../lib/portalApi";
import { usePortalOutlet } from "./PortalLayout";
import { useTheme } from "../lib/theme";

const PortalAccountPage: React.FC = () => {
  const { customer, setCustomer } = usePortalOutlet();
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [name, setName] = React.useState(customer.name);
  const [email, setEmail] = React.useState(customer.email);

  const [profileSaving, setProfileSaving] = React.useState(false);
  const [profileError, setProfileError] = React.useState<string | null>(
    null,
  );
  const [profileSuccess, setProfileSuccess] =
    React.useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [newPasswordRepeat, setNewPasswordRepeat] =
    React.useState("");
  const [passwordSaving, setPasswordSaving] =
    React.useState(false);
  const [passwordError, setPasswordError] =
    React.useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] =
    React.useState<string | null>(null);

  // falls sich Customer z.B. nach Reload ändert -> Formular syncen
  React.useEffect(() => {
    setName(customer.name);
    setEmail(customer.email);
  }, [customer.name, customer.email]);

  const primaryLicense = customer.primaryLicense ?? null;

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (
      name.trim() === customer.name &&
      email.trim().toLowerCase() === customer.email.toLowerCase()
    ) {
      setProfileSuccess("Keine Änderungen erkannt.");
      return;
    }

    setProfileSaving(true);
    try {
      const updated = await updatePortalAccount({
        name: name.trim(),
        email: email.trim(),
      });

      // Kontext aktualisieren, Lizenzinfo beibehalten
      setCustomer((prev) => {
        if (!prev) return updated;
        return {
          ...prev,
          ...updated,
          primaryLicense: prev.primaryLicense,
        };
      });

      setProfileSuccess("Konto wurde aktualisiert.");
    } catch (err) {
      console.error(err);
      setProfileError(
        err instanceof Error
          ? err.message
          : "Konto konnte nicht aktualisiert werden.",
      );
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword || !newPassword) {
      setPasswordError("Bitte alle Felder ausfüllen.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError(
        "Das neue Passwort muss mindestens 6 Zeichen haben.",
      );
      return;
    }

    if (newPassword !== newPasswordRepeat) {
      setPasswordError("Die neuen Passwörter stimmen nicht überein.");
      return;
    }

    setPasswordSaving(true);
    try {
      await changePortalPassword({
        currentPassword,
        newPassword,
      });

      setPasswordSuccess("Passwort wurde erfolgreich geändert.");
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordRepeat("");
    } catch (err) {
      console.error(err);
      setPasswordError(
        err instanceof Error
          ? err.message
          : "Passwort konnte nicht geändert werden.",
      );
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className={`text-xl font-semibold tracking-tight ${isLight ? "text-slate-900" : "text-slate-50"}`}>Konto</h1>
        <p className={`text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>
          Stammdaten, Kontaktinformationen und Sicherheitseinstellungen.
        </p>
      </header>

      {/* Stammdaten + aktuelle Lizenz */}
      <section className={`rounded-2xl border p-5 md:p-6 space-y-5 ${isLight ? "border-slate-200 bg-slate-50" : "border-slate-800 bg-slate-900/60"}`}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-slate-100"}`}>
              Stammdaten
            </h2>
            <p className={`text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
              Basisinformationen deines Caisty Kontos.
            </p>
          </div>
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] ${isLight ? "border-slate-300 text-slate-600" : "border-slate-700 text-slate-300"}`}>
            Erste Version – mit einfachen Bearbeitungen
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-3 text-xs">
          <form
            onSubmit={handleProfileSubmit}
            className="space-y-4 md:col-span-2"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <LabeledInput
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <LabeledInput
                label="E-Mail"
                value={email}
                type="email"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {profileError && (
              <div className={`rounded-xl border px-3 py-2 text-[11px] ${isLight ? "border-rose-300 bg-rose-50 text-rose-800" : "border-rose-500/60 bg-rose-500/10 text-rose-200"}`}>
                {profileError}
              </div>
            )}
            {profileSuccess && (
              <div className={`rounded-xl border px-3 py-2 text-[11px] ${isLight ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-emerald-500/60 bg-emerald-500/10 text-emerald-200"}`}>
                {profileSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={profileSaving}
              className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-xs font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
            >
              {profileSaving ? "Speichern…" : "Änderungen speichern"}
            </button>
          </form>

          <div className={`rounded-xl border p-4 space-y-2 text-[11px] ${isLight ? "border-slate-200 bg-white" : "border-slate-800 bg-slate-950/70"}`}>
            <div className={`text-xs font-semibold mb-1 ${isLight ? "text-slate-900" : "text-slate-200"}`}>
              Aktive Lizenz
            </div>
            {primaryLicense ? (
              <>
                <div className={`font-mono text-[11px] break-all ${isLight ? "text-slate-900" : "text-slate-100"}`}>
                  {primaryLicense.key}
                </div>
                <div className={isLight ? "text-slate-600" : "text-slate-300"}>
                  Plan:{" "}
                  <span className="font-medium capitalize">
                    {primaryLicense.plan}
                  </span>
                </div>
                <div className={isLight ? "text-slate-600" : "text-slate-300"}>
                  Status:{" "}
                  <span className="font-medium">
                    {primaryLicense.status}
                  </span>
                </div>
                <div className={isLight ? "text-slate-500" : "text-slate-400"}>
                  Gültig bis:{" "}
                  {primaryLicense.validUntil
                    ? new Date(
                        primaryLicense.validUntil,
                      ).toLocaleString()
                    : "—"}
                </div>
                <p className={`mt-2 ${isLight ? "text-slate-500" : "text-slate-500"}`}>
                  Detailansicht und weitere Lizenzen findest du unter{" "}
                  <span className="font-semibold">„Lizenzen"</span>.
                </p>
              </>
            ) : (
              <p className={isLight ? "text-slate-500" : "text-slate-400"}>
                Aktuell ist in deinem Konto noch keine aktive Lizenz
                hinterlegt. Sobald dir dein Anbieter einen
                Lizenzschlüssel zuweist, erscheint er hier.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Sicherheit / Passwort */}
      <section className={`rounded-2xl border p-5 md:p-6 space-y-4 ${isLight ? "border-slate-200 bg-slate-50" : "border-slate-800 bg-slate-900/60"}`}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-slate-100"}`}>
              Sicherheit
            </h2>
            <p className={`text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
              Zugangsdaten zu deinem Kundenportal.
            </p>
          </div>
        </div>

        <form
          onSubmit={handlePasswordSubmit}
          className="grid gap-4 md:grid-cols-3 text-xs"
        >
          <div className="space-y-3 md:col-span-2">
            <PasswordInput
              label="Aktuelles Passwort"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <PasswordInput
              label="Neues Passwort"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <PasswordInput
              label="Neues Passwort (Wiederholung)"
              value={newPasswordRepeat}
              onChange={(e) =>
                setNewPasswordRepeat(e.target.value)
              }
            />

            {passwordError && (
              <div className={`rounded-xl border px-3 py-2 text-[11px] ${isLight ? "border-rose-300 bg-rose-50 text-rose-800" : "border-rose-500/60 bg-rose-500/10 text-rose-200"}`}>
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className={`rounded-xl border px-3 py-2 text-[11px] ${isLight ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-emerald-500/60 bg-emerald-500/10 text-emerald-200"}`}>
                {passwordSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={passwordSaving}
              className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-xs font-medium disabled:opacity-60 ${isLight ? "border-slate-300 text-slate-900 hover:bg-slate-100" : "border-slate-700 text-slate-100 hover:bg-slate-800"}`}
            >
              {passwordSaving
                ? "Passwort wird geändert…"
                : "Passwort ändern"}
            </button>
          </div>

          <div className={`text-[11px] space-y-2 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
            <div className={`font-semibold ${isLight ? "text-slate-900" : "text-slate-200"}`}>
              Hinweise
            </div>
            <p>
              Dein Passwort wird verschlüsselt gespeichert. Aus
              Sicherheitsgründen können wir es dir nicht im Klartext
              anzeigen.
            </p>
            <p>
              In einer späteren Version kannst du hier zusätzlich
              Zwei-Faktor-Authentifizierung aktivieren.
            </p>
          </div>
        </form>
      </section>

      {/* Daten & Export */}
      <section className={`rounded-2xl border p-5 md:p-6 space-y-3 text-[11px] ${isLight ? "border-slate-200 bg-slate-50 text-slate-600" : "border-slate-800 bg-slate-900/60 text-slate-400"}`}>
        <h2 className={`text-xs font-semibold ${isLight ? "text-slate-900" : "text-slate-200"}`}>
          Daten &amp; Export
        </h2>
        <p>
          Du kannst jederzeit einen Export deiner bei Caisty
          gespeicherten Daten anfordern (z.&nbsp;B. für
          Datenschutz-Anfragen). In einer späteren Version kannst du
          das direkt hier im Portal auslösen.
        </p>
        <p>
          Bis dahin wende dich bitte an{" "}
          <a
            href="mailto:support@caisty.local"
            className={`hover:underline ${isLight ? "text-emerald-600 hover:text-emerald-700" : "text-emerald-300 hover:text-emerald-200"}`}
          >
            support@caisty.local
          </a>
          .
        </p>
      </section>
    </div>
  );
};

const LabeledInput: React.FC<{
  label: string;
  value: string;
  type?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ label, value, type = "text", onChange }) => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  return (
    <div className="space-y-1">
      <div className={`text-[11px] uppercase ${isLight ? "text-slate-500" : "text-slate-500"}`}>
        {label}
      </div>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className={`w-full rounded-lg border px-3 py-2 text-xs outline-none focus:border-emerald-500 ${isLight ? "border-slate-300 bg-white text-slate-900" : "border-slate-800 bg-slate-950/60 text-slate-100"}`}
      />
    </div>
  );
};

const PasswordInput: React.FC<{
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ label, value, onChange }) => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  return (
    <div className="space-y-1">
      <div className={`text-[11px] uppercase ${isLight ? "text-slate-500" : "text-slate-500"}`}>
        {label}
      </div>
      <input
        type="password"
        autoComplete="new-password"
        value={value}
        onChange={onChange}
        className={`w-full rounded-lg border px-3 py-2 text-xs outline-none focus:border-emerald-500 ${isLight ? "border-slate-300 bg-white text-slate-900" : "border-slate-800 bg-slate-950/60 text-slate-100"}`}
      />
    </div>
  );
};

export default PortalAccountPage;
