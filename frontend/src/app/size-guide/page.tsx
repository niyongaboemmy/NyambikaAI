import type { Metadata } from "next";
import SizeGuideClient from "./SizeGuideClient";

export const metadata: Metadata = {
  title: "Size Guide • Nyambika",
  description:
    "Find your perfect fit with our comprehensive size guide. Learn how to measure yourself and choose the right size for Nyambika's fashion.",
};

export default function SizeGuidePage() {
  return <SizeGuideClient />;
}
