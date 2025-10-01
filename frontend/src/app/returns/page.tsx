import type { Metadata } from "next";
import ReturnsClient from "./ReturnsClient";

export const metadata: Metadata = {
  title: "Returns & Exchanges • Nyambika",
  description:
    "Our hassle-free return and exchange policy. Learn how to return or exchange items from your Nyambika order.",
};

export default function ReturnsPage() {
  return <ReturnsClient />;
}
