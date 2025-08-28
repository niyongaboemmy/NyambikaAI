"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function AddProductFAB() {
  const { user } = useAuth();
  const pathname = usePathname();
  const canAdd = user?.role === "producer" || user?.role === "admin";

  // Hide on the product registration page itself
  if (
    !canAdd ||
    pathname === "/product-registration" ||
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
          <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-blue-500/25 via-purple-500/25 to-indigo-500/25 blur-xl opacity-60 group-hover:opacity-90 transition" />
          <button className="relative inline-flex items-center gap-2 px-5 py-3 rounded-full text-white shadow-lg shadow-blue-500/20 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-500 hover:via-purple-500 hover:to-indigo-500 transition">
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
