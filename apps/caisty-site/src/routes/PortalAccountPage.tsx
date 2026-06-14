// apps/caisty-site/src/routes/PortalAccountPage.tsx
import React from "react";
import { Link } from "react-router-dom";
import {
  changePortalPassword,
  updatePortalAccount,
} from "../lib/portalApi";
import { usePortalOutlet } from "./PortalLayout";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { portalLocaleTag } from "../lib/portalLocale";
import { portalCardShell, portalInnerCard, portalInputClass, portalLicenseStatusBadge, portalMutedLink, portalPrimaryCta, portalTextLink } from "../lib/portalUi";

const SUPPORT_EMAIL =
  import.meta.env.VITE_PUBLIC_SUPPORT_EMAIL ?? "support@caisty.com";

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
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className={`text-2xl sm:text-3xl font-semibold tracking-tight ${isLight ? "text-[#0B1220]" : "text-white"}`}>{t.account.title}</h1>
        <p className={`text-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}>
          {t.account.subtitle}
        </p>
      </header>

      <section className={`${portalCardShell(isLight)} space-y-6`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className={`text-sm font-semibold uppercase tracking-wider ${isLight ? "text-slate-500" : "text-slate-400"}`}>
              {t.account.profileTitle}
            </p>
            <p className={`mt-1 text-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}>
              {t.account.profileHint}
            </p>
          </div>
          <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-[11px] ${isLight ? "border-slate-300 text-slate-600" : "border-white/15 text-slate-300"}`}>
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

          <div className={`rounded-xl p-4 space-y-3 text-sm ${portalInnerCard(isLight)}`}>
            <div className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-slate-100"}`}>
              {t.account.activeLicense}
            </div>
            {primaryLicense ? (
              <>
                <div className={`font-mono text-sm font-medium break-all ${isLight ? "text-slate-900" : "text-slate-100"}`}>
                  {primaryLicense.key}
                </div>
                <div className={`flex flex-wrap items-center gap-2 ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                  <span className="font-medium capitalize">{primaryLicense.plan}</span>
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
                <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-500"}`}>
                  {t.account.licenseHint}
                </p>
                <Link
                  to="/portal/licenses"
                  className={`inline-block text-xs font-medium no-underline ${portalMutedLink(isLight)}`}
                >
                  {t.layout.navLicenses} →
                </Link>
              </>
            ) : (
              <p className={isLight ? "text-slate-500" : "text-slate-400"}>
                {t.account.noLicenseBody}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className={`${portalCardShell(isLight)} space-y-5`}>
        <div>
          <p className={`text-sm font-semibold uppercase tracking-wider ${isLight ? "text-slate-500" : "text-slate-400"}`}>
            {t.account.securityTitle}
          </p>
          <p className={`mt-1 text-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}>
            {t.account.securityHint}
          </p>
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
              className={`inline-flex items-center justify-center rounded-lg border px-4 py-2.5 text-xs font-medium transition-colors disabled:opacity-60 ${
                isLight
                  ? "border-slate-300 text-slate-900 hover:bg-slate-50"
                  : "border-white/20 text-white hover:bg-white/[0.06]"
              }`}
            >
              {passwordSaving
                ? t.account.passwordBusy
                : t.account.passwordSubmit}
            </button>
          </div>

          <div className={`text-xs space-y-2 max-w-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}>
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

      <section className={`${portalCardShell(isLight)} space-y-3 text-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}>
        <h2 className={`text-sm font-semibold uppercase tracking-wider ${isLight ? "text-slate-500" : "text-slate-400"}`}>
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
    <div className="space-y-1.5">
      <div className={`text-[11px] font-medium uppercase tracking-wider ${isLight ? "text-slate-500" : "text-slate-400"}`}>
        {label}
      </div>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className={portalInputClass(isLight)}
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
    <div className="space-y-1.5">
      <div className={`text-[11px] font-medium uppercase tracking-wider ${isLight ? "text-slate-500" : "text-slate-400"}`}>
        {label}
      </div>
      <input
        type="password"
        autoComplete="new-password"
        value={value}
        onChange={onChange}
        className={portalInputClass(isLight)}
      />
    </div>
  );
};

export default PortalAccountPage;
