import React, { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import type { Category } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import ProductCard from "@/components/ProductCard";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Share2,
  Package,
  Star,
  Users,
  TrendingUp,
  Heart,
  ShoppingCart,
  Search,
  Filter,
  Grid,
  List,
  ArrowLeft,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  GitCompare,
  Eye,
  Sparkles,
  Zap,
  Grid3X3,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Company = {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  logoUrl?: string;
  websiteUrl?: string;
  tin?: string;
  createdAt: string;
};

type Product = {
  id: string;
  name: string;
  nameRw: string;
  description: string;
  price: string;
  imageUrl: string;
  categoryId: string;
  categoryName?: string;
  inStock: boolean;
  sizes?: string[];
  colors?: string[];
};

type GroupedProducts = {
  [categoryName: string]: Product[];
};

export default function StorePage() {
  const { companyId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // State for smart filtering and search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("name");
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

  const { data: company, isLoading: companyLoading } = useQuery<Company>({
    queryKey: [`/api/companies/${companyId}`],
    enabled: !!companyId,
  });

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: [`/api/companies/${companyId}/products`],
    enabled: !!companyId,
  });

  // Fetch all categories with images
  const { data: allCategories = [], isLoading: categoriesLoading } = useQuery<
    Category[]
  >({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  // Smart filtering and sorting logic
  const filteredAndSortedProducts = useMemo(() => {
    if (!products) return [];

    let filtered = products.filter((product) => {
      // Search filter
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory =
        selectedCategory === "all" || product.categoryName === selectedCategory;

      // Price range filter
      const price = parseFloat(product.price);
      let matchesPrice = true;
      if (priceRange === "low") matchesPrice = price < 50000;
      else if (priceRange === "medium")
        matchesPrice = price >= 50000 && price < 200000;
      else if (priceRange === "high") matchesPrice = price >= 200000;

      return matchesSearch && matchesCategory && matchesPrice;
    });

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return parseFloat(a.price) - parseFloat(b.price);
        case "price-high":
          return parseFloat(b.price) - parseFloat(a.price);
        case "name":
          return a.name.localeCompare(b.name);
        case "newest":
          return a.name.localeCompare(b.name); // Fallback to name sorting since createdAt doesn't exist
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, searchQuery, selectedCategory, sortBy, priceRange]);

  // Get unique categories for filter dropdown
  const categories = useMemo(() => {
    if (!products) return [];
    return Array.from(
      new Set(
        products
          .map((p) => p.categoryName)
          .filter((cat): cat is string => Boolean(cat))
      )
    );
  }, [products]);

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
        {/* Enhanced Loading Skeleton for Hero with Animated Gradients */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 opacity-10 animate-pulse" />
          <div
            className="absolute inset-0 bg-gradient-to-l from-pink-500 via-red-500 to-yellow-500 opacity-5 animate-pulse"
            style={{ animationDelay: "1s" }}
          />
          <div className="px-3 md:px-6 py-16">
            <div className="text-center space-y-6">
              <div className="relative">
                <Skeleton className="w-24 h-24 rounded-full mx-auto" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-20 animate-ping" />
              </div>
              <Skeleton className="h-8 w-64 mx-auto" />
              <Skeleton className="h-4 w-96 mx-auto" />
              <div className="flex justify-center gap-4">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Loading Skeleton for Stats with Gradient Cards */}
        <div className="px-3 md:px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card
                key={i}
                className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-0 shadow-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg opacity-20 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Enhanced Loading Skeleton for Products with Shimmer Effect */}
        <div className="px-3 md:px-6 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card
                key={i}
                className="overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-0 shadow-lg"
              >
                <div className="relative">
                  <Skeleton className="w-full h-48" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </div>
                <div className="p-4 space-y-3">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </Card>
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
      const categoryName = product.categoryName || "Uncategorized";
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(product);
      return acc;
    },
    {} as GroupedProducts
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Enhanced Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 pt-8">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 via-transparent to-purple-500/30 animate-pulse" />
        <div
          className="absolute inset-0 bg-gradient-to-l from-pink-500/20 via-transparent to-yellow-500/20 animate-pulse"
          style={{ animationDelay: "2s" }}
        />
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full opacity-20 animate-float" />
          <div
            className="absolute top-20 right-20 w-24 h-24 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-20 animate-float"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute bottom-10 left-1/3 w-20 h-20 bg-gradient-to-r from-indigo-400 to-blue-400 rounded-full opacity-20 animate-float"
            style={{ animationDelay: "3s" }}
          />
        </div>
        <div className="px-3 md:px-6 py-16 pb-10 relative z-10">
          <div className="text-center text-white space-y-0">
            <div className="flex flex-col md:flex-row justify-center items-center space-x-3 ">
              <div className="relative group">
                {company.logoUrl ? (
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl transition-transform group-hover:scale-110">
                    <img
                      src={company.logoUrl}
                      alt={`${company.name} logo`}
                      className="min-h-full min-w-full h-auto w-auto rounded-full shadow-2xl transition-transform group-hover:scale-110 object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-white/20 to-white/10 border-4 border-white/20 flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110">
                    <Package className="w-10 h-10 text-white" />
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
              </div>
              <div className="flex flex-col md:flex-row items-center space-x-2">
                <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  {company.name}
                </h1>
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg animate-pulse">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              </div>
            </div>

            <div className="flex justify-center items-center space-x-6 text-white/90">
              <div className="flex items-center space-x-2 hover:text-white transition-colors">
                <MapPin className="w-4 h-4" />
                <span>{company.location}</span>
              </div>
              <div className="flex items-center space-x-2 hover:text-white transition-colors">
                <Phone className="w-4 h-4" />
                <span>{company.phone}</span>
              </div>
            </div>

            <div className="flex justify-center space-x-4 pt-4">
              <Button
                variant="secondary"
                className="bg-gradient-to-r from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 dark:text-white border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-105 shadow-lg"
                // onClick={handleShare}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Store
              </Button>
              {company.websiteUrl && (
                <Button
                  variant="secondary"
                  className="bg-gradient-to-r from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 dark:text-white border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-105 shadow-lg"
                  onClick={() =>
                    window.open(
                      company.websiteUrl,
                      "_blank",
                      "noopener,noreferrer"
                    )
                  }
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Visit Website
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mini Stats Section */}
      <div className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
        <div className="px-3 md:px-6 py-3">
          <div className="flex justify-center">
            <div className="flex items-center gap-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
              <div className="flex items-center gap-2 group hover:scale-105 transition-transform">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <Package className="w-4 h-4 text-white" />
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {(products || []).length}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
                    Products
                  </div>
                </div>
              </div>

              <div className="w-px h-8 bg-gray-200 dark:bg-gray-600" />

              <div className="flex items-center gap-2 group hover:scale-105 transition-transform">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Grid className="w-4 h-4 text-white" />
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {categories.length}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
                    Categories
                  </div>
                </div>
              </div>

              <div className="w-px h-8 bg-gray-200 dark:bg-gray-600" />

              <div className="flex items-center gap-2 group hover:scale-105 transition-transform">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {(products || []).filter((p) => p.inStock).length}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
                    Available
                  </div>
                </div>
              </div>

              <div className="w-px h-8 bg-gray-200 dark:bg-gray-600" />

              <div className="flex items-center gap-2 group hover:scale-105 transition-transform">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                  <Star className="w-4 h-4 text-white" />
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    4.8
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
                    Rating
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="container mx-auto px-3 md:px-0 bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/30 py-4">
        <div className="px-3 md:px-2">
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              Shop by Category
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Discover products from {company?.name || "this store"} across
              different categories
            </p>
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
            <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-4">
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
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    selectedCategory === "all"
                      ? "bg-white/20 backdrop-blur-sm"
                      : "bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30"
                  }`}
                >
                  <Grid3X3
                    className={`w-6 h-6 ${
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
                  (c) => c.name === category
                );
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`group flex flex-col items-center space-y-2 p-2 rounded-xl transition-all duration-300 hover:scale-105 ${
                      selectedCategory === category
                        ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                        : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 hover:shadow-lg"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full overflow-hidden transition-all duration-300 ${
                        selectedCategory === category
                          ? "ring-2 ring-white/30"
                          : "ring-1 ring-transparent group-hover:ring-blue-200 dark:group-hover:ring-blue-800"
                      }`}
                    >
                      {categoryData?.imageUrl ? (
                        <img
                          src={categoryData.imageUrl}
                          alt={category}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className={`w-full h-full flex items-center justify-center ${
                            selectedCategory === category
                              ? "bg-white/20 backdrop-blur-sm"
                              : "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600"
                          }`}
                        >
                          <Package
                            className={`w-6 h-6 ${
                              selectedCategory === category
                                ? "text-white"
                                : "text-gray-500 dark:text-gray-400"
                            }`}
                          />
                        </div>
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium text-center leading-tight ${
                        selectedCategory === category
                          ? "text-white"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {category.length > 8
                        ? category.substring(0, 8) + "..."
                        : category}
                    </span>
                    {selectedCategory === category && (
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Smart Search and Filter Section with Gradient Background */}
      <div className="container mx-auto px-3 md:px-0 bg-gradient-to-r from-white via-blue-50 to-purple-50 dark:from-gray-800 dark:via-blue-900/30 dark:to-purple-900/30 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-3 md:px-6 py-2">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
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
            {/* Enhanced Search with Gradient Border */}
            <div className="flex-1 max-w-md">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity" />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
                <Input
                  placeholder="Search products with AI..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/80 backdrop-blur-sm border-2 border-transparent hover:border-blue-200 focus:border-blue-400 transition-all duration-300"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="low">Under 50K</SelectItem>
                  <SelectItem value="medium">50K - 200K</SelectItem>
                  <SelectItem value="high">Over 200K</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name A-Z</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="newest">Featured</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
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
      </div>

      {/* Enhanced Products Section */}
      <div className="container mx-auto px-3 md:px-0 py-8">
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
                      nameRw: product.nameRw,
                      description: product.description,
                      price: product.price,
                      imageUrl: product.imageUrl,
                      categoryId: product.categoryId,
                      sizes: product.sizes || null,
                      colors: product.colors || null,
                      inStock: product.inStock,
                      createdAt: null,
                      producerId: null,
                      additionalImages: null,
                      stockQuantity: null,
                      isApproved: null,
                    }}
                    isFavorited={wishlist.has(product.id)}
                    onToggleFavorite={toggleWishlist}
                    onViewDetails={(productId: string) => {
                      setLocation(`/product/${productId}`);
                    }}
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
                      nameRw: product.nameRw,
                      description: product.description,
                      price: product.price,
                      imageUrl: product.imageUrl,
                      categoryId: product.categoryId,
                      sizes: product.sizes || null,
                      colors: product.colors || null,
                      inStock: product.inStock,
                      createdAt: null,
                      producerId: null,
                      additionalImages: null,
                      stockQuantity: null,
                      isApproved: null,
                    }}
                    isFavorited={wishlist.has(product.id)}
                    onToggleFavorite={toggleWishlist}
                    onViewDetails={(productId: string) => {
                      setLocation(`/product/${productId}`);
                    }}
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">
                  {selectedProduct.name}
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                      <Badge variant="outline">
                        {selectedProduct.categoryName}
                      </Badge>
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
                    {parseFloat(selectedProduct.price).toLocaleString()} RWF
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

                  <div className="flex gap-3 pt-4">
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
                      {wishlist.has(selectedProduct.id)
                        ? "Remove from Wishlist"
                        : "Add to Wishlist"}
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
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <GitCompare className="w-5 h-5" />
              <span>
                Product Comparison ({getCompareProducts().length} items)
              </span>
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
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <tbody className="space-y-4">
                    {/* Product Names */}
                    <tr className="border-b">
                      <td className="font-semibold text-gray-600 p-3 w-32">
                        Product Name
                      </td>
                      {getCompareProducts().map((product) => (
                        <td key={product.id} className="p-3 text-center">
                          <div className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {product.name}
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Prices */}
                    <tr className="border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                      <td className="font-semibold text-gray-600 p-3">Price</td>
                      {getCompareProducts().map((product) => (
                        <td key={product.id} className="p-3 text-center">
                          <div className="text-xl font-bold text-green-600">
                            {parseFloat(product.price).toLocaleString()} RWF
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Stock Status */}
                    <tr className="border-b">
                      <td className="font-semibold text-gray-600 p-3">
                        Availability
                      </td>
                      {getCompareProducts().map((product) => (
                        <td key={product.id} className="p-3 text-center">
                          <Badge
                            className={
                              product.inStock ? "bg-green-500" : "bg-red-500"
                            }
                          >
                            {product.inStock ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                In Stock
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 mr-1" />
                                Out of Stock
                              </>
                            )}
                          </Badge>
                        </td>
                      ))}
                    </tr>

                    {/* Categories */}
                    <tr className="border-b bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                      <td className="font-semibold text-gray-600 p-3">
                        Category
                      </td>
                      {getCompareProducts().map((product) => (
                        <td key={product.id} className="p-3 text-center">
                          <Badge variant="outline" className="bg-white/80">
                            {product.categoryName}
                          </Badge>
                        </td>
                      ))}
                    </tr>

                    {/* Sizes */}
                    <tr className="border-b">
                      <td className="font-semibold text-gray-600 p-3">Sizes</td>
                      {getCompareProducts().map((product) => (
                        <td key={product.id} className="p-3 text-center">
                          <div className="flex flex-wrap gap-1 justify-center">
                            {product.sizes && product.sizes.length > 0 ? (
                              product.sizes.slice(0, 3).map((size, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {size}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-gray-400 text-sm">N/A</span>
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Colors */}
                    <tr className="border-b bg-gradient-to-r from-pink-50 to-red-50 dark:from-pink-900/20 dark:to-red-900/20">
                      <td className="font-semibold text-gray-600 p-3">
                        Colors
                      </td>
                      {getCompareProducts().map((product) => (
                        <td key={product.id} className="p-3 text-center">
                          <div className="flex flex-wrap gap-1 justify-center">
                            {product.colors && product.colors.length > 0 ? (
                              product.colors.slice(0, 3).map((color, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {color}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-gray-400 text-sm">N/A</span>
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Actions */}
                    <tr>
                      <td className="font-semibold text-gray-600 p-3">
                        Actions
                      </td>
                      {getCompareProducts().map((product) => (
                        <td key={product.id} className="p-3 text-center">
                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                              onClick={() => {
                                openQuickView(product);
                                setIsCompareModalOpen(false);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Details
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className={`${
                                wishlist.has(product.id)
                                  ? "bg-red-50 border-red-200 text-red-600"
                                  : ""
                              }`}
                              onClick={() => toggleWishlist(product.id)}
                            >
                              <Heart
                                className={`w-4 h-4 mr-1 ${
                                  wishlist.has(product.id) ? "fill-current" : ""
                                }`}
                              />
                              {wishlist.has(product.id) ? "Remove" : "Wishlist"}
                            </Button>
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <Button variant="outline" onClick={clearCompareList}>
                  Clear All
                </Button>
                <div className="text-sm text-gray-500">
                  Compare up to 4 products • {4 - compareList.size} slots
                  remaining
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
    </div>
  );
}
