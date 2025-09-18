import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Signing you in — Nyambika",
  description:
    "Completing your authentication. You will be redirected shortly.",
  path: "/auth/oauth-complete",
});

export default function OAuthCompleteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
