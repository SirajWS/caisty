/**
 * Pure visual auth-card branding (Phase 1C.2 / 1C.4).
 * No auth state, navigation, forms, or storage.
 * Light/dark marks swap via CSS on .login-page / .login-page--light.
 */

const MARK_LIGHT_SRC = "/branding/caisty-company-mark-tight.png";
const MARK_DARK_SRC = "/branding/caisty-company-mark-dark-tight.png";

export type AuthBrandProps = {
  /** Optional secondary line under the wordmark */
  tagline?: string;
};

export function AuthBrand({ tagline }: AuthBrandProps) {
  return (
    <div className="auth-brand" dir="ltr" aria-label="Caisty">
      <span className="auth-brand__mark-slot brand-mark-slot">
        <img
          src={MARK_LIGHT_SRC}
          alt=""
          className="auth-brand__mark brand-mark brand-mark--light"
          width={64}
          height={64}
          decoding="async"
        />
        <img
          src={MARK_DARK_SRC}
          alt=""
          className="auth-brand__mark brand-mark brand-mark--dark"
          width={64}
          height={64}
          decoding="async"
          aria-hidden="true"
        />
      </span>
      <div className="auth-brand__text" aria-hidden="true">
        <span className="auth-brand__name">
          <span className="auth-brand__name-c">C</span>
          <span className="auth-brand__name-rest">aisty</span>
        </span>
        {tagline ? <span className="auth-brand__tagline">{tagline}</span> : null}
      </div>
    </div>
  );
}
