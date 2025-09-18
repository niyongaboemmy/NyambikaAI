"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient, handleApiError, RoleEnum } from "@/config/api";
import { Badge } from "@/components/custom-ui/badge";
import { Button } from "@/components/custom-ui/button";
import { Input } from "@/components/custom-ui/input";
import ReactSelect from "react-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/custom-ui/dialog";
import { Skeleton } from "@/components/custom-ui/skeleton";
import ProductCard from "@/components/ProductCard";
import BoostProductDialog from "@/components/BoostProductDialog";
import {
  MapPin,
  Phone,
  Share2,
  Package,
  Star,
  Heart,
  ShoppingCart,
  Search,
  Grid,
  List,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  GitCompare,
  Eye,
  Grid3X3,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { Category, Company, Product } from "@/shared/schema";
import Share from "@/components/Share";

type Producer = {
  id: string;
  isVerified?: boolean;
};

type GroupedProducts = {
  [categoryName: string]: Product[];
};

export default function StorePage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === RoleEnum.ADMIN;
  const isProducer = user?.role === RoleEnum.PRODUCER;

  // State for smart filtering and search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [priceRange, setPriceRange] = useState("all");

  // Modern features state
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  // Product comparison state
  const [compareList, setCompareList] = useState<Set<string>>(new Set());
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [boostProductId, setBoostProductId] = useState<{
    id: string;
    producer_id: string;
  } | null>(null);

  // Detect dark mode from document class (ThemeProvider sets 'dark' class)
  const [isDark, setIsDark] = useState<boolean>(() =>
    typeof document !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : false
  );

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsDark(root.classList.contains("dark"));
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const { data: company, isLoading: companyLoading } = useQuery<Company>({
    queryKey: [`/api/companies/${id}`],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/api/companies/${id}`);
        return response.data;
      } catch (error) {
        throw new Error(handleApiError(error));
      }
    },
    enabled: !!id,
  });

  // Set dynamic page title and favicon based on company metadata
  useEffect(() => {
    if (!company) return;
    // Set document title
    document.title = company.name || document.title;

    // Update or create favicon link
    const setFavicons = (logoUrl: string) => {
      const origin = window.location.origin;
      const toAbsolute = (u: string) =>
        /^(https?:)?\/\//i.test(u) || u.startsWith("data:")
          ? u
          : `${origin}${u.startsWith("/") ? "" : "/"}${u}`;
      const href = toAbsolute(logoUrl as string);

      const mimeFromUrl = (url: string): string | undefined => {
        const l = url.toLowerCase();
        if (l.endsWith(".svg") || l.includes("image/svg"))
          return "image/svg+xml";
        if (l.endsWith(".png")) return "image/png";
        if (l.endsWith(".jpg") || l.endsWith(".jpeg")) return "image/jpeg";
        if (l.endsWith(".ico")) return "image/x-icon";
        return undefined;
      };

      const ensureLink = (rel: string, attrs: Record<string, string>) => {
        let link = document.querySelector<HTMLLinkElement>(
          `link[rel="${rel}"]`
        );
        if (!link) {
          link = document.createElement("link");
          link.rel = rel as any;
          document.head.appendChild(link);
        }
        Object.entries(attrs).forEach(([k, v]) => link!.setAttribute(k, v));
      };

      const type = mimeFromUrl(href);
      // Common favicons
      ensureLink("icon", { href, ...(type ? { type } : {}), sizes: "32x32" });
      ensureLink("shortcut icon", { href, ...(type ? { type } : {}) });
      ensureLink("apple-touch-icon", { href, sizes: "180x180" });
      // Better Safari pin support for SVG logos
      if ((type || "").includes("svg")) {
        ensureLink("mask-icon", { href, color: "#5bbad5" });
      }
    };

    if (company.logoUrl) {
      setFavicons(company.logoUrl as string);
    } else {
      // Use system logo fallback when company has no logo
      setFavicons("/nyambika_dark_icon.png");
    }
  }, [company]);

  // Build JSON-LD for SEO rich results (Organization/LocalBusiness)
  const storeJsonLd = useMemo(() => {
    if (!company) return null;
    const origin =
      (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SITE_URL) ||
      (typeof window !== "undefined" ? window.location.origin : "");
    const toAbsolute = (u?: string | null) => {
      if (!u) return undefined;
      return /^(https?:)?\/\//i.test(u) || u.startsWith("data:")
        ? u
        : `${origin}${u.startsWith("/") ? "" : "/"}${u}`;
    };
    const url = `${origin}/store/${id}`;
    const logo =
      toAbsolute(company.logoUrl) || toAbsolute("/nyambika_dark_icon.png");
    const sameAs = company.websiteUrl ? [company.websiteUrl] : undefined;
    const telephone = company.phone || undefined;
    const address = company.location
      ? { "@type": "PostalAddress", streetAddress: company.location }
      : undefined;
    return {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: company.name,
      url,
      logo,
      image: logo,
      sameAs,
      telephone,
      address,
    } as const;
  }, [company, id]);

  // Fetch the producer to check verification status (status is on producer, not company)
  const { data: producer } = useQuery<Product>({
    queryKey: ["/api/producers", (company as any)?.producerId],
    queryFn: async () => {
      try {
        const producerId = (company as any)?.producerId as string;
        const response = await apiClient.get(`/api/producers/${producerId}`);
        return response.data;
      } catch (error) {
        throw new Error(handleApiError(error));
      }
    },
    enabled: Boolean((company as any)?.producerId),
  });

  const producerVerified = useMemo(() => {
    if (!producer) return true; // default to true if unknown
    return Boolean((producer as any).isVerified);
  }, [producer]);

  const {
    data: products,
    isLoading: productsLoading,
    isError: productsError,
    error: productsErrorObj,
  } = useQuery<Product[]>({
    queryKey: [`/api/companies/${id}/products`],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/api/companies/${id}/products`);
        return response.data;
      } catch (error) {
        // Pass through for UI handling
        throw new Error(handleApiError(error));
      }
    },
    enabled: !!id,
  });

  // Determine if the store should show empty state due to subscription restriction
  const subscriptionBlocked = React.useMemo(() => {
    if (!productsError) return false;
    const raw: any = productsErrorObj as any;
    const msg: string =
      typeof raw === "string" ? raw : String(raw?.message || "");
    return (
      msg.toLowerCase().includes("subscription") ||
      msg.toLowerCase().includes("unavailable")
    );
  }, [productsError, productsErrorObj]);

  // Use a safe products list for rendering
  const productsList: Product[] = React.useMemo(
    () => (subscriptionBlocked || !producerVerified ? [] : products || []),
    [subscriptionBlocked, producerVerified, products]
  );

  // Fetch all categories with images
  const { data: allCategories = [], isLoading: categoriesLoading } = useQuery<
    Category[]
  >({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/api/categories");
        return response.data;
      } catch (error) {
        throw new Error(handleApiError(error));
      }
    },
  });

  // Smart filtering and sorting logic
  const filteredAndSortedProducts = useMemo(() => {
    if (!productsList) return [];

    const filtered = productsList.filter((product) => {
      // Search filter
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory =
        selectedCategory === "all" || product.categoryId === selectedCategory;

      // Price range filter
      const price = parseFloat(String(product.price));
      let matchesPrice = true;
      if (priceRange === "low") matchesPrice = price < 50000;
      else if (priceRange === "medium")
        matchesPrice = price >= 50000 && price < 200000;
      else if (priceRange === "high") matchesPrice = price >= 200000;

      return matchesSearch && matchesCategory && matchesPrice;
    });

    // Sort products
    if (sortBy !== "featured") {
      filtered.sort((a, b) => {
        switch (sortBy) {
          case "price-low":
            return parseFloat(String(a.price)) - parseFloat(String(b.price));
          case "price-high":
            return parseFloat(String(b.price)) - parseFloat(String(a.price));
          case "name":
            return a.name.localeCompare(b.name);
          default:
            return 0; // 'featured' preserves API order
        }
      });
    }

    return filtered;
  }, [productsList, searchQuery, selectedCategory, sortBy, priceRange]);

  // Get unique categories for filter dropdown
  const categories = useMemo(() => {
    if (!productsList) return [];

    const map = new Map<string, string>();

    productsList.forEach((p: Product) => {
      if (p.categoryId) {
        map.set(p.categoryId, p.categoryName || "");
      }
    });

    return Array.from(map, ([categoryId, categoryName]) => ({
      categoryId,
      categoryName,
    }));
  }, [productsList]);

  // react-select options
  const categoryOptions = useMemo(
    () => [
      // { value: "all", label: "All Categories" },
      ...categories.map((c) => ({
        value: c.categoryId,
        label: c.categoryName,
      })),
    ],
    [categories]
  );

  const priceOptions = useMemo(
    () => [
      // { value: "all", label: "All Prices" },
      { value: "low", label: "Under 50K" },
      { value: "medium", label: "50K - 200K" },
      { value: "high", label: "Over 200K" },
    ],
    []
  );

  const sortOptions = useMemo(
    () => [
      // { value: "featured", label: "Featured" }, // honors server order (displayOrder -> newest)
      { value: "name", label: "Name A-Z" },
      { value: "price-low", label: "Price: Low to High" },
      { value: "price-high", label: "Price: High to Low" },
    ],
    []
  );

  // react-select styles for light/dark modes
  const selectStyles = useMemo(() => {
    // Match Input styles: rounded-lg, 2px border, hover:border-blue-200, focus:border-blue-400
    const lightBg = "rgba(255,255,255,0.8)"; // bg-white/80
    const darkBg = "#1F2937"; // gray-800
    const bg = isDark ? darkBg : lightBg;
    const baseBorder = "transparent"; // matches input's default border-2 border-transparent
    const hoverBorder = "#BFDBFE"; // blue-200
    const focusBorder = isDark ? "#6366F1" : "#60A5FA"; // indigo-500 (dark) / blue-400 (light)
    const text = isDark ? "#E5E7EB" : "#111827";
    const muted = isDark ? "#9CA3AF" : "#6B7280";
    const hoverBg = isDark ? "#111827" : "#F9FAFB";
    return {
      control: (base: any, state: any) => ({
        ...base,
        backgroundColor: bg,
        borderColor: state.isFocused ? focusBorder : baseBorder,
        borderWidth: 2,
        borderRadius: 8,
        boxShadow: state.isFocused ? `0 0 0 2px ${focusBorder}33` : "none",
        color: text,
        minHeight: 40,
        ":hover": { borderColor: hoverBorder },
        transition: "all 200ms ease",
      }),
      menu: (base: any) => ({
        ...base,
        backgroundColor: isDark ? "#111827" : "#fff",
        border: `1px solid ${isDark ? "#374151" : "#E5E7EB"}`,
        boxShadow: isDark
          ? "0 10px 15px -3px rgba(0,0,0,0.4), 0 4px 6px -4px rgba(0,0,0,0.4)"
          : "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",
        zIndex: 50,
      }),
      option: (base: any, state: any) => ({
        ...base,
        backgroundColor: state.isSelected
          ? focusBorder
          : state.isFocused
          ? hoverBg
          : isDark
          ? "#111827"
          : "#fff",
        color: state.isSelected ? "#fff" : text,
        ":active": {
          backgroundColor: state.isSelected ? focusBorder : hoverBg,
        },
      }),
      singleValue: (base: any) => ({ ...base, color: text }),
      placeholder: (base: any) => ({ ...base, color: muted }),
      input: (base: any) => ({ ...base, color: text }),
      valueContainer: (base: any) => ({ ...base, padding: "2px 12px" }),
      indicatorsContainer: (base: any) => ({ ...base, color: muted }),
      dropdownIndicator: (base: any) => ({ ...base, color: muted }),
      clearIndicator: (base: any) => ({ ...base, color: muted }),
    };
  }, [isDark]);

  // Pagination logic
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedProducts.slice(
      startIndex,
      startIndex + itemsPerPage
    );
  }, [filteredAndSortedProducts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);

  // Modern feature handlers
  const toggleWishlist = (productId: string) => {
    const newWishlist = new Set(wishlist);
    if (newWishlist.has(productId)) {
      newWishlist.delete(productId);
      toast({
        title: "Removed from wishlist",
        description: "Product removed from your wishlist.",
      });
    } else {
      newWishlist.add(productId);
      toast({
        title: "Added to wishlist",
        description: "Product added to your wishlist.",
      });
    }
    setWishlist(newWishlist);
  };

  const toggleCompare = (productId: string) => {
    const newCompareList = new Set(compareList);
    if (newCompareList.has(productId)) {
      newCompareList.delete(productId);
      toast({
        title: "Removed from comparison",
        description: "Product removed from comparison list.",
      });
    } else if (newCompareList.size >= 4) {
      toast({
        title: "Comparison limit reached",
        description: "You can compare up to 4 products at once.",
        variant: "destructive",
      });
      return;
    } else {
      newCompareList.add(productId);
      toast({
        title: "Added to comparison",
        description: "Product added to comparison list.",
      });
    }
    setCompareList(newCompareList);
  };

  const clearCompareList = () => {
    setCompareList(new Set());
    setIsCompareModalOpen(false);
  };

  const getCompareProducts = () => {
    return products?.filter((p) => compareList.has(p.id)) || [];
  };

  const openQuickView = (product: Product) => {
    setSelectedProduct(product);
    setIsQuickViewOpen(true);
  };

  if (companyLoading || productsLoading) {
    return (
      <div className="min-h-screen bg-transparent -mt-12">
        {/* Hero skeleton (logo, name, location/phone, actions) */}
        {/* Store Header Skeleton */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-900 dark:via-purple-900 dark:to-indigo-900 pt-8">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 via-transparent to-purple-500/30 animate-pulse" />
          <div className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative">
            <div className="max-w-4xl mx-auto text-center space-y-4">
              {/* Logo and Title */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Skeleton className="w-24 h-24 rounded-full bg-white/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-white/10 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-8 w-64 mx-auto bg-white/30" />
                  <Skeleton className="h-5 w-40 mx-auto bg-white/20" />
                </div>
              </div>

              {/* Store Info */}
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/90">
                <Skeleton className="h-4 w-48 bg-white/20" />
                <Skeleton className="h-4 w-36 bg-white/20" />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <Skeleton className="h-10 w-32 rounded-full bg-white/30" />
                <Skeleton className="h-10 w-32 rounded-full bg-white/20" />
              </div>
            </div>
          </div>
        </div>

        {/* Store Stats Skeleton */}
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((stat) => (
                <div
                  key={stat}
                  className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700/50"
                >
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24 bg-gray-300 dark:bg-gray-600" />
                      <Skeleton className="h-5 w-12 bg-gray-200 dark:bg-gray-800" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Categories Skeleton */}
        <div className="py-8 bg-gray-50 dark:bg-gray-900/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-6">
              <Skeleton className="h-6 w-48 mx-auto bg-gray-300 dark:bg-gray-700" />
              <Skeleton className="h-3 w-64 mx-auto mt-2 bg-gray-200 dark:bg-gray-800" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="group flex flex-col items-center p-3 rounded-xl bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
                >
                  <Skeleton className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700 group-hover:scale-105 transition-transform duration-200" />
                  <Skeleton className="h-3 w-16 mt-2 bg-gray-200 dark:bg-gray-700" />
                  <Skeleton className="h-2 w-12 mt-1 bg-gray-100 dark:bg-gray-600" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filters & Search Skeleton */}
        <div className="sticky top-16 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 gap-4">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-2xl">
                <Skeleton className="h-10 w-full rounded-lg bg-gray-100 dark:bg-gray-800" />
              </div>

              {/* Filter Controls */}
              <div className="flex flex-wrap items-center gap-3">
                <Skeleton className="h-9 w-28 rounded-lg bg-gray-100 dark:bg-gray-800" />
                <Skeleton className="h-9 w-32 rounded-lg bg-gray-100 dark:bg-gray-800" />
                <Skeleton className="h-9 w-24 rounded-lg bg-gray-100 dark:bg-gray-800" />

                {/* View Toggle */}
                <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            </div>

            {/* Active Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 text-sm">
              <Skeleton className="h-4 w-48 bg-gray-100 dark:bg-gray-800" />
              <Skeleton className="h-4 w-24 bg-gray-100 dark:bg-gray-800" />
            </div>
          </div>
        </div>

        {/* Products Grid Skeleton */}
        <div className="py-6 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="group relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 dark:border-gray-700/50"
                >
                  {/* Image Placeholder */}
                  <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                    <Skeleton className="w-full h-full" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <Skeleton className="h-5 w-3/4 mb-2 bg-gray-200 dark:bg-gray-700" />
                    <Skeleton className="h-4 w-1/2 bg-gray-100 dark:bg-gray-600" />

                    <div className="mt-3 flex items-center justify-between">
                      <Skeleton className="h-5 w-16 bg-gray-200 dark:bg-gray-700" />
                      <div className="flex space-x-2">
                        <Skeleton className="h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-700" />
                        <Skeleton className="h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-700" />
                      </div>
                    </div>
                  </div>

                  {/* Badge */}
                  <div className="absolute top-3 right-3">
                    <Skeleton className="h-5 w-16 rounded-full bg-white/90 dark:bg-gray-700/90" />
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Skeleton */}
            <div className="mt-10 flex items-center justify-center">
              <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
                <Skeleton className="h-9 w-9 rounded-md" />
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-9 w-9 rounded-md" />
                ))}
                <Skeleton className="h-9 w-9 rounded-md" />
              </div>
            </div>
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="col-span-6 md:col-span-4 lg:col-span-2 group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow"
              >
                <div className="relative overflow-hidden mb-2 md:pb-2 lg:mb-2">
                  <Skeleton className="w-full aspect-square" />
                </div>
                <div className="space-y-1 px-0.5 text-center p-4 pt-2">
                  <Skeleton className="h-4 w-3/4 mx-auto" />
                  <Skeleton className="h-3 w-2/3 mx-auto" />
                  <Skeleton className="h-4 w-20 mx-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <Package className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Store Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The store you're looking for doesn't exist or may have been moved.
          </p>
          <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
            Browse All Stores
          </Button>
        </div>
      </div>
    );
  }

  // Group products by category
  const groupedProducts: GroupedProducts = (products || []).reduce(
    (acc, product) => {
      const categoryId = product.categoryId || "Uncategorized";
      if (!acc[categoryId]) {
        acc[categoryId] = [];
      }
      acc[categoryId].push(product);
      return acc;
    },
    {} as GroupedProducts
  );

  return (
    <div className="min-h-screen bg-transparent -mt-12">
      {storeJsonLd && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd) }}
        />
      )}
      {/* Enhanced Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 dark:from-blue-950 via-purple-600 dark:via-purple-900 to-indigo-600 dark:to-indigo-900 pt-8">
        <div className="absolute inset-0 bg-black/20 dark:bg-black" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 dark:from-blue-950 via-transparent to-blue-500/30 dark:to-violet-950/60 animate-pulse dark:animate-none" />
        <div
          className="absolute inset-0 bg-gradient-to-l from-pink-500/20 dark:from-pink-950/40 via-transparent to-yellow-500/20 dark:to-blue-950/70 animate-pulse dark:animate-none"
          style={{ animationDelay: "2s" }}
        />
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full opacity-20 dark:opacity-5 animate-float" />
          <div
            className="absolute top-20 right-20 w-24 h-24 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-20 dark:opacity-5 animate-float"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute bottom-10 left-1/3 w-20 h-20 bg-gradient-to-r from-indigo-400 to-blue-400 rounded-full opacity-20 dark:opacity-5 animate-float"
            style={{ animationDelay: "3s" }}
          />
        </div>
        <div className="px-4 sm:px-6 md:px-6 py-12 sm:py-16 pb-8 sm:pb-10 relative ">
          <div className="text-center text-white space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row justify-center items-center sm:space-x-3 space-y-3 sm:space-y-0">
              <div className="relative group pt-3 md:pt-2">
                {company.logoUrl ? (
                  <div className="w-28 h-28 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl transition-transform group-hover:scale-110">
                    <img
                      src={company.logoUrl}
                      alt={`${company.name} logo`}
                      className="min-h-full min-w-full h-auto w-auto rounded-full shadow-2xl transition-transform group-hover:scale-110 object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-28 h-28 sm:w-24 sm:h-24 rounded-full bg-gradient-to-r from-white/20 to-white/10 border-4 border-white/20 flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110">
                    <Package className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
              </div>
              <div className="flex flex-col sm:flex-row items-center sm:space-x-2 space-y-2 sm:space-y-0">
                <h1 className="text-xl sm:text-2xl md:text-4xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent text-center sm:text-left">
                  {company.name}
                </h1>
                {producerVerified ? (
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg animate-pulse">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg animate-pulse">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending Verification
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-6 text-white/90">
              <div className="flex items-center space-x-2 hover:text-white transition-colors">
                <MapPin className="w-4 h-4" />
                <span className="text-sm sm:text-base">{company.location}</span>
              </div>
              <div className="flex items-center space-x-2 hover:text-white transition-colors">
                <Phone className="w-4 h-4" />
                <span className="text-sm sm:text-base">{company.phone}</span>
              </div>
            </div>

            <div className="flex flex-row justify-center space-x-4 pt-4">
              <Share
                metadata={{
                  title: company.name,
                  description:
                    (company.location && company.location.trim()) ||
                    `Explore products from ${company.name} on Nyambika`,
                  icon: company.logoUrl || undefined,
                  url:
                    (typeof window !== "undefined" &&
                      `${window.location.origin}/store/${id}`) ||
                    `/store/${id}`,
                }}
                triggerClassName="bg-gradient-to-r bg-transparent text-white from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 dark:text-white border-white/30 dark:bg-transparent backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl text-sm sm:text-base"
                triggerLabel="Share Store"
              />
              {company.websiteUrl && (
                <Button
                  variant="secondary"
                  className="bg-gradient-to-r bg-transparent text-white from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 dark:text-white border-white/30 dark:bg-transparent backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl text-sm sm:text-base"
                  onClick={() =>
                    window.open(
                      company.websiteUrl || "#",
                      "_blank",
                      "noopener,noreferrer"
                    )
                  }
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">
                    Visit Website
                  </span>
                  <span className="sm:hidden text-sm">Website</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mini Stats Section */}
      <div className="">
        <div className="px-4 sm:px-6 md:px-6 py-3">
          <div className="flex justify-center">
            <div className="flex items-center gap-3 sm:gap-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-4 sm:px-6 py-3 shadow-lg overflow-x-auto">
              <div className="flex items-center gap-1 sm:gap-2 group hover:scale-105 transition-transform flex-shrink-0">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <Package className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <div className="text-center">
                  <div className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">
                    {productsList.length}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 -mt-1 hidden sm:block">
                    Products
                  </div>
                </div>
              </div>

              <div className="w-px h-6 sm:h-8 bg-gray-200 dark:bg-gray-600" />

              <div className="flex items-center gap-1 sm:gap-2 group hover:scale-105 transition-transform flex-shrink-0">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Grid className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <div className="text-center">
                  <div className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">
                    {categories.length}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 -mt-1 hidden sm:block">
                    Categories
                  </div>
                </div>
              </div>

              <div className="w-px h-6 sm:h-8 bg-gray-200 dark:bg-gray-600" />

              <div className="flex items-center gap-1 sm:gap-2 group hover:scale-105 transition-transform flex-shrink-0">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <div className="text-center">
                  <div className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">
                    {productsList.filter((p) => p.inStock).length}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 -mt-1 hidden sm:block">
                    Available
                  </div>
                </div>
              </div>

              <div className="w-px h-6 sm:h-8 bg-gray-200 dark:bg-gray-600" />

              <div className="flex items-center gap-1 sm:gap-2 group hover:scale-105 transition-transform flex-shrink-0">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <div className="text-center">
                  <div className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">
                    4.8
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 -mt-1 hidden sm:block">
                    Rating
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="py-4">
        <div className="container mx-auto px-3 md:px-0">
          <div className="px-3 md:px-2">
            <div className="text-center mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                Shop by Category
              </h2>
            </div>

            {categoriesLoading ? (
              <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex flex-col items-center space-y-1">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <Skeleton className="w-16 h-3" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4">
                {/* All Categories Button */}
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`group flex flex-col items-center space-y-2 p-2 rounded-xl transition-all duration-300 hover:scale-105 ${
                    selectedCategory === "all"
                      ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 hover:shadow-lg"
                  }`}
                >
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      selectedCategory === "all"
                        ? "bg-white/20 backdrop-blur-sm"
                        : "bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30"
                    }`}
                  >
                    <Grid3X3
                      className={`w-5 h-5 sm:w-6 sm:h-6 ${
                        selectedCategory === "all"
                          ? "text-white"
                          : "text-blue-600 dark:text-blue-400"
                      }`}
                    />
                  </div>
                  <span
                    className={`text-xs font-medium text-center ${
                      selectedCategory === "all"
                        ? "text-white"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    All
                  </span>
                  {selectedCategory === "all" && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  )}
                </button>

                {/* Category Buttons */}
                {categories.map((category) => {
                  const categoryData = allCategories.find(
                    (c) => c.id === category.categoryId
                  );
                  return (
                    <button
                      key={category.categoryId}
                      onClick={() => setSelectedCategory(category.categoryId)}
                      className={`group flex flex-col items-center space-y-2 p-2 rounded-xl transition-all duration-300 hover:scale-105 ${
                        selectedCategory === category.categoryId
                          ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                          : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 hover:shadow-lg"
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-full overflow-hidden transition-all duration-300 ${
                          selectedCategory === category.categoryId
                            ? "ring-2 ring-white/30"
                            : "ring-1 ring-transparent group-hover:ring-blue-200 dark:group-hover:ring-blue-800"
                        }`}
                      >
                        {categoryData?.imageUrl ? (
                          <img
                            src={categoryData.imageUrl}
                            alt={category.categoryName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className={`w-full h-full flex items-center justify-center ${
                              selectedCategory === category.categoryId
                                ? "bg-white/20 backdrop-blur-sm"
                                : "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600"
                            }`}
                          >
                            <Package
                              className={`w-6 h-6 ${
                                selectedCategory === category.categoryId
                                  ? "text-white"
                                  : "text-gray-500 dark:text-gray-400"
                              }`}
                            />
                          </div>
                        )}
                      </div>
                      <span
                        className={`text-xs font-medium text-center leading-tight ${
                          selectedCategory === category.categoryId
                            ? "text-white"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {categoryData && categoryData?.name.length > 12
                          ? categoryData?.name.substring(0, 12) + "..."
                          : categoryData?.name}
                      </span>
                      {selectedCategory === category.categoryId && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Smart Search and Filter Section with Gradient Background */}
      <div className="bg-gradient-to-r from-white via-white to-white/80 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 border-b border-gray-200 dark:border-none dark:border-gray-700 dark:shadow-sm pt-4 md:sticky md:top-[4.5rem] z-10">
        <div className="container mx-auto px-3 md:px-0 py-2 pt-0 flex flex-col md:flex-row md:items-center gap-2">
          <div className="flex flex-col gap-4">
            {/* Comparison Bar */}
            {compareList.size > 0 && (
              <div className="w-full mb-4 p-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <GitCompare className="w-5 h-5" />
                    <span className="font-medium">
                      {compareList.size} products selected for comparison
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                      onClick={() => setIsCompareModalOpen(true)}
                      disabled={compareList.size < 2}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Compare
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                      onClick={clearCompareList}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="grid grid-cols-2 sm:flex gap-3 flex-1">
                <div className="w-full sm:w-40 md:w-60">
                  <ReactSelect
                    options={categoryOptions}
                    value={categoryOptions.find(
                      (o) => o.value === selectedCategory
                    )}
                    onChange={(opt) =>
                      opt && setSelectedCategory((opt as any).value.categoryId)
                    }
                    placeholder="Category"
                    styles={selectStyles}
                    isSearchable
                    className="border dark:border-blue-500/0 rounded-md"
                  />
                </div>

                <div className="w-full sm:w-36 md:w-56">
                  <ReactSelect
                    options={priceOptions}
                    value={priceOptions.find((o) => o.value === priceRange)}
                    onChange={(opt) => opt && setPriceRange((opt as any).value)}
                    placeholder="Price"
                    styles={selectStyles}
                    isSearchable={false}
                    className="border dark:border-blue-500/0 rounded-md"
                  />
                </div>

                <div className="w-full sm:w-36 md:w-56">
                  <ReactSelect
                    options={sortOptions}
                    value={sortOptions.find((o) => o.value === sortBy)}
                    onChange={(opt) => opt && setSortBy((opt as any).value)}
                    placeholder="Sort by"
                    styles={selectStyles}
                    isSearchable={false}
                    className="border dark:border-blue-50/00 rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Search with Gradient Border */}
          <div className="flex-1 w-full">
            <div className="relative group w-full">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity" />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 " />
              <Input
                placeholder="Search products ..."
                aria-label="Search products"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 rounded-lg bg-white/80 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 backdrop-blur-sm border-2 border-transparent hover:border-blue-200 focus:border-blue-400 focus:ring-0 transition-all duration-300"
              />
            </div>
          </div>
        </div>
        {/* Results Summary */}
        <div className="container mx-auto px-3 pb-2 mt-0 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>
            Showing {filteredAndSortedProducts.length} of{" "}
            {(products || []).length} products
            {searchQuery && ` for "${searchQuery}"`}
          </span>
          {filteredAndSortedProducts.length > 0 && (
            <span>
              {filteredAndSortedProducts.filter((p) => p.inStock).length}{" "}
              available
            </span>
          )}
        </div>
      </div>

      {/* Enhanced Products Section */}
      <div className="container mx-auto px-3 md:px-0 py-5">
        {filteredAndSortedProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              {searchQuery ? (
                <Search className="w-12 h-12 text-white" />
              ) : (
                <Package className="w-12 h-12 text-white" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {searchQuery ? "No products found" : "No Products Yet"}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              {searchQuery
                ? `No products match your search for "${searchQuery}". Try adjusting your filters.`
                : "This store is getting ready to showcase amazing products. Check back soon!"}
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setPriceRange("all");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-12 gap-2">
                {paginatedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={{
                      id: product.id,
                      name: product.name,
                      nameRw: product.nameRw || "",
                      description: product.description || "",
                      price: product.price || 0,
                      imageUrl: product.imageUrl || "",
                      categoryId: product.categoryId || "",
                      categoryName: product.categoryName || null,
                      sizes: product.sizes || null,
                      colors: product.colors || null,
                      inStock: product.inStock || false,
                      createdAt: new Date(),
                      updatedAt: new Date(),
                      producerId: (company as any)?.producerId || "",
                      additionalImages: null,
                      stockQuantity: product.stockQuantity || 0,
                      isApproved: product.isApproved || false,
                    }}
                    isProducer={isProducer}
                    isAdmin={isAdmin}
                    currentUserId={user?.id || undefined}
                    showBoostLabel={true}
                    isFavorited={wishlist.has(product.id)}
                    onToggleFavorite={toggleWishlist}
                    onViewDetails={(productId: string) => {
                      router.push(`/product/${productId}`);
                    }}
                    onBoost={() =>
                      setBoostProductId({
                        id: product.id,
                        producer_id: product.producerId || "",
                      })
                    }
                    hideActions={false}
                    containerClassName="hover:shadow-2xl transition-all duration-500 hover:shadow-blue-500/25 transform hover:-translate-y-2"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={{
                      id: product.id,
                      name: product.name,
                      nameRw: product.nameRw || "",
                      description: product.description || "",
                      price: product.price || 0,
                      imageUrl: product.imageUrl || "",
                      categoryId: product.categoryId || "",
                      categoryName: product.categoryName || null,
                      sizes: product.sizes || null,
                      colors: product.colors || null,
                      inStock: product.inStock || false,
                      createdAt: new Date(),
                      updatedAt: new Date(),
                      producerId: (company as any)?.producerId || "",
                      additionalImages: null,
                      stockQuantity: product.stockQuantity || 0,
                      isApproved: product.isApproved || false,
                    }}
                    isProducer={isProducer}
                    isAdmin={isAdmin}
                    currentUserId={user?.id || undefined}
                    showBoostLabel={true}
                    isFavorited={wishlist.has(product.id)}
                    onToggleFavorite={toggleWishlist}
                    onViewDetails={(productId: string) => {
                      router.push(`/product/${productId}`);
                    }}
                    onBoost={() =>
                      (isAdmin || isProducer) &&
                      (company as any)?.producerId === user?.id
                        ? setBoostProductId({
                            id: product.id,
                            producer_id: product.producerId || "",
                          })
                        : null
                    }
                    hideActions={false}
                    containerClassName="col-span-12 hover:shadow-lg transition-shadow"
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4 mt-8">
                <Button
                  variant="outline"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      <Dialog open={isQuickViewOpen} onOpenChange={setIsQuickViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto rounded-2xl">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl sm:text-2xl font-bold">
                  {selectedProduct.name}
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                {/* Product Image */}
                <div className="aspect-square overflow-hidden rounded-lg">
                  <img
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Product Details */}
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline">{selectedProduct.name}</Badge>
                      {selectedProduct.inStock ? (
                        <Badge className="bg-green-500">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          In Stock
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-red-500 text-white"
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Out of Stock
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {selectedProduct.description}
                    </p>
                  </div>

                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {parseFloat(String(selectedProduct.price)).toLocaleString()}{" "}
                    RWF
                  </div>

                  {(selectedProduct.sizes || selectedProduct.colors) && (
                    <div className="space-y-4">
                      {selectedProduct.sizes &&
                        selectedProduct.sizes.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">
                              Available Sizes:
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {selectedProduct.sizes.map((size, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="px-3 py-1"
                                >
                                  {size}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                      {selectedProduct.colors &&
                        selectedProduct.colors.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">
                              Available Colors:
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {selectedProduct.colors.map((color, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="px-3 py-1"
                                >
                                  {color}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      variant="outline"
                      className={`flex-1 ${
                        wishlist.has(selectedProduct.id)
                          ? "bg-red-50 border-red-200 text-red-600"
                          : ""
                      }`}
                      onClick={() => toggleWishlist(selectedProduct.id)}
                    >
                      <Heart
                        className={`w-4 h-4 mr-2 ${
                          wishlist.has(selectedProduct.id) ? "fill-current" : ""
                        }`}
                      />
                      <span className="hidden sm:inline">
                        {wishlist.has(selectedProduct.id)
                          ? "Remove from Wishlist"
                          : "Add to Wishlist"}
                      </span>
                      <span className="sm:hidden">
                        {wishlist.has(selectedProduct.id)
                          ? "Remove"
                          : "Wishlist"}
                      </span>
                    </Button>
                    <Button
                      className="flex-1"
                      disabled={!selectedProduct.inStock}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {selectedProduct.inStock
                        ? "Contact Seller"
                        : "Out of Stock"}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Product Comparison Modal */}
      <Dialog open={isCompareModalOpen} onOpenChange={setIsCompareModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-lg sm:text-xl">
              <GitCompare className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Comparison ({getCompareProducts().length})</span>
            </DialogTitle>
          </DialogHeader>

          {getCompareProducts().length > 0 ? (
            <div className="space-y-6">
              {/* Product Images */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {getCompareProducts().map((product) => (
                  <div key={product.id} className="relative group">
                    <div className="aspect-square overflow-hidden rounded-lg bg-gradient-to-br from-gray-100 to-gray-200">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute -top-2 -right-2 w-8 h-8 p-0 bg-white shadow-lg hover:bg-red-50 hover:border-red-200"
                      onClick={() => toggleCompare(product.id)}
                    >
                      <XCircle className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Comparison Table */}
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="min-w-full px-4 sm:px-0">
                  <table className="w-full border-collapse min-w-[600px]">
                    <tbody className="space-y-4">
                      {/* Product Names */}
                      <tr className="border-b">
                        <td className="font-semibold text-gray-600 p-2 sm:p-3 w-20 sm:w-32 text-xs sm:text-sm">
                          Product
                        </td>
                        {getCompareProducts().map((product) => (
                          <td
                            key={product.id}
                            className="p-2 sm:p-3 text-center"
                          >
                            <div className="font-bold text-sm sm:text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                              {product.name.length > 20
                                ? product.name.substring(0, 20) + "..."
                                : product.name}
                            </div>
                          </td>
                        ))}
                      </tr>

                      {/* Prices */}
                      <tr className="border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                        <td className="font-semibold text-gray-600 p-2 sm:p-3 text-xs sm:text-sm">
                          Price
                        </td>
                        {getCompareProducts().map((product) => (
                          <td
                            key={product.id}
                            className="p-2 sm:p-3 text-center"
                          >
                            <div className="text-sm sm:text-xl font-bold text-green-600">
                              {parseFloat(
                                String(product.price)
                              ).toLocaleString()}{" "}
                              RWF
                            </div>
                          </td>
                        ))}
                      </tr>

                      {/* Stock Status */}
                      <tr className="border-b">
                        <td className="font-semibold text-gray-600 p-2 sm:p-3 text-xs sm:text-sm">
                          Stock
                        </td>
                        {getCompareProducts().map((product) => (
                          <td
                            key={product.id}
                            className="p-2 sm:p-3 text-center"
                          >
                            <Badge
                              className={
                                product.inStock
                                  ? "bg-green-500 text-xs"
                                  : "bg-red-500 text-xs"
                              }
                            >
                              {product.inStock ? (
                                <>
                                  <CheckCircle className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                                  <span className="hidden sm:inline">
                                    In Stock
                                  </span>
                                  <span className="sm:hidden">✓</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                                  <span className="hidden sm:inline">
                                    Out of Stock
                                  </span>
                                  <span className="sm:hidden">✗</span>
                                </>
                              )}
                            </Badge>
                          </td>
                        ))}
                      </tr>

                      {/* Categories */}
                      <tr className="border-b bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                        <td className="font-semibold text-gray-600 p-2 sm:p-3 text-xs sm:text-sm">
                          Category
                        </td>
                        {getCompareProducts().map((product) => (
                          <td
                            key={product.id}
                            className="p-2 sm:p-3 text-center"
                          >
                            <Badge
                              variant="outline"
                              className="bg-white/80 text-xs"
                            >
                              {product.categoryId &&
                              product.categoryId.length > 10
                                ? product.categoryId.substring(0, 10) + "..."
                                : product.name}
                            </Badge>
                          </td>
                        ))}
                      </tr>

                      {/* Sizes */}
                      <tr className="border-b">
                        <td className="font-semibold text-gray-600 p-2 sm:p-3 text-xs sm:text-sm">
                          Sizes
                        </td>
                        {getCompareProducts().map((product) => (
                          <td
                            key={product.id}
                            className="p-2 sm:p-3 text-center"
                          >
                            <div className="flex flex-wrap gap-1 justify-center">
                              {product.sizes && product.sizes.length > 0 ? (
                                product.sizes.slice(0, 2).map((size, index) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="text-xs px-1 py-0.5"
                                  >
                                    {size}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-gray-400 text-xs">
                                  N/A
                                </span>
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>

                      {/* Colors */}
                      <tr className="border-b bg-gradient-to-r from-pink-50 to-red-50 dark:from-pink-900/20 dark:to-red-900/20">
                        <td className="font-semibold text-gray-600 p-2 sm:p-3 text-xs sm:text-sm">
                          Colors
                        </td>
                        {getCompareProducts().map((product) => (
                          <td
                            key={product.id}
                            className="p-2 sm:p-3 text-center"
                          >
                            <div className="flex flex-wrap gap-1 justify-center">
                              {product.colors && product.colors.length > 0 ? (
                                product.colors
                                  .slice(0, 2)
                                  .map((color, index) => (
                                    <Badge
                                      key={index}
                                      variant="outline"
                                      className="text-xs px-1 py-0.5"
                                    >
                                      {color}
                                    </Badge>
                                  ))
                              ) : (
                                <span className="text-gray-400 text-xs">
                                  N/A
                                </span>
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>

                      {/* Actions */}
                      <tr>
                        <td className="font-semibold text-gray-600 p-2 sm:p-3 text-xs sm:text-sm">
                          Actions
                        </td>
                        {getCompareProducts().map((product) => (
                          <td
                            key={product.id}
                            className="p-2 sm:p-3 text-center"
                          >
                            <div className="flex flex-col gap-1 sm:gap-2">
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-xs px-2 py-1"
                                onClick={() => {
                                  openQuickView(product);
                                  setIsCompareModalOpen(false);
                                }}
                              >
                                <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                <span className="hidden sm:inline">
                                  View Details
                                </span>
                                <span className="sm:hidden">View</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className={`text-xs px-2 py-1 ${
                                  wishlist.has(product.id)
                                    ? "bg-red-50 border-red-200 text-red-600"
                                    : ""
                                }`}
                                onClick={() => toggleWishlist(product.id)}
                              >
                                <Heart
                                  className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 ${
                                    wishlist.has(product.id)
                                      ? "fill-current"
                                      : ""
                                  }`}
                                />
                                {wishlist.has(product.id)
                                  ? "Remove"
                                  : "Wishlist"}
                              </Button>
                            </div>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={clearCompareList}
                  className="w-full sm:w-auto"
                >
                  Clear All
                </Button>
                <div className="text-xs sm:text-sm text-gray-500 text-center">
                  <span className="hidden sm:inline">
                    Compare up to 4 products • {4 - compareList.size} slots
                    remaining
                  </span>
                  <span className="sm:hidden">
                    {4 - compareList.size} slots left
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <GitCompare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Products to Compare
              </h3>
              <p className="text-gray-500">
                Add products to comparison by clicking the compare icon on
                product cards.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Boost Dialog for store page */}
      {boostProductId &&
        boostProductId?.id &&
        (isAdmin || isProducer) &&
        (company as any)?.producerId === user?.id && (
          <BoostProductDialog
            open={!!boostProductId}
            onOpenChange={(open) => {
              if (!open) setBoostProductId(null);
            }}
            productId={boostProductId?.id || ""}
          />
        )}
    </div>
  );
}
