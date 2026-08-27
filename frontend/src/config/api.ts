const rawUrl =
  (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:5000/api";

let cleanUrl = rawUrl.replace(/\/$/, "");

// Auto-append /api if user supplied base server URL without /api in environment variables
if (!cleanUrl.endsWith("/api")) {
  cleanUrl = `${cleanUrl}/api`;
}

export const API_BASE_URL = cleanUrl;
