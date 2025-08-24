import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useTheme } from "@/components/ThemeProvider";
import { useCompany } from "@/contexts/CompanyContext";
import { useLoginPrompt } from "@/contexts/LoginPromptContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";
import {
  Home,
  ShoppingCart,
  User,
  LogOut,
  Settings,
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
} from "lucide-react";

const ROLE_CONFIGS = {
  customer: {
    links: [
      { href: "/", label: "Home", icon: Home },
      { href: "/try-on/start", label: "Try-On", icon: null },
    ],
    menu: [{ href: "/products", label: "Products", icon: ShoppingCart }],
  },
  producer: {
    links: [
      { href: "/", label: "Home", icon: Home },
      {
        href: "/producer-dashboard",
        label: "Dashboard",
        icon: null,
      },
    ],
    menu: [
      { href: "/products", label: "Products", icon: ShoppingCart },
      { href: "/product-registration", label: "Add Product", icon: null },
      { href: "/producer-analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  admin: {
    links: [
      { href: "/", label: "Home", icon: Home },
      { href: "/admin-dashboard", label: "Dashboard", icon: null },
    ],
    menu: [
      { href: "/products", label: "Products", icon: ShoppingCart },
      { href: "/product-registration", label: "Add Product", icon: null },
      { href: "/admin-users", label: "Users", icon: Users },
    ],
  },
};

export default function RoleBasedNavigation() {
  const { user, isAuthenticated, logout } = useAuth();
  const { company } = useCompany();
  const { actualTheme, setTheme } = useTheme();
  const { count: cartCount } = useCart();
  const { open } = useLoginPrompt();
  const { language, setLanguage } = useLanguage();

  const userRole = user?.role || "customer";
  const config = ROLE_CONFIGS[userRole] || ROLE_CONFIGS.customer;

  const languages = [
    { code: "en", label: "EN", name: "English", flag: "🇺🇸" },
    { code: "rw", label: "RW", name: "Kinyarwanda", flag: "🇷🇼" },
    { code: "fr", label: "FR", name: "Français", flag: "🇫🇷" },
  ];

  const currentLang =
    languages.find((lang) => lang.code === language) || languages[0];

  // Public navigation links (always visible)
  const publicLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/try-on/start", label: "Try-On", icon: Package },
    { href: "/companies", label: "Companies", icon: Building2 },
  ];

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
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              {userRole === "producer" && company?.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="w-10 h-10 rounded-2xl object-cover ring-2 ring-blue-500/20 group-hover:ring-blue-500/40 transition-all duration-300"
                />
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-lg">
                  <span className="text-white text-lg font-bold">N</span>
                </div>
              )}
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hidden sm:block">
              NyambikaAI
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1">
            {publicLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.href} href={link.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 hover:scale-105"
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    <span className="font-medium">{link.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
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
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
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
              className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 hover:scale-105"
            >
              {actualTheme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>

            {/* Desktop Cart - Only show on desktop when authenticated */}
            {isAuthenticated && (
              <Link href="/cart" className="hidden lg:block">
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 hover:scale-105"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg animate-pulse">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </Link>
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
                    {config.menu.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link key={item.href} href={item.href}>
                          <DropdownMenuItem className="cursor-pointer gap-3">
                            {Icon && <Icon className="h-4 w-4" />}
                            {item.label}
                          </DropdownMenuItem>
                        </Link>
                      );
                    })}
                    <DropdownMenuSeparator />
                    <Link href="/profile">
                      <DropdownMenuItem className="cursor-pointer gap-3">
                        <User className="h-4 w-4" />
                        Profile Settings
                      </DropdownMenuItem>
                    </Link>
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
                onClick={open}
                className="hidden lg:flex bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
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
                  {allNavLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link key={link.href} href={link.href}>
                        <DropdownMenuItem className="cursor-pointer gap-3 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
                            {Icon && (
                              <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            )}
                          </div>
                          <span className="font-medium">{link.label}</span>
                        </DropdownMenuItem>
                      </Link>
                    );
                  })}

                  {/* Tools Section */}
                  <DropdownMenuSeparator />
                  <div className="px-3 py-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold">
                      Tools
                    </p>
                  </div>

                  {/* Cart - Only show if authenticated */}
                  {isAuthenticated && (
                    <Link href="/cart">
                      <DropdownMenuItem className="cursor-pointer gap-3 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200">
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
                    </Link>
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
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                            {user?.name?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {user?.name || "User"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {user?.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Role-specific menu items */}
                      {config.menu.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link key={item.href} href={item.href}>
                            <DropdownMenuItem className="cursor-pointer gap-3 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
                                {Icon && (
                                  <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                )}
                              </div>
                              <span className="font-medium">{item.label}</span>
                            </DropdownMenuItem>
                          </Link>
                        );
                      })}

                      <Link href="/profile">
                        <DropdownMenuItem className="cursor-pointer gap-3 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="font-medium">Profile Settings</span>
                        </DropdownMenuItem>
                      </Link>

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
                          onClick={open}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
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
