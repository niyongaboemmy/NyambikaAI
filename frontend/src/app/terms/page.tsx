import type { Metadata } from "next";
import TermsClient from "./TermsClient";

export const metadata: Metadata = {
  title: "Terms of Service • Nyambika",
  description:
    "Read the Nyambika Terms of Service that govern your use of our platform, AI try‑on features, and marketplace.",
};

export default function TermsPage() {
  return <TermsClient />;
}
