import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCart } from "@/contexts/CartContext";
import { useTheme } from "@/components/theme-provider";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLoginPrompt } from "@/contexts/LoginPromptContext";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import {
  Home,
  ShoppingCart,
  User,
  LogOut,
  Package,
  BarChart3,
  Users,
  LogIn,
  Moon,
  Sun,
  ChevronDown,
  Menu,
  Globe,
  Building2,
  Plus,
  User2,
  Settings,
  Grid3X3,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useProducerSubscriptionStatus } from "@/hooks/useProducerSubscriptionStatus";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;
type NavItem = { href: string; label: string; icon: IconType | null };
type RoleKey = "customer" | "producer" | "admin" | "agent";
type RoleConfig = { links: NavItem[]; menu: NavItem[] };

export default function RoleBasedNavigation() {
  const { user, isAuthenticated, logout } = useAuth();
  const { company } = useCompany();
  const { actualTheme, setTheme } = useTheme();
  const { count: cartCount } = useCart();
  const { open, isOpen } = useLoginPrompt();
  const { language, setLanguage } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const { status, plan } = useProducerSubscriptionStatus();
  const daysLeft = status?.expiresAt
    ? Math.ceil(
        (new Date(status.expiresAt).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : undefined;

  // Public navigation links (always visible)
  const publicLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/try-on", label: "Try-On", icon: Package },
    { href: "/companies", label: "Companies", icon: Building2 },
  ];

  // Build producer menu with de-duplication (avoid duplicate "/products" entries)
  const producerMenuBase: NavItem[] = [
    {
      href: company?.id ? `/store/${company.id}` : "/#",
      label: "My Products",
      icon: User2,
    },
    { href: "/product-registration", label: "Add Product", icon: Plus },
    { href: "/producer-orders", label: "Orders", icon: Package },
  ];

  const ROLE_CONFIGS: Record<RoleKey, RoleConfig> = {
    customer: {
      links: publicLinks,
      menu: [{ href: "/orders", label: "My Orders", icon: Package }],
    },
    producer: {
      links: publicLinks,
      menu: [
        {
          href: company?.id ? `/store/${company.id}` : "/#",
          label: "My Store",
          icon: User2,
        },
        { href: "/product-registration", label: "Add Product", icon: Plus },
        {
          href: "/producer-subscription",
          label: "Subscription",
          icon: Settings,
        },
        { href: "/producer-orders", label: "Orders", icon: Package },
      ],
    },
    admin: {
      links: publicLinks,
      menu: [
        { href: "/products", label: "Products", icon: ShoppingCart },
        { href: "/product-registration", label: "Add Product", icon: Plus },
        { href: "/admin-orders", label: "Orders", icon: Package },
        { href: "/admin-users", label: "Users Management", icon: Users },
      ],
    },
    agent: {
      links: publicLinks,
      menu: [
        { href: "/agent-dashboard", label: "Dashboard", icon: BarChart3 },
        {
          href: "/agent/producers-management",
          label: "Producers Management",
          icon: Users,
        },
      ],
    },
  };

  const userRole: RoleKey =
    user?.role === "producer" ||
    user?.role === "admin" ||
    user?.role === "customer" ||
    user?.role === "agent"
      ? user.role
      : "customer";
  const config: RoleConfig = ROLE_CONFIGS[userRole];

  const languages = [
    { code: "en", label: "EN", name: "English", flag: "🇺🇸" },
    { code: "rw", label: "RW", name: "Kinyarwanda", flag: "🇷🇼" },
    { code: "fr", label: "FR", name: "Français", flag: "🇫🇷" },
  ];

  const currentLang =
    languages.find((lang) => lang.code === language) || languages[0];

  // All navigation links for mobile dropdown - always show public links plus authenticated links
  const allNavLinks = isAuthenticated
    ? [
        ...publicLinks,
        ...config.links.filter(
          (link) => !publicLinks.some((pLink) => pLink.href === link.href)
        ),
      ]
    : publicLinks;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-2">
      <nav className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-white/20 dark:border-gray-700/20 rounded-3xl px-3 py-3 container mx-auto shadow-2xl shadow-blue-500/10">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <div className="relative">
              {userRole === "producer" && company?.logoUrl ? (
                <div className="relative">
                  {/* Holographic ring for company logo */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-all duration-500 animate-pulse"></div>
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl opacity-20 group-hover:opacity-30 transition-all duration-300"></div>
                  <img
                    src={company.logoUrl}
                    alt={company.name}
                    className="relative w-10 h-10 rounded-2xl object-cover ring-1 ring-white/20 group-hover:scale-105 transition-all duration-300 shadow-lg"
                  />
                </div>
              ) : (
                <div className="relative flex items-center gap-2 md:gap-3">
                  {/* Modern Logo Container */}
                  <div className="relative group">
                    {/* Enhanced ambient glow with blue/violet layers */}
                    <div className="absolute -inset-4 bg-gradient-to-r from-blue-300/20 via-violet-300/20 to-indigo-300/20 rounded-3xl blur-3xl opacity-60 group-hover:opacity-100 transition-all duration-700"></div>
                    <div className="absolute -inset-2 bg-gradient-to-br from-blue-200/15 to-violet-200/15 rounded-full blur-xl opacity-70 group-hover:opacity-90 transition-all duration-500"></div>

                    {/* Cute sparkle pattern overlay */}
                    <div
                      className="absolute inset-0 rounded-full opacity-30 dark:opacity-25"
                      style={{
                        backgroundImage: `
                        radial-gradient(circle at 15% 15%, rgba(139, 92, 246, 0.15) 0%, transparent 25%), 
                        radial-gradient(circle at 85% 85%, rgba(99, 102, 241, 0.15) 0%, transparent 25%),
                        radial-gradient(circle at 50% 20%, rgba(59, 130, 246, 0.12) 0%, transparent 20%),
                        radial-gradient(circle at 20% 80%, rgba(147, 51, 234, 0.10) 0%, transparent 15%),
                        linear-gradient(45deg, rgba(139, 92, 246, 0.08) 0%, rgba(99, 102, 241, 0.08) 50%, rgba(59, 130, 246, 0.08) 100%)`,
                      }}
                    ></div>

                    {/* Icon background with blue/violet gradient */}
                    <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-blue-50 via-violet-50 to-indigo-50 dark:from-slate-800/90 dark:via-violet-900/40 dark:to-cyan-900/40 group-hover:from-blue-100 group-hover:via-violet-100 group-hover:to-indigo-100 dark:group-hover:from-violet-800/50 dark:group-hover:via-fuchsia-800/50 dark:group-hover:to-cyan-800/50 flex items-center justify-center group-hover:scale-110 transition-all duration-500 border-2 border-blue-200/50 dark:border-violet-700/40 group-hover:border-violet-300/70 dark:group-hover:border-violet-600/60 backdrop-blur-sm overflow-hidden">
                      {/* Blue/violet shimmer overlay for light mode */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-blue-200/30 via-violet-100/20 to-indigo-200/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                      {/* Cute dotted pattern for light mode */}
                      <div
                        className="absolute inset-0 opacity-25 dark:opacity-10"
                        style={{
                          backgroundImage: `
                            radial-gradient(circle at 2px 2px, rgba(139, 92, 246, 0.6) 1px, transparent 1px),
                            radial-gradient(circle at 6px 6px, rgba(99, 102, 241, 0.4) 1px, transparent 1px)`,
                          backgroundSize: "8px 8px, 12px 12px",
                        }}
                      ></div>

                      {/* Modern Hanger Icon */}
                      <svg
                        className="h-8 w-8 text-blue-500 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all duration-300"
                        viewBox="0 0 24 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          d="M12 2.5c0.8 0 1.5 0.7 1.5 1.5s-0.7 1.5-1.5 1.5"
                          strokeLinecap="round"
                        />
                        <path d="M12 5.5v1" strokeLinecap="round" />
                        <path
                          d="M12 6.5L6 12L5 14h14l-1-2L12 6.5z"
                          strokeLinejoin="round"
                          fill="none"
                        />
                        <path d="M7 14h10" strokeLinecap="round" />
                      </svg>

                      {/* Cute sparkle animation effect */}
                      <div className="absolute inset-0 rounded-full overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="absolute top-2 left-2 w-1 h-1 bg-blue-400 rounded-full animate-ping"></div>
                        <div
                          className="absolute top-3 right-3 w-0.5 h-0.5 bg-violet-400 rounded-full animate-pulse"
                          style={{ animationDelay: "0.5s" }}
                        ></div>
                        <div
                          className="absolute bottom-2 left-3 w-0.5 h-0.5 bg-indigo-400 rounded-full animate-ping"
                          style={{ animationDelay: "1s" }}
                        ></div>
                        <div
                          className="absolute bottom-3 right-2 w-1 h-1 bg-blue-500 rounded-full animate-pulse"
                          style={{ animationDelay: "1.5s" }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Modern Brand Text */}
                  <div className="flex flex-col">
                    <span className="text-xl md:text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-blue-600 to-purple-600 dark:from-slate-100 dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:via-purple-600 group-hover:to-cyan-500 dark:group-hover:from-blue-400 dark:group-hover:via-purple-400 dark:group-hover:to-cyan-400 transition-all duration-500">
                      Nyambika
                    </span>
                    <span className="text-[9px] md:text-[10px] font-medium text-slate-500 dark:text-slate-400 tracking-[0.2em] uppercase opacity-60 group-hover:opacity-100 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-all duration-300 truncate">
                      AI Fashion
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          {userRole !== "producer" ? (
            <div className="hidden lg:flex items-center gap-1">
              {publicLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Button
                    key={link.href}
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(link.href)}
                    className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 hover:scale-105"
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    <span className="font-medium">{link.label}</span>
                  </Button>
                );
              })}
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 hover:scale-105"
                  >
                    <Grid3X3 className="h-4 w-4" />
                    <span className="font-medium">Browse</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {publicLinks.map((link, i) => {
                    const Icon = link.icon;
                    return (
                      <DropdownMenuItem
                        key={i + 1}
                        onSelect={() => {
                          router.push(link.href);
                        }}
                        className="cursor-pointer gap-3 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                      >
                        {Icon && <Icon className="h-4 w-4" />}
                        {link.label}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Producer subscription badge */}
            {isAuthenticated && userRole === "producer" && status && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/producer-subscription")}
                className="hidden md:flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                title={
                  status.hasActiveSubscription
                    ? `Active plan${plan ? ": " + plan.name : ""}`
                    : "Subscription expired or not active"
                }
              >
                {status.hasActiveSubscription &&
                typeof daysLeft === "number" &&
                daysLeft > 0 &&
                daysLeft <= 5 ? (
                  <Badge className="bg-yellow-500 text-black dark:text-white">
                    Expiring in {daysLeft}d
                  </Badge>
                ) : (
                  <Badge
                    className={
                      status.hasActiveSubscription
                        ? "bg-green-600 text-white"
                        : "bg-red-600 text-white"
                    }
                  >
                    {status.hasActiveSubscription ? "Active" : "Expired"}
                  </Badge>
                )}
                <span className="text-xs font-medium max-w-[120px] truncate">
                  {plan?.name || "Subscription"}
                </span>
              </Button>
            )}
            {/* Language Selector - Always visible */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                >
                  <Globe className="h-4 w-4" />
                  <span className="text-xs font-semibold">
                    {currentLang.label}
                  </span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {languages.map((lang, i) => (
                  <DropdownMenuItem
                    key={i + 1}
                    onClick={() => setLanguage(lang.code as "en" | "rw" | "fr")}
                    className={`cursor-pointer flex items-center gap-3 ${
                      language === lang.code
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : ""
                    }`}
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span className="font-medium">{lang.name}</span>
                    {language === lang.code && (
                      <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setTheme(actualTheme === "light" ? "dark" : "light")
              }
              className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 hover:scale-105 hidden md:inline-block"
            >
              {actualTheme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>

            {/* Desktop Cart - Only show on desktop when authenticated */}
            {isAuthenticated && (
              <div className="hidden lg:block">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/cart")}
                  className="relative hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 hover:scale-105"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg animate-pulse">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </div>
            )}

            {/* Desktop Profile - Only show on desktop when authenticated */}
            {isAuthenticated && (
              <div className="hidden lg:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                    >
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                        {user?.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <span className="text-sm font-medium">
                        {user?.name?.split(" ")[0] || "User"}
                      </span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-3 py-2 border-b mb-1">
                      <p className="text-sm font-medium">
                        {user?.name || "User"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user?.email}
                      </p>
                    </div>
                    {config.menu.map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <DropdownMenuItem
                          key={i + 1}
                          onSelect={() => {
                            router.push(item.href);
                          }}
                          className="cursor-pointer gap-3 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                        >
                          {Icon && <Icon className="h-4 w-4" />}
                          {item.label}
                        </DropdownMenuItem>
                      );
                    })}

                    <DropdownMenuItem
                      className="cursor-pointer gap-3"
                      onSelect={() => {
                        router.push("/profile");
                      }}
                    >
                      <User className="h-4 w-4" />
                      Profile Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={logout}
                      className="cursor-pointer gap-3 text-red-600 focus:text-red-700"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Desktop Sign In - Only show on desktop when not authenticated */}
            {!isAuthenticated && (
              <Button
                variant="default"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  open();
                }}
                className="hidden md:flex bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-full"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            )}

            {/* Mobile Menu */}
            <div className="lg:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 hover:scale-105"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-64 backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border border-white/20 dark:border-gray-700/20 shadow-2xl"
                >
                  {/* Navigation Section */}
                  <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      Navigation
                    </p>
                  </div>
                  {allNavLinks.map((link, i) => {
                    const Icon = link.icon;
                    return (
                      <DropdownMenuItem
                        key={i + 1}
                        onSelect={() => {
                          const isActive = pathname === link.href;
                          if (isActive) return;
                          router.push(link.href);
                        }}
                        className="cursor-pointer gap-3 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
                          {Icon && (
                            <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                        <span className="font-medium">{link.label}</span>
                      </DropdownMenuItem>
                    );
                  })}

                  {/* Tools Section */}
                  <DropdownMenuSeparator />
                  <div className="px-3 py-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold">
                      Tools
                    </p>
                  </div>

                  {/* Theme Toggle */}
                  <DropdownMenuItem
                    className="cursor-pointer gap-3 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                    onSelect={() => {
                      setTheme(actualTheme === "dark" ? "light" : "dark");
                    }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
                      {actualTheme === "dark" ? (
                        <Sun className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <Moon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <span className="font-medium">
                      {actualTheme === "dark" ? "Light Mode" : "Dark Mode"}
                    </span>
                  </DropdownMenuItem>

                  {/* Cart - Only show if authenticated */}
                  {isAuthenticated && (
                    <DropdownMenuItem
                      className="cursor-pointer gap-3 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                      onSelect={() => {
                        router.push("/cart");
                      }}
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center relative">
                        <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        {cartCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold shadow-lg animate-pulse">
                            {cartCount}
                          </span>
                        )}
                      </div>
                      <span className="font-medium">Shopping Cart</span>
                      {cartCount > 0 && (
                        <span className="ml-auto text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
                          {cartCount}
                        </span>
                      )}
                    </DropdownMenuItem>
                  )}

                  {/* Account Section - Only show if authenticated */}
                  {isAuthenticated && (
                    <>
                      <DropdownMenuSeparator />
                      <div className="px-3 py-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold">
                          Account
                        </p>
                      </div>

                      {/* User Info */}
                      <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 mb-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                              {user?.name?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white w-[190px] truncate">
                              {user?.name || "User"}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 w-[190px] truncate">
                              {user?.email}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Role-specific menu items */}
                      {config.menu.map((item, i) => {
                        const Icon = item.icon;
                        return (
                          <DropdownMenuItem
                            key={i + 1}
                            className="cursor-pointer gap-3 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                            onSelect={() => {
                              router.push(item.href);
                            }}
                          >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
                              {Icon && (
                                <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              )}
                            </div>
                            <span className="font-medium">{item.label}</span>
                          </DropdownMenuItem>
                        );
                      })}

                      <DropdownMenuItem
                        className="cursor-pointer gap-3 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                        onSelect={() => {
                          router.push("/profile");
                        }}
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="font-medium">Profile Settings</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={logout}
                        className="cursor-pointer gap-3 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500/10 to-red-500/10 flex items-center justify-center">
                          <LogOut className="h-4 w-4" />
                        </div>
                        <span className="font-medium">Sign Out</span>
                      </DropdownMenuItem>
                    </>
                  )}

                  {/* Sign In - Only show if not authenticated */}
                  {!isAuthenticated && (
                    <>
                      <DropdownMenuSeparator />
                      <div className="p-3">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            open();
                          }}
                          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-full"
                        >
                          <LogIn className="h-4 w-4 mr-2" />
                          Sign In
                        </Button>
                      </div>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
