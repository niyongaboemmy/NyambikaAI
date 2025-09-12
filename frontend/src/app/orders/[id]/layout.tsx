import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const id = encodeURIComponent((params.id || "").trim());
  return buildMetadata({
    title: `Order #${decodeURIComponent(id)} — NyambikaAI`,
    description: "View order details, items, and current status.",
    path: `/orders/${id}`,
  });
}

export default function OrderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
