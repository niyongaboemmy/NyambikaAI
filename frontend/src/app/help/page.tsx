import type { Metadata } from "next";
import HelpClient from "./HelpClient";

export const metadata: Metadata = {
  title: "Help Center • Nyambika",
  description:
    "Get help with your Nyambika experience. Find answers to frequently asked questions and contact our support team.",
};

export default function HelpPage() {
  return <HelpClient />;
}
