import type { Metadata } from "next";
import PrivacyClient from "./PrivacyClient";

export const metadata: Metadata = {
  title: "Privacy Policy • Nyambika",
  description:
    "Learn how Nyambika collects, uses, and protects your data. We value your privacy and are committed to transparency.",
};

export default function PrivacyPage() {
  return <PrivacyClient />;
}
