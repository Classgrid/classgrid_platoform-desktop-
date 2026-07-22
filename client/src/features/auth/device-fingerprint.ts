const DEVICE_ID_KEY = "classgrid:device-id:v1";

function createDeviceId() {
  const webCrypto = globalThis.crypto;
  if (webCrypto && typeof webCrypto.randomUUID === "function") {
    return webCrypto.randomUUID();
  }

  if (webCrypto) {
    const bytes = new Uint8Array(24);
    webCrypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Returns an opaque, browser-local identifier. It contains no hardware data and
 * exists only to keep new-device verification stable between sign-ins.
 */
export function getClientDeviceFingerprint() {
  if (typeof window === "undefined") return "server-rendered-client";

  try {
    const existing = window.localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;

    const created = createDeviceId();
    window.localStorage.setItem(DEVICE_ID_KEY, created);
    return created;
  } catch {
    return createDeviceId();
  }
}
