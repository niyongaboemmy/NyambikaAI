// Centralized Esicia/OPAY configuration for reuse across payment handlers
// Reads from environment variables with safe defaults for local testing

export const ESICIA_CONFIG = {
  BASE_URL: "https://pay.esicia.rw/",
  BANK_ID: "192", // Equity Bank
  RETAILER_ID: "01",
  REDIRECT_URL: "https://nyambika.com/profile",
  CALLBACK_BASE: "https://nyambika.vms.rw",
  USERNAME: "universal",
  PASSWORD: "5Cew9n",
  AUTH_KEY: "95klh4tsvabduv1mahs09ueg75",
  TIMEOUT_MS: 20000,
} as const;

export type EsiciaConfig = typeof ESICIA_CONFIG;
