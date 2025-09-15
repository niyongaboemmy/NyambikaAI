import { Resend } from "resend";

export function getResend() {
  const apiKey =
    process.env.RESEND_API_KEY || "re_YSryhkJD_Sjhg6yMeXS2EifUrWH9sjN3t";
  if (!apiKey) return null;
  try {
    return new Resend(apiKey);
  } catch {
    return null;
  }
}
