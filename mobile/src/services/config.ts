const apiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:5050";

export const APP_CONFIG = {
  apiBaseUrl,
  useMockFallback: true,
  requestTimeoutMs: 12000
};
