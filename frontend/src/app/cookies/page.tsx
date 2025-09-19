import type { Metadata } from "next";
import CookiesClient from "./CookiesClient";

export const metadata: Metadata = {
  title: "Cookie Policy • Nyambika",
  description:
    "Understand how Nyambika uses cookies and similar technologies to improve your experience.",
};

export default function CookiesPage() {
  return <CookiesClient />;
}
