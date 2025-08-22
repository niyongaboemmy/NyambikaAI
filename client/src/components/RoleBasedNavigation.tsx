import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useTheme } from "@/hooks/useTheme";
import {
  ShoppingBag,
  User,
  Moon,
  Sun,
  Plus,
  BarChart3,
  Package,
  Settings,
  Users,
  CheckCircle,
  LogIn,
  UserPlus,
  Globe,
  ChevronDown,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import React from "react";

interface RoleBasedNavigationProps {
  userRole?: "customer" | "producer" | "admin";
  userName?: string;
}

export default function RoleBasedNavigation({
  userRole: propUserRole,
  userName: propUserName,
}: RoleBasedNavigationProps) {
  const { user, isAuthenticated } = useAuth();

  // Use auth context data if available, otherwise fall back to props
  const userRole = user?.role || propUserRole || "customer";
  const userName = user?.name || propUserName;
  const { theme, setTheme } = useTheme();
  // menu open state not currently used
  const [language, setLanguage] = useState("rw");
  const { count: cartCount, total } = useCart();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  // Visible links (exactly two) vary by role
  const getVisibleLinks = () => {
    switch (userRole) {
      case "customer":
        return [
          { href: "/", label: "Ahabanza", en: "Home" },
          { href: "/try-on", label: "Gerageza", en: "Try-On" },
        ];
      case "producer":
        return [
          { href: "/", label: "Ahabanza", en: "Home" },
          { href: "/producer-dashboard", label: "Dashboard", en: "Dashboard" },
        ];
      case "admin":
        return [
          { href: "/", label: "Ahabanza", en: "Home" },
          { href: "/admin-dashboard", label: "Dashboard", en: "Dashboard" },
        ];
      default:
        return [
          { href: "/", label: "Ahabanza", en: "Home" },
          { href: "/products", label: "Imyenda", en: "Products" },
        ];
    }
  };

  // Dropdown items: role-specific + any links not in the two visible ones
  const getRoleMenuItems = () => {
    switch (userRole) {
      case "producer":
        return [
          { href: "/products", label: "Imyenda", en: "Products" },
          {
            href: "/add-product",
            label: "Ongeraho Igicuruzwa",
            en: "Add Product",
          },
          {
            href: "/producer-products",
            label: "Imyenda Yanjye",
            en: "My Products",
          },
          { href: "/producer-orders", label: "Ama Order", en: "Orders" },
          { href: "/producer-analytics", label: "Imibare", en: "Analytics" },
        ];
      case "admin":
        return [
          { href: "/products", label: "Imyenda", en: "Products" },
          {
            href: "/add-product",
            label: "Ongeraho Igicuruzwa",
            en: "Add Product",
          },
          { href: "/admin-users", label: "Abakoresha", en: "Users" },
          { href: "/admin-products", label: "Ibicuruzwa", en: "Products" },
          { href: "/admin-categories", label: "Ibyiciro", en: "Categories" },
          { href: "/admin-orders", label: "Ama Order", en: "Orders" },
        ];
      case "customer":
        return [
          { href: "/products", label: "Imyenda", en: "Products" },
          { href: "/profile", label: "Profil", en: "Profile" },
        ];
      default:
        return [];
    }
  };

  const getQuickActions = () => {
    switch (userRole) {
      case "customer":
        return (
          <>
            <Link href="/cart">
              <Button
                variant="ghost"
                size="icon"
                className="relative glassmorphism rounded-lg hover:scale-105 transition-all duration-300"
              >
                <ShoppingBag className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                <span className="absolute -top-1 -right-1 bg-[rgb(var(--coral-rgb))] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  3
                </span>
              </Button>
            </Link>
            <Link href="/profile">
              <Button
                variant="ghost"
                size="icon"
                className="glassmorphism rounded-lg hover:scale-105 transition-all duration-300"
              >
                <User className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </Button>
            </Link>
          </>
        );
      case "producer":
        return (
          <>
            <Link href="/add-product">
              <Button
                variant="ghost"
                size="icon"
                className="glassmorphism rounded-lg hover:scale-105 transition-all duration-300"
                title="Add Product"
              >
                <Plus className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </Button>
            </Link>
            <Link href="/producer-orders">
              <Button
                variant="ghost"
                size="icon"
                className="relative glassmorphism rounded-lg hover:scale-105 transition-all duration-300"
              >
                <Package className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                <span className="absolute -top-1 -right-1 bg-[rgb(var(--electric-blue-rgb))] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  5
                </span>
              </Button>
            </Link>
            <Link href="/producer-analytics">
              <Button
                variant="ghost"
                size="icon"
                className="glassmorphism rounded-lg hover:scale-105 transition-all duration-300"
              >
                <BarChart3 className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </Button>
            </Link>
          </>
        );
      case "admin":
        return (
          <>
            <Link href="/add-product">
              <Button
                variant="ghost"
                size="icon"
                className="glassmorphism rounded-lg hover:scale-105 transition-all duration-300"
                title="Add Product"
              >
                <Plus className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </Button>
            </Link>
            <Link href="/admin-products">
              <Button
                variant="ghost"
                size="icon"
                className="relative glassmorphism rounded-lg hover:scale-105 transition-all duration-300"
                title="Pending Approvals"
              >
                <CheckCircle className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  12
                </span>
              </Button>
            </Link>
            <Link href="/admin-users">
              <Button
                variant="ghost"
                size="icon"
                className="glassmorphism rounded-lg hover:scale-105 transition-all duration-300"
              >
                <Users className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </Button>
            </Link>
            <Link href="/admin-settings">
              <Button
                variant="ghost"
                size="icon"
                className="glassmorphism rounded-lg hover:scale-105 transition-all duration-300"
              >
                <Settings className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </Button>
            </Link>
          </>
        );
      default:
        return null;
    }
  };

  const visibleLinks = getVisibleLinks();
  const roleMenuItems = getRoleMenuItems();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 md:px-6">
      <nav className="glassmorphism rounded-2xl px-4 py-3 mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <span className="text-white text-lg font-bold">N</span>
            </div>
            <div>
              <span className="text-2xl font-bold gradient-text">Nyambika</span>
              {/* Mobile: show role and full name */}
              <div className="md:hidden text-xs text-gray-500 dark:text-gray-400 capitalize">
                {userRole}
                {userName ? ` • ${userName}` : ""}
              </div>
              {/* Desktop: keep portal label for non-customer */}
              {userRole !== "customer" && (
                <div className="hidden md:block text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {userRole} Portal
                </div>
              )}
            </div>
          </Link>

          {/* Desktop Navigation: two visible links + dropdown for the rest */}
          <div className="hidden md:flex items-center space-x-4">
            {visibleLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-700 dark:text-gray-300 hover:text-[rgb(var(--electric-blue-rgb))] transition-colors"
              >
                {language === "rw" ? link.label : link.en}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            {/* Language Selector (icon dropdown, visible on all sizes) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="glassmorphism rounded-lg"
                >
                  <Globe className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuLabel>Language</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setLanguage("rw")}
                  className="cursor-pointer"
                >
                  🇷🇼 Kinyarwanda
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLanguage("en")}
                  className="cursor-pointer"
                >
                  🇬🇧 English
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLanguage("fr")}
                  className="cursor-pointer"
                >
                  🇫🇷 Français
                </DropdownMenuItem>
              </DropdownMenuContent>
              {/* add shopping cart shortcut with total products */}
              <div className="flex items-center gap-2">
                <Link href="/cart">
                  <Button variant="ghost" size="icon" className="glassmorphism relative" title={`Cart • ${total.toLocaleString()} RWF`}>
                    <ShoppingCart className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full min-w-[1.25rem] h-5 px-1 flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Button>
                </Link>
                <span className="hidden md:inline text-sm text-gray-700 dark:text-gray-300 font-semibold">
                  {total.toLocaleString()} RWF
                </span>
              </div>
            </DropdownMenu>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="glassmorphism rounded-lg hover:scale-105 transition-all duration-300"
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              ) : (
                <Sun className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              )}
            </Button>

            {roleMenuItems.length > 0 && (
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="glassmorphism">
                      {userName && userName}
                      {/* Dropdown icon here */}
                      <ChevronDown className="h-5 w-5 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      {userRole === "admin"
                        ? "Admin"
                        : userRole === "producer"
                        ? "Producer"
                        : "Menu"}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {/* Profile at top of dropdown */}
                    <Link href="/profile">
                      <DropdownMenuItem className="cursor-pointer gap-2">
                        <User className="h-4 w-4" />
                        {language === "rw" ? "Profile" : "Profile"}
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
                    {roleMenuItems.map((item) => (
                      <Link key={item.href} href={item.href}>
                        <DropdownMenuItem className="cursor-pointer">
                          {language === "rw" ? item.label : item.en}
                        </DropdownMenuItem>
                      </Link>
                    ))}
                    {/* Quick actions moved into dropdown */}
                    <DropdownMenuSeparator />
                    {userRole === "customer" && (
                      <>
                        <Link href="/cart">
                          <DropdownMenuItem className="cursor-pointer gap-2">
                            <ShoppingBag className="h-4 w-4" />
                            {language === "rw" ? "Akamenyetso" : "Cart"}
                            {cartCount > 0 && (
                              <span className="ml-auto inline-flex items-center justify-center rounded-full bg-[rgb(var(--electric-blue-rgb))] text-white text-xs px-2 py-0.5">
                                {cartCount}
                              </span>
                            )}
                          </DropdownMenuItem>
                        </Link>
                        <Link href="/profile">
                          <DropdownMenuItem className="cursor-pointer gap-2">
                            <User className="h-4 w-4" />
                            {language === "rw" ? "Profil" : "Profile"}
                          </DropdownMenuItem>
                        </Link>
                      </>
                    )}
                    {userRole === "producer" && (
                      <>
                        <Link href="/add-product">
                          <DropdownMenuItem className="cursor-pointer gap-2">
                            <Plus className="h-4 w-4" />
                            {language === "rw"
                              ? "Ongeraho Igicuruzwa"
                              : "Add Product"}
                          </DropdownMenuItem>
                        </Link>
                        <Link href="/producer-orders">
                          <DropdownMenuItem className="cursor-pointer gap-2">
                            <Package className="h-4 w-4" />
                            {language === "rw" ? "Ama Order" : "Orders"}
                          </DropdownMenuItem>
                        </Link>
                        <Link href="/producer-analytics">
                          <DropdownMenuItem className="cursor-pointer gap-2">
                            <BarChart3 className="h-4 w-4" />
                            {language === "rw" ? "Imibare" : "Analytics"}
                          </DropdownMenuItem>
                        </Link>
                      </>
                    )}
                    {userRole === "admin" && (
                      <>
                        <Link href="/add-product">
                          <DropdownMenuItem className="cursor-pointer gap-2">
                            <Plus className="h-4 w-4" />
                            {language === "rw"
                              ? "Ongeraho Igicuruzwa"
                              : "Add Product"}
                          </DropdownMenuItem>
                        </Link>
                        <Link href="/admin-products">
                          <DropdownMenuItem className="cursor-pointer gap-2">
                            <CheckCircle className="h-4 w-4" />
                            {language === "rw" ? "Ibicuruzwa" : "Products"}
                          </DropdownMenuItem>
                        </Link>
                        <Link href="/admin-users">
                          <DropdownMenuItem className="cursor-pointer gap-2">
                            <Users className="h-4 w-4" />
                            {language === "rw" ? "Abakoresha" : "Users"}
                          </DropdownMenuItem>
                        </Link>
                        <Link href="/admin-settings">
                          <DropdownMenuItem className="cursor-pointer gap-2">
                            <Settings className="h-4 w-4" />
                            {language === "rw" ? "Amagenamiterere" : "Settings"}
                          </DropdownMenuItem>
                        </Link>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
