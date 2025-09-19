import type { Metadata } from "next";
import AboutClient from "./AboutClient";

export const metadata: Metadata = {
  title: "About Us • Nyambika",
  description:
    "Learn about Nyambika's mission to power Rwanda's fashion ecosystem with AI try‑on, modern commerce, and local producer enablement.",
};

export default function AboutPage() {
  // Server Component wrapper to allow metadata; renders client component
  return <AboutClient />;
}
