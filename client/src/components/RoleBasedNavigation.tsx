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
  LogOut,
  Menu,
  Home,
  LayoutDashboard,
  Camera,
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
import { useLoginPrompt } from "@/contexts/LoginPromptContext";
import { useCompany } from "@/contexts/CompanyContext";

interface RoleBasedNavigationProps {
  userRole?: "customer" | "producer" | "admin";
  userName?: string;
}

export default function RoleBasedNavigation({
  userRole: propUserRole,
  userName: propUserName,
}: RoleBasedNavigationProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const { company } = useCompany();

  // Use auth context data if available, otherwise fall back to props
  const userRole = user?.role || propUserRole || "customer";
  const userName = user?.name || propUserName;
  const { theme, setTheme } = useTheme();
  // menu open state not currently used
  const [language, setLanguage] = useState("rw");
  const { count: cartCount, total } = useCart();

  // Two-letter language label for UI next to globe icon
  const langLabel = language === "rw" ? "RW" : language === "en" ? "EN" : "FR";

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  // Helper: map known routes to icons for dropdown items
  const getMenuIcon = (href: string) => {
    switch (href) {
      case "/":
        return <Home className="h-4 w-4" />;
      case "/try-on/start":
        return <Camera className="h-4 w-4" />;
      case "/producer-dashboard":
        return <LayoutDashboard className="h-4 w-4" />;
      case "/admin-dashboard":
        return <LayoutDashboard className="h-4 w-4" />;
      case "/products":
        return <Package className="h-4 w-4" />;
      case "/product-registration":
        return <Plus className="h-4 w-4" />;
      case "/producer-products":
        return <Package className="h-4 w-4" />;
      case "/producer-orders":
        return <Package className="h-4 w-4" />;
      case "/producer-analytics":
        return <BarChart3 className="h-4 w-4" />;
      case "/admin-users":
        return <Users className="h-4 w-4" />;
      case "/admin-products":
        return <CheckCircle className="h-4 w-4" />;
      case "/admin-categories":
        return <Settings className="h-4 w-4" />;
      case "/admin-orders":
        return <Package className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // Visible links (exactly two) vary by role
  const getVisibleLinks = () => {
    switch (userRole) {
      case "customer":
        return [
          { href: "/", label: "Ahabanza", en: "Home" },
          { href: "/try-on/start", label: "Gerageza", en: "Try-On" },
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
            href: "/product-registration",
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
            href: "/product-registration",
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
          // { href: "/profile", label: "Profile", en: "Profile" },
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
            <Link href="/product-registration">
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
            <Link href="/product-registration">
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
  const { open } = useLoginPrompt();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 md:px-6">
      <nav className="glassmorphism rounded-2xl px-4 py-3 mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            {/* Show company logo for producers when available */}
            {userRole === "producer" && company?.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={company.name}
                className="w-10 h-10 rounded-xl object-cover border"
                onError={(e) => {
                  // fallback to letter avatar if image fails
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                <span className="text-white text-lg font-bold">N</span>
              </div>
            )}
            <div>
              {/* For producers show company name if available, else Nyambika */}
              <span className="text-2xl font-bold gradient-text">
                {userRole === "producer" && company?.name
                  ? company.name
                  : "Nyambika"}
              </span>
              {/* Mobile: show role and full name */}
              <div className="md:hidden text-xs text-gray-500 dark:text-gray-400 capitalize">
                {userName ? `${user?.name}` : ""}
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

          {/* Mobile: single hamburger menu */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="glassmorphism rounded-lg"
                  aria-label="Menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {isAuthenticated ? (
                  <>
                    <DropdownMenuLabel>
                      {userName || "Account"}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <Link href="/profile">
                      <DropdownMenuItem className="cursor-pointer gap-2">
                        <User className="h-4 w-4" /> Profile
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
                    {/* Primary links */}
                    {visibleLinks.map((link) => (
                      <Link key={link.href} href={link.href}>
                        <DropdownMenuItem className="cursor-pointer gap-2">
                          {getMenuIcon(link.href)}
                          {language === "rw" ? link.label : link.en}
                        </DropdownMenuItem>
                      </Link>
                    ))}
                    {/* Role-specific links */}
                    {roleMenuItems.map((item) => (
                      <Link key={item.href} href={item.href}>
                        <DropdownMenuItem className="cursor-pointer gap-2">
                          {getMenuIcon(item.href)}
                          {language === "rw" ? item.label : item.en}
                        </DropdownMenuItem>
                      </Link>
                    ))}
                    <DropdownMenuSeparator />
                    {/* Cart */}
                    <Link href="/cart">
                      <DropdownMenuItem className="cursor-pointer gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        {language === "rw" ? "Akamenyetso" : "Cart"}
                        {cartCount > 0 && (
                          <span className="ml-auto inline-flex items-center justify-center rounded-full bg-[rgb(var(--electric-blue-rgb))] text-white text-xs px-2 py-0.5">
                            {cartCount}
                          </span>
                        )}
                      </DropdownMenuItem>
                    </Link>
                    {/* Language */}
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>
                      {language === "rw" ? "Ururimi" : "Language"}
                    </DropdownMenuLabel>
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
                    {/* Theme */}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={toggleTheme}
                      className="cursor-pointer gap-2"
                    >
                      {theme === "light" ? (
                        <Moon className="h-4 w-4" />
                      ) : (
                        <Sun className="h-4 w-4" />
                      )}
                      {language === "rw"
                        ? "Hindura insanganyamatsiko"
                        : "Toggle theme"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => logout()}
                      className="cursor-pointer gap-2 text-red-600 focus:text-red-700"
                    >
                      <LogOut className="h-4 w-4" />{" "}
                      {language === "rw" ? "Sohoka" : "Logout"}
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    {/* Theme + Login only when logged out */}
                    <DropdownMenuItem
                      onClick={toggleTheme}
                      className="cursor-pointer gap-2"
                    >
                      {theme === "light" ? (
                        <Moon className="h-4 w-4" />
                      ) : (
                        <Sun className="h-4 w-4" />
                      )}
                      {language === "rw"
                        ? "Hindura insanganyamatsiko"
                        : "Toggle theme"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => open()}>
                      <LogIn className="h-4 w-4" />{" "}
                      {language === "rw" ? "Injira" : "Login"}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Desktop: right-side controls */}
          <div className="hidden md:flex items-center space-x-1.5">
            {isAuthenticated ? (
              <>
                {/* Language Selector + Cart */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="glassmorphism rounded-lg px-2 h-9 flex items-center gap-1"
                      aria-label={`Language: ${langLabel}`}
                      title={`Language: ${langLabel}`}
                    >
                      <Globe className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {langLabel}
                      </span>
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
                  <div className="flex items-center gap-2">
                    <Link href="/cart">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="glassmorphism relative"
                        title={`Cart • ${total.toLocaleString()} RWF`}
                      >
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
                        <Link href="/profile">
                          <DropdownMenuItem className="cursor-pointer gap-2">
                            <User className="h-4 w-4" />
                            {language === "rw" ? "Profile" : "Profile"}
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuSeparator />
                        {roleMenuItems.map((item) => (
                          <Link key={item.href} href={item.href}>
                            <DropdownMenuItem className="cursor-pointer gap-2">
                              {getMenuIcon(item.href)}
                              {language === "rw" ? item.label : item.en}
                            </DropdownMenuItem>
                          </Link>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => logout()}
                          className="cursor-pointer gap-2 text-red-600 focus:text-red-700"
                        >
                          <LogOut className="h-4 w-4" />
                          {language === "rw" ? "Sohoka" : "Logout"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Theme Toggle (visible when logged out) */}
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

                {/* Login only */}
                <Button variant="ghost" className="glassmorphism" onClick={() => open()}>
                  <LogIn className="h-4 w-4 mr-2" />
                  {language === "rw" ? "Injira" : "Login"}
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
