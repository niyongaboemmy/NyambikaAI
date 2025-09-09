import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Create Account — NyambikaAI",
  description: "Join NyambikaAI to try outfits with AI, save favorites, and manage orders.",
  path: "/register",
});

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
