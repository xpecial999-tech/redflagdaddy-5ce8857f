export type AuthMethodsConfig = {
  phoneSignIn: boolean;
  emailSignIn: boolean;
  googleSignIn: boolean;
  appleSignIn: boolean;
  accountLinking: boolean;
};

type AuthEnvironment = Record<string, string | boolean | undefined>;

function enabled(value: string | boolean | undefined): boolean {
  return value === true || (typeof value === "string" && value.trim().toLowerCase() === "enabled");
}

export function getAuthMethodsConfig(
  env: AuthEnvironment = import.meta.env as AuthEnvironment,
): AuthMethodsConfig {
  return {
    phoneSignIn: enabled(env.VITE_AUTH_PHONE_MODE),
    emailSignIn: enabled(env.VITE_AUTH_EMAIL_MODE),
    googleSignIn: enabled(env.VITE_AUTH_GOOGLE_MODE),
    appleSignIn: enabled(env.VITE_AUTH_APPLE_MODE),
    accountLinking: enabled(env.VITE_AUTH_ACCOUNT_LINKING_MODE),
  };
}

export function hasAlternativeSignIn(config = getAuthMethodsConfig()): boolean {
  return config.emailSignIn || config.googleSignIn || config.appleSignIn;
}
