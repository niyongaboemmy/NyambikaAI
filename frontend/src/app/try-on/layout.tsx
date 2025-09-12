import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "AI Try-On — NyambikaAI",
  description: "Upload a photo and try outfits in seconds. AI matches your shape, tone, and style.",
  path: "/try-on",
});

export default function TryOnLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
