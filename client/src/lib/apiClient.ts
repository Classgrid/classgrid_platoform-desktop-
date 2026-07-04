import axios from "axios";

import type { ApiErrorResponse } from "@shared-types";
import { mockApiAdapter } from "./mockApiAdapter";

const isMockApiEnabled = import.meta.env.VITE_MOCK_API === "true";
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "" : "/");

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 0,
  adapter: isMockApiEnabled ? mockApiAdapter : undefined,
  withCredentials: true // required for cookie-based Passport sessions
});

if (isMockApiEnabled) {
  console.info("[Classgrid] Mock API mode enabled. Live MongoDB/Supabase-backed APIs are not called.");
}

// Intercept requests to inject the Bearer token as a fallback for strict cross-site cookie restrictions
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const responseData =
      error?.response?.data && typeof error.response.data === "object" ? error.response.data : {};
    const normalized: ApiErrorResponse = {
      ...responseData,
      message:
        error?.response?.data?.message ??
        error?.message ??
        "Unexpected API error",
      code: error?.response?.status ? String(error.response.status) : "UNKNOWN"
    };
    return Promise.reject(normalized);
  }
);
