type GrecaptchaApi = {
  ready: (callback: () => void) => void;
  execute: (siteKey: string, options: { action: string }) => Promise<string>;
};

declare global {
  interface Window {
    grecaptcha?: GrecaptchaApi;
  }
}

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LdMY0ItAAAAAJ5FixSMY_zlJ17ulMJzkiEQUYQi";
const SCRIPT_ID = "classgrid-recaptcha-v3";
let scriptPromise: Promise<void> | null = null;

function ensureRecaptchaScript() {
  if (window.grecaptcha) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    const script = existing || document.createElement("script");

    const handleLoad = () => resolve();
    const handleError = () => {
      scriptPromise = null;
      reject(new Error("The sign-in security check could not load. Check your connection and try again."));
    };

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });

    if (!existing) {
      script.id = SCRIPT_ID;
      script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(SITE_KEY)}`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  });

  return scriptPromise;
}

export async function executeRecaptcha(action = "login") {
  await ensureRecaptchaScript();
  if (!window.grecaptcha) {
    throw new Error("The sign-in security check is unavailable. Please refresh and try again.");
  }

  await new Promise<void>((resolve) => window.grecaptcha?.ready(resolve));
  const token = await window.grecaptcha.execute(SITE_KEY, { action });
  if (!token) throw new Error("The sign-in security check did not return a token.");
  return token;
}
