import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Stores — NyambikaAI",
  description: "Discover fashion brands and producers across Rwanda.",
  path: "/companies",
});

export default function CompaniesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
