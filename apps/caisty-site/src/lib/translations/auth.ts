import type { Language } from "./types";

export type AuthTranslations = {
  login: {
    title: string;
    subtitle: string;
    emailLabel: string;
    passwordLabel: string;
    submit: string;
    submitting: string;
    forgotPassword: string;
    divider: string;
    google: string;
    noAccount: string;
    registerLink: string;
    errors: {
      oauthError: string;
      missingToken: string;
      googleAuthFailed: string;
      emailNotVerified: string;
      duplicateProvider: string;
      dbMigrationRequired: string;
      invalidCustomer: string;
    };
    genericError: string;
  };
  register: {
    title: string;
    subtitle: string;
    orgNameLabel: string;
    emailLabel: string;
    passwordLabel: string;
    submit: string;
    submitting: string;
    divider: string;
    google: string;
    hasAccount: string;
    loginLink: string;
    errors: {
      oauthError: string;
      googleAuthFailed: string;
      emailNotVerified: string;
      duplicateProvider: string;
      dbMigrationRequired: string;
      invalidCustomer: string;
      missingCode: string;
    };
    genericError: string;
  };
  forgotPassword: {
    title: string;
    subtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    submit: string;
    submitting: string;
    backToLogin: string;
    successTitle: string;
    successBody: string;
    successCheckEmail: string;
    successValidFor: string;
    devModeLabel: string;
    devModeIntro: string;
    genericError: string;
  };
  resetPassword: {
    setTitle: string;
    setSubtitle: string;
    newPasswordLabel: string;
    newPasswordPlaceholder: string;
    confirmLabel: string;
    confirmPlaceholder: string;
    submit: string;
    submitting: string;
    backToLogin: string;
    successTitle: string;
    successRedirecting: string;
    invalidLinkPageTitle: string;
    invalidLinkPageBody: string;
    requestNewLink: string;
    goToLogin: string;
    errInvalidLink: string;
    errInvalidLinkShort: string;
    errPasswordTooShort: string;
    errPasswordsMismatch: string;
    errResetNoLogin: string;
    genericError: string;
  };
};

export const auth: Record<Language, AuthTranslations> = {
  de: {
    login: {
      title: "Anmelden",
      subtitle:
        "Verwalte Lizenzen, Geräte, Rechnungen und POS-Downloads in deinem Caisty-Konto.",
      emailLabel: "E-Mail",
      passwordLabel: "Passwort",
      submit: "Anmelden",
      submitting: "Anmelden…",
      forgotPassword: "Passwort vergessen?",
      divider: "oder",
      google: "Mit Google anmelden",
      noAccount: "Noch kein Konto?",
      registerLink: "Jetzt registrieren",
      errors: {
        oauthError: "Google-Anmeldung fehlgeschlagen. Bitte versuche es erneut.",
        missingToken: "Anmeldung fehlgeschlagen: Token fehlt. Bitte versuche es erneut.",
        googleAuthFailed: "Google-Anmeldung wurde abgebrochen.",
        emailNotVerified: "Deine Google-E-Mail ist nicht verifiziert. Bitte verifiziere sie zuerst.",
        duplicateProvider:
          "Dieses Google-Konto ist bereits mit einem anderen Konto verknüpft. Bitte verwende ein anderes Google-Konto oder melde dich mit E-Mail und Passwort an.",
        dbMigrationRequired: "Datenbank-Migration erforderlich. Bitte kontaktiere den Support.",
        invalidCustomer: "Ungültiges Konto. Bitte kontaktiere den Support.",
      },
      genericError: "Login fehlgeschlagen. Bitte erneut versuchen.",
    },
    register: {
      title: "Caisty-Konto erstellen",
      subtitle:
        "Lege deine Organisation an und erhalte Zugriff auf das Kundenportal für Lizenzen, Rechnungen und POS-Downloads.",
      orgNameLabel: "Organisationsname",
      emailLabel: "E-Mail",
      passwordLabel: "Passwort",
      submit: "Konto erstellen",
      submitting: "Konto wird erstellt…",
      divider: "oder",
      google: "Mit Google fortfahren",
      hasAccount: "Schon ein Konto?",
      loginLink: "Zum Login",
      errors: {
        oauthError: "Google-Registrierung fehlgeschlagen. Bitte versuche es erneut.",
        googleAuthFailed: "Google-Registrierung wurde abgebrochen.",
        emailNotVerified: "Deine Google-E-Mail ist nicht verifiziert. Bitte verifiziere sie zuerst.",
        duplicateProvider:
          "Dieses Google-Konto ist bereits mit einem anderen Konto verknüpft. Bitte verwende ein anderes Google-Konto oder melde dich mit E-Mail und Passwort an.",
        dbMigrationRequired: "Datenbank-Migration erforderlich. Bitte kontaktiere den Support.",
        invalidCustomer: "Ungültiges Konto. Bitte kontaktiere den Support.",
        missingCode: "Google-Authentifizierung fehlgeschlagen: Code fehlt. Bitte versuche es erneut.",
      },
      genericError: "Registrierung fehlgeschlagen. Bitte erneut versuchen.",
    },
    forgotPassword: {
      title: "Passwort zurücksetzen",
      subtitle:
        "Gib deine E-Mail-Adresse ein. Wir senden dir einen Link zum Zurücksetzen deines Passworts.",
      emailLabel: "E-Mail",
      emailPlaceholder: "name@beispiel.de",
      submit: "Reset-Link anfordern",
      submitting: "Wird gesendet…",
      backToLogin: "← Zurück zum Login",
      successTitle: "Reset-Link angefordert",
      successBody: "Wenn ein Konto mit dieser E-Mail existiert, wurde ein Reset-Link gesendet.",
      successCheckEmail:
        "Prüfe dein E-Mail-Postfach und klicke auf den Link, um dein Passwort zurückzusetzen.",
      successValidFor: "Der Link ist 1 Stunde gültig.",
      devModeLabel: "Development-Modus:",
      devModeIntro: "Reset-Link:",
      genericError: "Fehler beim Anfordern des Reset-Links. Bitte erneut versuchen.",
    },
    resetPassword: {
      setTitle: "Neues Passwort setzen",
      setSubtitle: "Gib dein neues Passwort ein. Es muss mindestens 6 Zeichen lang sein.",
      newPasswordLabel: "Neues Passwort",
      newPasswordPlaceholder: "Mindestens 6 Zeichen",
      confirmLabel: "Passwort bestätigen",
      confirmPlaceholder: "Passwort wiederholen",
      submit: "Passwort zurücksetzen",
      submitting: "Wird gespeichert…",
      backToLogin: "← Zurück zum Login",
      successTitle: "Passwort erfolgreich zurückgesetzt",
      successRedirecting: "Du wirst jetzt automatisch eingeloggt…",
      invalidLinkPageTitle: "Ungültiger Reset-Link",
      invalidLinkPageBody:
        "Dieser Reset-Link ist ungültig oder abgelaufen. Bitte fordere einen neuen an.",
      requestNewLink: "Neuen Link anfordern",
      goToLogin: "Zum Login",
      errInvalidLink: "Ungültiger Reset-Link. Bitte fordere einen neuen an.",
      errInvalidLinkShort: "Ungültiger Reset-Link.",
      errPasswordTooShort: "Passwort muss mindestens 6 Zeichen lang sein.",
      errPasswordsMismatch: "Passwörter stimmen nicht überein.",
      errResetNoLogin:
        "Passwort wurde zurückgesetzt, aber Login fehlgeschlagen. Bitte melde dich manuell an.",
      genericError: "Fehler beim Zurücksetzen des Passworts. Bitte erneut versuchen.",
    },
  },
  en: {
    login: {
      title: "Sign in",
      subtitle:
        "Manage licenses, devices, invoices, and POS downloads in your Caisty account.",
      emailLabel: "Email",
      passwordLabel: "Password",
      submit: "Sign in",
      submitting: "Signing in…",
      forgotPassword: "Forgot password?",
      divider: "or",
      google: "Continue with Google",
      noAccount: "No account yet?",
      registerLink: "Create account",
      errors: {
        oauthError: "Google sign-in failed. Please try again.",
        missingToken: "Sign-in failed: token missing. Please try again.",
        googleAuthFailed: "Google sign-in was cancelled.",
        emailNotVerified: "Your Google email is not verified. Please verify it first.",
        duplicateProvider:
          "This Google account is already linked to another account. Use a different Google account or sign in with email and password.",
        dbMigrationRequired: "Database migration required. Please contact support.",
        invalidCustomer: "Invalid account. Please contact support.",
      },
      genericError: "Sign-in failed. Please try again.",
    },
    register: {
      title: "Create your Caisty account",
      subtitle:
        "Set up your organization and access the customer portal for licenses, invoices, and POS downloads.",
      orgNameLabel: "Organization name",
      emailLabel: "Email",
      passwordLabel: "Password",
      submit: "Create account",
      submitting: "Creating account…",
      divider: "or",
      google: "Continue with Google",
      hasAccount: "Already have an account?",
      loginLink: "Sign in",
      errors: {
        oauthError: "Google sign-up failed. Please try again.",
        googleAuthFailed: "Google sign-up was cancelled.",
        emailNotVerified: "Your Google email is not verified. Please verify it first.",
        duplicateProvider:
          "This Google account is already linked to another account. Use a different Google account or sign in with email and password.",
        dbMigrationRequired: "Database migration required. Please contact support.",
        invalidCustomer: "Invalid account. Please contact support.",
        missingCode: "Google authentication failed: code missing. Please try again.",
      },
      genericError: "Registration failed. Please try again.",
    },
    forgotPassword: {
      title: "Reset password",
      subtitle: "Enter your email address. We will send you a link to reset your password.",
      emailLabel: "Email",
      emailPlaceholder: "you@example.com",
      submit: "Send reset link",
      submitting: "Sending…",
      backToLogin: "← Back to sign in",
      successTitle: "Reset link requested",
      successBody: "If an account exists for this email, a reset link has been sent.",
      successCheckEmail: "Check your inbox and click the link to reset your password.",
      successValidFor: "The link is valid for 1 hour.",
      devModeLabel: "Development mode:",
      devModeIntro: "Reset link:",
      genericError: "Could not request reset link. Please try again.",
    },
    resetPassword: {
      setTitle: "Set new password",
      setSubtitle: "Enter your new password. It must be at least 6 characters.",
      newPasswordLabel: "New password",
      newPasswordPlaceholder: "At least 6 characters",
      confirmLabel: "Confirm password",
      confirmPlaceholder: "Repeat password",
      submit: "Reset password",
      submitting: "Saving…",
      backToLogin: "← Back to sign in",
      successTitle: "Password reset successful",
      successRedirecting: "Signing you in automatically…",
      invalidLinkPageTitle: "Invalid reset link",
      invalidLinkPageBody: "This reset link is invalid or has expired. Please request a new one.",
      requestNewLink: "Request new link",
      goToLogin: "Sign in",
      errInvalidLink: "Invalid reset link. Please request a new one.",
      errInvalidLinkShort: "Invalid reset link.",
      errPasswordTooShort: "Password must be at least 6 characters.",
      errPasswordsMismatch: "Passwords do not match.",
      errResetNoLogin: "Password was reset but sign-in failed. Please sign in manually.",
      genericError: "Could not reset password. Please try again.",
    },
  },
  fr: {
    login: {
      title: "Connexion",
      subtitle:
        "Gérez licences, appareils, factures et téléchargements POS dans votre compte Caisty.",
      emailLabel: "E-mail",
      passwordLabel: "Mot de passe",
      submit: "Se connecter",
      submitting: "Connexion…",
      forgotPassword: "Mot de passe oublié ?",
      divider: "ou",
      google: "Continuer avec Google",
      noAccount: "Pas encore de compte ?",
      registerLink: "Créer un compte",
      errors: {
        oauthError: "La connexion Google a échoué. Veuillez réessayer.",
        missingToken: "Échec de la connexion : jeton manquant. Veuillez réessayer.",
        googleAuthFailed: "La connexion Google a été annulée.",
        emailNotVerified: "Votre e-mail Google n’est pas vérifié. Veuillez d’abord le vérifier.",
        duplicateProvider:
          "Ce compte Google est déjà lié à un autre compte. Utilisez un autre compte Google ou connectez-vous par e-mail et mot de passe.",
        dbMigrationRequired: "Migration de base de données requise. Contactez le support.",
        invalidCustomer: "Compte invalide. Contactez le support.",
      },
      genericError: "Échec de la connexion. Veuillez réessayer.",
    },
    register: {
      title: "Créer un compte Caisty",
      subtitle:
        "Créez votre organisation et accédez au portail client pour les licences, factures et téléchargements POS.",
      orgNameLabel: "Nom de l’organisation",
      emailLabel: "E-mail",
      passwordLabel: "Mot de passe",
      submit: "Créer le compte",
      submitting: "Création du compte…",
      divider: "ou",
      google: "Continuer avec Google",
      hasAccount: "Déjà un compte ?",
      loginLink: "Connexion",
      errors: {
        oauthError: "L’inscription Google a échoué. Veuillez réessayer.",
        googleAuthFailed: "L’inscription Google a été annulée.",
        emailNotVerified: "Votre e-mail Google n’est pas vérifié. Veuillez d’abord le vérifier.",
        duplicateProvider:
          "Ce compte Google est déjà lié à un autre compte. Utilisez un autre compte Google ou connectez-vous par e-mail et mot de passe.",
        dbMigrationRequired: "Migration de base de données requise. Contactez le support.",
        invalidCustomer: "Compte invalide. Contactez le support.",
        missingCode: "Échec de l’authentification Google : code manquant. Veuillez réessayer.",
      },
      genericError: "L’inscription a échoué. Veuillez réessayer.",
    },
    forgotPassword: {
      title: "Réinitialiser le mot de passe",
      subtitle:
        "Saisissez votre adresse e-mail. Nous vous enverrons un lien pour réinitialiser votre mot de passe.",
      emailLabel: "E-mail",
      emailPlaceholder: "vous@exemple.fr",
      submit: "Envoyer le lien",
      submitting: "Envoi…",
      backToLogin: "← Retour à la connexion",
      successTitle: "Lien demandé",
      successBody: "Si un compte existe pour cet e-mail, un lien de réinitialisation a été envoyé.",
      successCheckEmail:
        "Consultez votre boîte mail et cliquez sur le lien pour réinitialiser votre mot de passe.",
      successValidFor: "Le lien est valable 1 heure.",
      devModeLabel: "Mode développement :",
      devModeIntro: "Lien de réinitialisation :",
      genericError: "Impossible d’envoyer le lien. Veuillez réessayer.",
    },
    resetPassword: {
      setTitle: "Définir un nouveau mot de passe",
      setSubtitle: "Saisissez votre nouveau mot de passe (au moins 6 caractères).",
      newPasswordLabel: "Nouveau mot de passe",
      newPasswordPlaceholder: "Au moins 6 caractères",
      confirmLabel: "Confirmer le mot de passe",
      confirmPlaceholder: "Répéter le mot de passe",
      submit: "Réinitialiser le mot de passe",
      submitting: "Enregistrement…",
      backToLogin: "← Retour à la connexion",
      successTitle: "Mot de passe réinitialisé",
      successRedirecting: "Connexion automatique en cours…",
      invalidLinkPageTitle: "Lien invalide",
      invalidLinkPageBody: "Ce lien est invalide ou expiré. Demandez-en un nouveau.",
      requestNewLink: "Nouveau lien",
      goToLogin: "Connexion",
      errInvalidLink: "Lien invalide. Demandez-en un nouveau.",
      errInvalidLinkShort: "Lien invalide.",
      errPasswordTooShort: "Le mot de passe doit contenir au moins 6 caractères.",
      errPasswordsMismatch: "Les mots de passe ne correspondent pas.",
      errResetNoLogin:
        "Mot de passe réinitialisé, mais la connexion a échoué. Connectez-vous manuellement.",
      genericError: "Échec de la réinitialisation. Veuillez réessayer.",
    },
  },
  ar: {
    login: {
      title: "تسجيل الدخول",
      subtitle: "أدر التراخيص والأجهزة والفواتير وتنزيلات نقطة البيع في حساب Caisty.",
      emailLabel: "البريد الإلكتروني",
      passwordLabel: "كلمة المرور",
      submit: "تسجيل الدخول",
      submitting: "جارٍ تسجيل الدخول…",
      forgotPassword: "نسيت كلمة المرور؟",
      divider: "أو",
      google: "المتابعة مع Google",
      noAccount: "ليس لديك حساب؟",
      registerLink: "إنشاء حساب",
      errors: {
        oauthError: "فشل تسجيل الدخول عبر Google. حاول مرة أخرى.",
        missingToken: "فشل تسجيل الدخول: الرمز مفقود. حاول مرة أخرى.",
        googleAuthFailed: "تم إلغاء تسجيل الدخول عبر Google.",
        emailNotVerified: "بريدك الإلكتروني من Google غير مُحقّق. يُرجى التحقق منه أولاً.",
        duplicateProvider:
          "حساب Google هذا مرتبط بحساب آخر. استخدم حساب Google آخر أو سجّل الدخول بالبريد وكلمة المرور.",
        dbMigrationRequired: "يلزم ترحيل قاعدة البيانات. تواصل مع الدعم.",
        invalidCustomer: "حساب غير صالح. تواصل مع الدعم.",
      },
      genericError: "فشل تسجيل الدخول. حاول مرة أخرى.",
    },
    register: {
      title: "إنشاء حساب Caisty",
      subtitle: "أنشئ مؤسستك وادخل بوابة العملاء للتراخيص والفواتير وتنزيلات نقطة البيع.",
      orgNameLabel: "اسم المؤسسة",
      emailLabel: "البريد الإلكتروني",
      passwordLabel: "كلمة المرور",
      submit: "إنشاء الحساب",
      submitting: "جارٍ إنشاء الحساب…",
      divider: "أو",
      google: "المتابعة مع Google",
      hasAccount: "لديك حساب بالفعل؟",
      loginLink: "تسجيل الدخول",
      errors: {
        oauthError: "فشل التسجيل عبر Google. حاول مرة أخرى.",
        googleAuthFailed: "تم إلغاء التسجيل عبر Google.",
        emailNotVerified: "بريدك الإلكتروني من Google غير مُحقّق. يُرجى التحقق منه أولاً.",
        duplicateProvider:
          "حساب Google هذا مرتبط بحساب آخر. استخدم حساب Google آخر أو سجّل الدخول بالبريد وكلمة المرور.",
        dbMigrationRequired: "يلزم ترحيل قاعدة البيانات. تواصل مع الدعم.",
        invalidCustomer: "حساب غير صالح. تواصل مع الدعم.",
        missingCode: "فشل مصادقة Google: الرمز مفقود. حاول مرة أخرى.",
      },
      genericError: "فشل التسجيل. حاول مرة أخرى.",
    },
    forgotPassword: {
      title: "إعادة تعيين كلمة المرور",
      subtitle: "أدخل بريدك الإلكتروني. سنرسل رابطًا لإعادة تعيين كلمة المرور.",
      emailLabel: "البريد الإلكتروني",
      emailPlaceholder: "name@example.com",
      submit: "إرسال رابط إعادة التعيين",
      submitting: "جارٍ الإرسال…",
      backToLogin: "← العودة لتسجيل الدخول",
      successTitle: "تم طلب الرابط",
      successBody: "إن وُجد حساب بهذا البريد، فقد أُرسل رابط إعادة التعيين.",
      successCheckEmail: "تحقق من بريدك واضغط الرابط لإعادة تعيين كلمة المرور.",
      successValidFor: "الرابط صالح لمدة ساعة واحدة.",
      devModeLabel: "وضع التطوير:",
      devModeIntro: "رابط إعادة التعيين:",
      genericError: "تعذر طلب الرابط. حاول مرة أخرى.",
    },
    resetPassword: {
      setTitle: "تعيين كلمة مرور جديدة",
      setSubtitle: "أدخل كلمة المرور الجديدة (6 أحرف على الأقل).",
      newPasswordLabel: "كلمة المرور الجديدة",
      newPasswordPlaceholder: "6 أحرف على الأقل",
      confirmLabel: "تأكيد كلمة المرور",
      confirmPlaceholder: "أعد إدخال كلمة المرور",
      submit: "إعادة تعيين كلمة المرور",
      submitting: "جارٍ الحفظ…",
      backToLogin: "← العودة لتسجيل الدخول",
      successTitle: "تم إعادة تعيين كلمة المرور",
      successRedirecting: "جارٍ تسجيل الدخول تلقائيًا…",
      invalidLinkPageTitle: "رابط غير صالح",
      invalidLinkPageBody: "الرابط غير صالح أو منتهٍ. اطلب رابطًا جديدًا.",
      requestNewLink: "طلب رابط جديد",
      goToLogin: "تسجيل الدخول",
      errInvalidLink: "رابط غير صالح. اطلب رابطًا جديدًا.",
      errInvalidLinkShort: "رابط غير صالح.",
      errPasswordTooShort: "يجب أن تكون كلمة المرور 6 أحرف على الأقل.",
      errPasswordsMismatch: "كلمتا المرور غير متطابقتين.",
      errResetNoLogin: "تم إعادة التعيين لكن فشل تسجيل الدخول. سجّل الدخول يدويًا.",
      genericError: "فشل إعادة التعيين. حاول مرة أخرى.",
    },
  },
};
