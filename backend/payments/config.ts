// Centralized Esicia/OPAY configuration for reuse across payment handlers
// Reads from environment variables with safe defaults for local testing

export const ESICIA_CONFIG = {
  BASE_URL: process.env.BASE_URL || "https://pay.esicia.rw/",
  BANK_ID: process.env.BANK_ID || "192", // Equity Bank
  RETAILER_ID: process.env.RETAILER_ID || "01", // TODO: replace with real merchant retailer id in prod
  REDIRECT_URL: process.env.REDIRECT_URL || "https://nyambika.com/profile",
  CALLBACK_BASE: process.env.CALLBACK_BASE || "https://nyambika.vms.rw",
  USERNAME: process.env.USERNAME || "universal",
  PASSWORD: process.env.PASSWORD || "5Cew9n",
  AUTH_KEY: process.env.AUTH_KEY || "95klh4tsvabduv1mahs09ueg75",
  TIMEOUT_MS: process.env.TIMEOUT_MS ? Number(process.env.TIMEOUT_MS) : 20000,
} as const;

export type EsiciaConfig = typeof ESICIA_CONFIG;
