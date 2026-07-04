"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function AddProductFAB() {
  const { user } = useAuth();
  const pathname = usePathname();
  const canAdd = user?.role === "producer";

  // Hide on the product registration page itself
  if (
    !canAdd ||
    pathname === "/product-registration" ||
    pathname === "/producer-subscription" ||
    pathname?.includes("product-edit")
  )
    return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Link
        href="/product-registration"
        className="group"
        aria-label="Add product"
      >
        <div className="relative">
          <div className="absolute -inset-2 rounded-full blur-xl opacity-60 group-hover:opacity-90 transition bg-gray-500/25" />
          <button className="relative inline-flex items-center gap-2 px-5 py-3 rounded-full text-white transition bg-gold-600 hover:bg-gold-500">
            <Plus className="h-5 w-5" />
            <span className="hidden sm:block text-sm font-semibold">
              Add Product
            </span>
          </button>
        </div>
      </Link>
    </div>
  );
}
