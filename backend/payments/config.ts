// Centralized Esicia/OPAY configuration for reuse across payment handlers
// Reads from environment variables with safe defaults for local testing

export const ESICIA_CONFIG = {
  BASE_URL: process.env.ESICIA_BASE_URL || "https://pay.esicia.rw/",
  BANK_ID: process.env.ESICIA_BANK_ID || "192", // Equity Bank
  RETAILER_ID: process.env.ESICIA_RETAILER_ID || "01", // TODO: replace with real merchant retailer id in prod
  REDIRECT_URL:
    process.env.ESICIA_REDIRECT_URL || "https://nyambika.com/profile",
  CALLBACK_BASE: process.env.ESICIA_CALLBACK_BASE || "https://nyambika.vms.rw",
  USERNAME: process.env.ESICIA_USERNAME || "universal",
  PASSWORD: process.env.ESICIA_PASSWORD || "5Cew9n",
  AUTH_KEY: process.env.ESICIA_AUTH_KEY || "95klh4tsvabduv1mahs09ueg75",
  TIMEOUT_MS: process.env.ESICIA_TIMEOUT_MS
    ? Number(process.env.ESICIA_TIMEOUT_MS)
    : 20000,
} as const;

export type EsiciaConfig = typeof ESICIA_CONFIG;
