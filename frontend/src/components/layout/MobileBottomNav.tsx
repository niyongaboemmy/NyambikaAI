"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Sparkles, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/products", label: "Shop", icon: ShoppingBag, matchExtra: ["/products-search"] },
  { href: "/try-on", label: "Try-On", icon: Sparkles },
  { href: "/cart", label: "Cart", icon: ShoppingBag },
  { href: "/profile", label: "Profile", icon: User },
] as const;

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { count } = useCart();

  // Hide on dashboard/admin surfaces where a dedicated layout already owns navigation
  const hidden =
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/producer") ||
    pathname?.startsWith("/agent") ||
    pathname?.startsWith("/store/");

  if (hidden) return null;

  const isActive = (href: string, matchExtra?: readonly string[]) => {
    if (href === "/") return pathname === "/";
    if (pathname?.startsWith(href)) return true;
    return matchExtra?.some((extra) => pathname?.startsWith(extra)) ?? false;
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-5">
        {NAV_ITEMS.map(({ href, label, icon: Icon, ...rest }) => {
          const active = isActive(href, "matchExtra" in rest ? rest.matchExtra : undefined);
          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors"
            >
              <span className="relative">
                <Icon
                  className="h-5 w-5"
                  strokeWidth={active ? 2.5 : 2}
                  style={{ color: active ? "var(--primary)" : "var(--muted-foreground)" }}
                />
                {href === "/cart" && count > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[rgb(var(--coral-rgb))] text-white text-[9px] rounded-full min-w-[15px] h-[15px] px-0.5 flex items-center justify-center">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </span>
              <span
                style={{ color: active ? "var(--primary)" : "var(--muted-foreground)" }}
              >
                {label}
              </span>
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
