// apps/caisty-site/src/routes/PortalAccountPage.tsx
import React from "react";
import {
  changePortalPassword,
  updatePortalAccount,
} from "../lib/portalApi";
import { usePortalOutlet } from "./PortalLayout";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { portalLocaleTag } from "../lib/portalLocale";
import { portalCardShell, portalLicenseStatusBadge, portalPrimaryCta, portalTextLink } from "../lib/portalUi";

const SUPPORT_EMAIL = "support@caisty.local";

const PortalAccountPage: React.FC = () => {
  const { customer, setCustomer } = usePortalOutlet();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = getPortalTranslations(language);
  const locale = portalLocaleTag(language);
  const isLight = theme === "light";

  function formatDate(value: string | null | undefined): string {
    if (!value) return t.labels.dash;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return t.labels.dash;
    return d.toLocaleString(locale);
  }

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
      setProfileSuccess(t.account.noChanges);
      return;
    }

    setProfileSaving(true);
    try {
      const updated = await updatePortalAccount({
        name: name.trim(),
        email: email.trim(),
      });

      setCustomer((prev) => {
        if (!prev) return updated;
        return {
          ...prev,
          ...updated,
          primaryLicense: prev.primaryLicense,
        };
      });

      setProfileSuccess(t.account.updateSuccess);
    } catch (err) {
      console.error(err);
      setProfileError(
        err instanceof Error
          ? err.message
          : t.account.updateError,
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
      setPasswordError(t.account.fillAllFields);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError(t.account.passwordTooShort);
      return;
    }

    if (newPassword !== newPasswordRepeat) {
      setPasswordError(t.account.passwordMismatch);
      return;
    }

    setPasswordSaving(true);
    try {
      await changePortalPassword({
        currentPassword,
        newPassword,
      });

      setPasswordSuccess(t.account.passwordSuccess);
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordRepeat("");
    } catch (err) {
      console.error(err);
      setPasswordError(
        err instanceof Error
          ? err.message
          : t.account.passwordError,
      );
    } finally {
      setPasswordSaving(false);
    }
  }

  const exportContactLine = t.account.dataExportContact.replace(
    "{{email}}",
    SUPPORT_EMAIL,
  );

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className={`text-3xl font-semibold tracking-tight ${isLight ? "text-[#0B1220]" : "text-white"}`}>{t.account.title}</h1>
        <p className={`text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>
          {t.account.subtitle}
        </p>
      </header>

      <section className={`${portalCardShell(isLight)} space-y-5`}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-slate-100"}`}>
              {t.account.profileTitle}
            </h2>
            <p className={`text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
              {t.account.profileHint}
            </p>
          </div>
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] ${isLight ? "border-slate-300 text-slate-600" : "border-slate-700 text-slate-300"}`}>
            {t.account.versionBadge}
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-3 text-xs">
          <form
            onSubmit={handleProfileSubmit}
            className="space-y-4 md:col-span-2"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <LabeledInput
                label={t.account.nameLabel}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <LabeledInput
                label={t.account.emailLabel}
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
              className={`${portalPrimaryCta()} disabled:opacity-60`}
            >
              {profileSaving ? t.account.saveBusy : t.account.save}
            </button>
          </form>

          <div className={`rounded-xl border p-4 space-y-2 text-[11px] ${isLight ? "border-slate-200 bg-white" : "border-slate-800 bg-slate-950/70"}`}>
            <div className={`text-xs font-semibold mb-1 ${isLight ? "text-slate-900" : "text-slate-200"}`}>
              {t.account.activeLicense}
            </div>
            {primaryLicense ? (
              <>
                <div className={`font-mono text-[11px] break-all ${isLight ? "text-slate-900" : "text-slate-100"}`}>
                  {primaryLicense.key}
                </div>
                <div className={isLight ? "text-slate-600" : "text-slate-300"}>
                  {t.labels.plan}:{" "}
                  <span className="font-medium capitalize">
                    {primaryLicense.plan}
                  </span>
                </div>
                <div className={`flex flex-wrap items-center gap-2 ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                  {t.labels.status}:{" "}
                  <span className={portalLicenseStatusBadge(primaryLicense.status, isLight)}>
                    {primaryLicense.status}
                  </span>
                </div>
                <div className={isLight ? "text-slate-500" : "text-slate-400"}>
                  {t.labels.validUntil}:{" "}
                  {primaryLicense.validUntil
                    ? formatDate(primaryLicense.validUntil)
                    : t.labels.dash}
                </div>
                <p className={`mt-2 ${isLight ? "text-slate-500" : "text-slate-500"}`}>
                  {t.account.licenseHint}
                </p>
              </>
            ) : (
              <p className={isLight ? "text-slate-500" : "text-slate-400"}>
                {t.account.noLicenseBody}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className={`${portalCardShell(isLight)} space-y-4`}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-slate-100"}`}>
              {t.account.securityTitle}
            </h2>
            <p className={`text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
              {t.account.securityHint}
            </p>
          </div>
        </div>

        <form
          onSubmit={handlePasswordSubmit}
          className="grid gap-4 md:grid-cols-3 text-xs"
        >
          <div className="space-y-3 md:col-span-2">
            <PasswordInput
              label={t.account.currentPassword}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <PasswordInput
              label={t.account.newPassword}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <PasswordInput
              label={t.account.repeatPassword}
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
                ? t.account.passwordBusy
                : t.account.passwordSubmit}
            </button>
          </div>

          <div className={`text-[11px] space-y-2 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
            <div className={`font-semibold ${isLight ? "text-slate-900" : "text-slate-200"}`}>
              {t.account.hintsTitle}
            </div>
            <p>
              {t.account.hintsP1}
            </p>
            <p>
              {t.account.hintsP2}
            </p>
          </div>
        </form>
      </section>

      <section className={`${portalCardShell(isLight)} space-y-3 text-[11px] ${isLight ? "text-slate-600" : "text-slate-400"}`}>
        <h2 className={`text-xs font-semibold ${isLight ? "text-slate-900" : "text-slate-200"}`}>
          {t.account.dataExportTitle}
        </h2>
        <p>
          {t.account.dataExportP1}
        </p>
        <p>
          {exportContactLine.split(SUPPORT_EMAIL)[0]}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className={`no-underline hover:underline ${portalTextLink(isLight)}`}
          >
            {SUPPORT_EMAIL}
          </a>
          {exportContactLine.split(SUPPORT_EMAIL)[1] ?? ""}
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
        className={`w-full rounded-lg border px-3 py-2 text-xs outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 ${isLight ? "border-slate-300 bg-white text-slate-900" : "border-slate-800 bg-slate-950/60 text-slate-100"}`}
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
        className={`w-full rounded-lg border px-3 py-2 text-xs outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 ${isLight ? "border-slate-300 bg-white text-slate-900" : "border-slate-800 bg-slate-950/60 text-slate-100"}`}
      />
    </div>
  );
};

export default PortalAccountPage;
