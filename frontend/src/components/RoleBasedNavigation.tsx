import { Button } from "@/components/custom-ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/custom-ui/dropdown-menu";
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
  Lock,
  Wallet,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/custom-ui/badge";
import { useProducerSubscriptionStatus } from "@/hooks/useProducerSubscriptionStatus";
import { useWallet } from "@/hooks/useWallet";
import { useUserWalletDialog } from "@/contexts/UserWalletDialogContext";
import { useChangePassword } from "@/contexts/ChangePasswordContext";

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
  const { language, setLanguage, t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const { status, plan } = useProducerSubscriptionStatus();
  // Fetch wallet only when authenticated
  const {
    data: wallet,
    formattedBalance,
    isLoading: walletLoading,
  } = useWallet({ enabled: !!isAuthenticated });
  const { open: openUserWalletDialog } = useUserWalletDialog();
  const { openChangePassword } = useChangePassword();
  const daysLeft = status?.expiresAt
    ? Math.ceil(
        (new Date(status.expiresAt).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : undefined;

  // Public navigation links (always visible)
  const publicLinks = [
    { href: "/", label: "home", icon: Home },
    { href: "/try-on", label: "tryOn", icon: Package },
    { href: "/public-tryon", label: "publicTryon", icon: Sparkles },
    { href: "/companies", label: "companies", icon: Building2 },
  ];

  // Build producer menu with de-duplication (avoid duplicate "/products" entries)
  const producerMenuBase: NavItem[] = [
    {
      href: company?.id ? `/store/${company.id}` : "/#",
      label: "myProducts",
      icon: User2,
    },
    { href: "/product-registration", label: "addProduct", icon: Plus },
    { href: "/producer-orders", label: "orders", icon: Package },
  ];

  const ROLE_CONFIGS: Record<RoleKey, RoleConfig> = {
    customer: {
      links: publicLinks,
      menu: [
        { href: "/outfit-room", label: "outfitRoom", icon: Sparkles },
        { href: "/orders", label: "myOrders", icon: Package },
      ],
    },
    producer: {
      links: publicLinks,
      menu: [
        {
          href: user && user.business_id ? `/store/${user.business_id}` : "/#",
          label: "myStore",
          icon: User2,
        },
        { href: "/product-registration", label: "addProduct", icon: Plus },
        {
          href: "/producer-subscription",
          label: "subscription",
          icon: Settings,
        },
        { href: "/producer-orders", label: "orders", icon: Package },
      ],
    },
    admin: {
      links: publicLinks,
      menu: [
        { href: "/products", label: "products", icon: ShoppingCart },
        {
          href: "/product-categories",
          label: "productCategories",
          icon: Grid3X3,
        },
        { href: "/product-registration", label: "addProduct", icon: Plus },
        { href: "/admin-orders", label: "orders", icon: Package },
        { href: "/admin-users", label: "usersManagement", icon: Users },
      ],
    },
    agent: {
      links: publicLinks,
      menu: [
        { href: "/agent-dashboard", label: "dashboard", icon: BarChart3 },
        {
          href: "/agent/producers-management",
          label: "producersManagement",
          icon: Users,
        },
        {
          href: "/agent/referrals",
          label: "referrals",
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
    { code: "en", label: "EN", name: "English" },
    { code: "rw", label: "RW", name: "Kinyarwanda" },
    { code: "fr", label: "FR", name: "Français" },
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
      <nav className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-white/20 dark:border-gray-700/20 rounded-3xl px-2 sm:px-3 py-2.5 container mx-auto">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <div className="relative">
              {userRole === "producer" && company?.logoUrl ? (
                <div className="flex flex-row items-center gap-2">
                  <div className="relative">
                    {/* Holographic ring for company logo */}
                    <div className="absolute -inset-1 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-all duration-500 animate-pulse bg-gold-400"></div>
                    <div className="absolute -inset-0.5 rounded-2xl opacity-20 group-hover:opacity-30 transition-all duration-300 bg-gold-500"></div>
                    <img
                      src={company.logoUrl}
                      alt={company.name}
                      className="relative w-10 h-10 rounded-2xl object-cover ring-1 ring-white/20 group-hover:scale-105 transition-all duration-300"
                    />
                  </div>
                  <div className="hidden md:flex flex-col">
                    <div className="max-w-[300px] font-serif text-xl md:text-xl font-semibold tracking-tight from-slate-900 dark:from-slate-100 group-hover:from-gold-600 group-hover:via-gold-600 group-hover:to-gold-300 dark:group-hover:from-gold-400 dark:group-hover:via-gold-400 dark:group-hover:to-gold-300 transition-all duration-500 truncate text-foreground">
                      {company.name}
                    </div>
                    <span className="max-w-[300px] text-[9px] md:text-[10px] font-medium text-slate-500 dark:text-slate-400 tracking-[0.2em] uppercase opacity-60 group-hover:opacity-100 group-hover:text-gray-800 dark:group-hover:text-gray-700 transition-all duration-300 truncate">
                      {company.location}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="relative flex items-center gap-2 md:gap-3">
                  {/* Modern Logo Container */}
                  <div className="relative group">
                    {/* Enhanced ambient glow with blue/blue layers */}
                    <div className="absolute -inset-4 rounded-3xl blur-3xl opacity-60 group-hover:opacity-100 transition-all duration-700 bg-gray-300/20"></div>
                    <div className="absolute -inset-2 rounded-full blur-xl opacity-70 group-hover:opacity-90 transition-all duration-500 bg-gray-200/15"></div>


                    {/* Icon background with blue/blue gradient */}
                    <div className="relative w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-all duration-500 border-2 border-gray-400/15 dark:border-gray-700/40 group-hover:border-gray-300/70 dark:group-hover:border-gray-500/60 backdrop-blur-sm overflow-hidden bg-gold-50 dark:bg-slate-800/90 group-hover:bg-gold-100 dark:group-hover:bg-gray-800/50">
                      {/* Blue/blue shimmer overlay for light mode */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gray-200/30"></div>


                      {/* Modern Hanger Icon */}
                      <svg
                        className="h-8 w-8 text-gray-800 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-gray-700 transition-all duration-300"
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
                        <div className="absolute top-2 left-2 w-1 h-1 bg-gold-400 rounded-full animate-ping"></div>
                        <div
                          className="absolute top-3 right-3 w-0.5 h-0.5 bg-gold-400 rounded-full animate-pulse"
                          style={{ animationDelay: "0.5s" }}
                        ></div>
                        <div
                          className="absolute bottom-2 left-3 w-0.5 h-0.5 bg-gold-400 rounded-full animate-ping"
                          style={{ animationDelay: "1s" }}
                        ></div>
                        <div
                          className="absolute bottom-3 right-2 w-1 h-1 bg-gold-500 rounded-full animate-pulse"
                          style={{ animationDelay: "1.5s" }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Modern Brand Text */}
                  <div className="flex flex-col">
                    <span className="font-serif text-xl md:text-xl font-semibold tracking-tight from-slate-900 dark:from-slate-100 group-hover:from-gold-600 group-hover:via-gold-600 group-hover:to-gold-300 dark:group-hover:from-gold-400 dark:group-hover:via-gold-400 dark:group-hover:to-gold-300 transition-all duration-500 text-foreground">
                      Nyambika
                    </span>
                    <span className="text-[9px] md:text-[10px] font-medium text-slate-500 dark:text-slate-400 tracking-[0.2em] uppercase opacity-60 group-hover:opacity-100 group-hover:text-gray-800 dark:group-hover:text-gray-700 transition-all duration-300 truncate">
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
                    className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gold-900/20 transition-all duration-200 hover:scale-105"
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    <span className="font-medium">{t(link.label)}</span>
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
                    className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gold-900/20 transition-all duration-200 hover:scale-105"
                  >
                    <Grid3X3 className="h-4 w-4" />
                    <span className="font-medium">{t("browse")}</span>
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
                        className="cursor-pointer gap-3 py-3 hover:bg-gray-50 dark:hover:bg-gold-900/20 transition-all duration-200"
                      >
                        {Icon && <Icon className="h-4 w-4" />}
                        {t(link.label)}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            {/* Producer subscription badge */}
            {isAuthenticated && userRole === "producer" && status && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/producer-subscription")}
                className="hidden md:flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gold-900/20 transition-all duration-200"
                title={
                  status.hasActiveSubscription
                    ? `${t("activePlan")}${plan ? ": " + plan.name : ""}`
                    : t("subscriptionInactive")
                }
              >
                {status.hasActiveSubscription &&
                typeof daysLeft === "number" &&
                daysLeft > 0 &&
                daysLeft <= 5 ? (
                  <Badge className="bg-gold-500 text-black dark:text-white">
                    {t("expiringIn")} {daysLeft}d
                  </Badge>
                ) : (
                  <Badge
                    className={
                      status.hasActiveSubscription
                        ? "bg-gold-600 text-white"
                        : "bg-red-600 text-white"
                    }
                  >
                    {status.hasActiveSubscription ? t("active") : t("expired")}
                  </Badge>
                )}
                <span className="text-xs font-medium max-w-[120px] truncate">
                  {plan?.name || t("subscription")}
                </span>
              </Button>
            )}
            {/* Language Selector - Always visible */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gold-900/20 transition-all duration-200"
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
                        ? "bg-gray-50 dark:bg-gray-800/20"
                        : ""
                    }`}
                  >
                    <span className="font-medium">{lang.name}</span>
                    {language === lang.code && (
                      <div className="ml-auto w-2 h-2 bg-gold-500 rounded-full" />
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
              className="hover:bg-gray-50 dark:hover:bg-gold-900/20 transition-all duration-200 hover:scale-105 hidden md:inline-block"
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
                  className="relative hover:bg-gray-50 dark:hover:bg-gold-900/20 transition-all duration-200 hover:scale-105"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse bg-red-500">
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
                      className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gold-900/20 transition-all duration-200"
                    >
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold bg-gold-500">
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
                      {/* Modern Wallet Display */}
                      {isAuthenticated && (
                        <button
                          type="button"
                          onClick={() => openUserWalletDialog()}
                          className="mt-3 w-full flex items-center gap-2 p-2 rounded-lg border border-gray-200/50 dark:border-gray-700/30 transition-all duration-200 group bg-gold-50 dark:bg-gray-900/20 hover:bg-gold-100 dark:hover:bg-gray-900/30"
                        >
                          <div className="p-1.5 rounded-md bg-gold-600 group-hover:bg-gold-700 transition-colors">
                            <Wallet className="h-3 w-3 text-white" />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              {t("walletBalance")}
                            </div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white">
                              {walletLoading ? t("loading") : formattedBalance}
                            </div>
                          </div>
                        </button>
                      )}
                    </div>
                    {config.menu.map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <DropdownMenuItem
                          key={i + 1}
                          onSelect={() => {
                            router.push(item.href);
                          }}
                          className="cursor-pointer gap-3 py-3 hover:bg-gray-50 dark:hover:bg-gold-900/20 transition-all duration-200"
                        >
                          {Icon && <Icon className="h-4 w-4" />}
                          {t(item.label)}
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
                      {t("profileSettings")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer gap-3"
                      onSelect={() => {
                        openChangePassword();
                      }}
                    >
                      <Lock className="h-4 w-4" />
                      {t("changePassword")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={logout}
                      className="cursor-pointer gap-3 text-red-600 focus:text-red-700"
                    >
                      <LogOut className="h-4 w-4" />
                      {t("signOut")}
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
                className="hidden md:flex text-white border-0 transition-all duration-300 transform hover:scale-105 rounded-full bg-gold-500 hover:bg-gold-600"
              >
                <LogIn className="h-4 w-4 mr-2" />
                {t("signIn")}
              </Button>
            )}

            {/* Mobile Menu */}
            <div className="lg:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-gray-50 dark:hover:bg-gold-900/20 transition-all duration-200 hover:scale-105"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-64 backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border border-white/20 dark:border-gray-700/20"
                >
                  {/* Navigation Section */}
                  <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {t("navigation")}
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
                        className="cursor-pointer gap-3 py-3 hover:bg-gray-50 dark:hover:bg-gold-900/20 transition-all duration-200"
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-500/10">
                          {Icon && (
                            <Icon className="h-4 w-4 text-gray-900 dark:text-white" />
                          )}
                        </div>
                        <span className="font-medium">{t(link.label)}</span>
                      </DropdownMenuItem>
                    );
                  })}

                  {/* Tools Section */}
                  <DropdownMenuSeparator />
                  <div className="px-3 py-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold">
                      {t("tools")}
                    </p>
                  </div>

                  {/* Theme Toggle */}
                  <DropdownMenuItem
                    className="cursor-pointer gap-3 py-3 hover:bg-gray-50 dark:hover:bg-gold-900/20 transition-all duration-200"
                    onSelect={() => {
                      setTheme(actualTheme === "dark" ? "light" : "dark");
                    }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-500/10">
                      {actualTheme === "dark" ? (
                        <Sun className="h-4 w-4 text-gray-900 dark:text-white" />
                      ) : (
                        <Moon className="h-4 w-4 text-gray-900 dark:text-white" />
                      )}
                    </div>
                    <span className="font-medium">
                      {actualTheme === "dark" ? t("lightMode") : t("darkMode")}
                    </span>
                  </DropdownMenuItem>

                  {/* Cart - Only show if authenticated */}
                  {isAuthenticated && (
                    <DropdownMenuItem
                      className="cursor-pointer gap-3 py-3 hover:bg-gray-50 dark:hover:bg-gold-900/20 transition-all duration-200"
                      onSelect={() => {
                        router.push("/cart");
                      }}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center relative bg-gray-500/10">
                        <ShoppingCart className="h-4 w-4 text-gray-900 dark:text-white" />
                        {cartCount > 0 && (
                          <span className="absolute -top-1 -right-1 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold animate-pulse bg-red-500">
                            {cartCount}
                          </span>
                        )}
                      </div>
                      <span className="font-medium">{t("shoppingCart")}</span>
                      {cartCount > 0 && (
                        <span className="ml-auto text-xs bg-gray-100 dark:bg-gold-900 text-gray-900 dark:text-white px-2 py-1 rounded-full">
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
                          {t("account")}
                        </p>
                      </div>

                      {/* User Info */}
                      <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 mb-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold bg-gold-500">
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
                            {/* Modern Wallet Display (mobile) */}
                            <button
                              type="button"
                              onClick={() => openUserWalletDialog()}
                              className="mt-2 flex items-center gap-2 p-2 rounded-lg border border-gray-200/50 dark:border-gray-700/30 transition-all duration-200 group w-full bg-gold-50 dark:bg-gray-900/20 hover:bg-gold-100 dark:hover:bg-gray-900/30"
                            >
                              <div className="p-1 rounded bg-gold-600 group-hover:bg-gold-700 transition-colors">
                                <Wallet className="h-3 w-3 text-white" />
                              </div>
                              <div className="text-left">
                                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                  Balance
                                </div>
                                <div className="text-sm font-bold text-gray-900 dark:text-white">
                                  {walletLoading
                                    ? "Loading..."
                                    : formattedBalance}
                                </div>
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Role-specific menu items */}
                      {config.menu.map((item, i) => {
                        const Icon = item.icon;
                        return (
                          <DropdownMenuItem
                            key={i + 1}
                            className="cursor-pointer gap-3 py-3 hover:bg-gray-50 dark:hover:bg-gold-900/20 transition-all duration-200"
                            onSelect={() => {
                              router.push(item.href);
                            }}
                          >
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-500/10">
                              {Icon && (
                                <Icon className="h-4 w-4 text-gray-900 dark:text-white" />
                              )}
                            </div>
                            <span className="font-medium">{t(item.label)}</span>
                          </DropdownMenuItem>
                        );
                      })}

                      <DropdownMenuItem
                        className="cursor-pointer gap-3 py-3 hover:bg-gray-50 dark:hover:bg-gold-900/20 transition-all duration-200"
                        onSelect={() => {
                          router.push("/profile");
                        }}
                      >
                        <div className="p-1 rounded-md bg-gray-100 dark:bg-gray-800/30">
                          <User className="h-4 w-4 text-gray-900 dark:text-white" />
                        </div>
                        <span className="font-medium">Profile Settings</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        className="cursor-pointer gap-3 py-3 hover:bg-gray-50 dark:hover:bg-gold-900/20 transition-all duration-200"
                        onSelect={() => {
                          openChangePassword();
                        }}
                      >
                        <div className="p-1 rounded-md bg-gray-100 dark:bg-gray-800/30">
                          <Lock className="h-4 w-4 text-gray-900 dark:text-white" />
                        </div>
                        <span className="font-medium">Change Password</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={logout}
                        className="cursor-pointer gap-3 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/10">
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
                          className="w-full text-white border-0 transition-all duration-300 rounded-full gap-1 bg-gold-500 hover:bg-gold-600"
                        >
                          <LogIn className="h-4 w-4" />
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
