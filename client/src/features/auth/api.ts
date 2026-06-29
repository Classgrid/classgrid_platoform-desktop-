import { API_BASE_URL, apiClient } from "@/lib/apiClient";

import { getAuthIntent } from "./auth-helpers";
import type { AuthAudience, AuthBrandingResponse, AuthLoginRole, AuthType, LoginResponse } from "./types";

type BrandingParams = {
  authType: AuthType;
  slug?: string;
  domain?: string;
};

export async function getAuthBranding({ authType, slug, domain }: BrandingParams) {
  const response = await apiClient.get<AuthBrandingResponse>("/api/public/auth-branding", {
    params: {
      type: authType,
      slug: slug || undefined,
      domain: domain || undefined,
    },
  });

  return response.data.branding;
}

type LoginPayload = {
  email: string;
  password: string;
  audience: AuthAudience;
  role: AuthLoginRole;
};

export async function loginWithPassword({ email, password, audience, role }: LoginPayload) {
  const loginIntent = getAuthIntent(audience, role);
  const isStandardUser = loginIntent === "student" || loginIntent === "teacher";

  const response = await apiClient.post<LoginResponse>("/api/auth/login", {
    email,
    password,
    expectedLoginType: isStandardUser ? "standard" : loginIntent,
    loginTab: isStandardUser ? loginIntent : loginIntent === "admin" ? "admin" : undefined,
    role: loginIntent,
  });

  return response.data;
}

export async function checkEmailForLogin(email: string) {
  const response = await apiClient.post<{ exists: boolean; hasPassword?: boolean; role?: string }>("/api/auth/check-email", {
    email,
  });

  return response.data;
}

export async function requestPasswordReset(email: string) {
  const response = await apiClient.post<{ message: string }>("/api/auth/forgot-password", { 
    email,
    origin: window.location.origin
  });
  return response.data;
}

export async function resetPasswordWithToken({ token, password }: { token: string; password: string }) {
  const response = await apiClient.post<{ message: string; role?: string }>("/api/auth/reset-password", {
    token,
    password,
  });

  return response.data;
}

export async function verifyResetToken(token: string) {
  const response = await apiClient.get<{ valid: boolean; message?: string }>(`/api/auth/verify-reset-token/${token}`);
  return response.data;
}

export async function verifyDeviceOtp({ email, otp }: { email: string; otp: string }) {
  const response = await apiClient.post<LoginResponse>("/api/auth/verify-device", {
    email,
    otp,
  });

  return response.data;
}

export async function resendDeviceOtp(email: string) {
  const response = await apiClient.post<{ message: string }>("/api/auth/resend-device-otp", { email });
  return response.data;
}

type GoogleAuthUrlPayload = {
  audience: AuthAudience;
  role: AuthLoginRole;
};

export function getGoogleAuthUrl({ audience, role }: GoogleAuthUrlPayload) {
  const loginTab = getAuthIntent(audience, role);
  return new URL(`/api/auth/google?loginTab=${encodeURIComponent(loginTab)}&host=${encodeURIComponent(window.location.hostname)}`, API_BASE_URL).toString();
}
