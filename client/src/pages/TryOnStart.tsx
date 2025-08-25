import { useState, useCallback, useRef, useEffect, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Search,
  X,
  Sparkles,
  Filter,
  ChevronDown,
  Eye,
  Brain,
} from "lucide-react";
import { Input } from "../components/ui/input";
import { Skeleton } from "../components/ui/skeleton";
import { useInfiniteProducts } from "../hooks/useInfiniteProducts";
import TryOnWidget from "../components/TryOnWidget";

// Type definitions
interface Category {
  id: string | number;
  name: string;
  imageUrl?: string;
}

interface Company {
  id: string | number;
  name: string;
  logoUrl?: string;
  productCount?: number;
}

interface Product {
  id: string | number;
  name: string;
  imageUrl?: string;
  price?: number;
  description?: string;
  categoryId?: string | number;
  companyId?: string | number;
  category?: Category;
  company?: Company;
}

// Add CSS for animated gradients, custom scrollbar, and dark theme support
const styles = `
  @keyframes gradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(59, 130, 246, 0.1);
    border-radius: 3px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
    border-radius: 3px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(to bottom, #2563eb, #7c3aed);
  }
  
  /* Dark theme scrollbar */
  .dark .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(99, 102, 241, 0.2);
  }
  
  .dark .custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(to bottom, #6366f1, #a855f7);
  }
`;

// Inject styles
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default function TryOnStart() {
  const [selectedProductId, setSelectedProductId] = useState<{
    id: string;
    imageUrl: string;
  } | null>(null);
  const [categoryId, setCategoryId] = useState<string>("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [searchInput, setSearchInput] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [currentStep, setCurrentStep] = useState<"categories" | "products">(
    "categories"
  );
  const [showCompanyFilter, setShowCompanyFilter] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(20); // For handling many companies
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [debouncedCategorySearch, setDebouncedCategorySearch] = useState("");
  const [debouncedCompanySearch, setDebouncedCompanySearch] = useState("");

  // Debounced search effects
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedCategorySearch(categorySearch),
      300
    );
    return () => clearTimeout(timer);
  }, [categorySearch]);

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedCompanySearch(companySearch),
      300
    );
    return () => clearTimeout(timer);
  }, [companySearch]);

  // Products query (load all, filter client-side)
  const {
    data: allProducts,
    isLoading: productsLoading,
    error: productsError,
  } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch(`/api/products?limit=1000`); // Load more products initially
      if (!res.ok) throw new Error("Failed to load products");
      return res.json();
    },
  });
  const products = allProducts || [];

  // Auto-select category and move to products
  const handleCategorySelect = useCallback((categoryIdValue: string) => {
    setCategoryId(categoryIdValue);
    setCurrentStep("products");
  }, []);

  // Categories query (load all, filter client-side)
  const {
    data: allCategories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch(`/api/categories`);
      if (!res.ok) throw new Error("Failed to load categories");
      return res.json();
    },
  });

  // Companies (load all, filter client-side)
  const {
    data: companies,
    isLoading: companiesLoading,
    error: companiesError,
  } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const res = await fetch(`/api/companies`);
      if (!res.ok) throw new Error("Failed to load companies");
      return res.json();
    },
  });

  // Filtered data with performance optimization
  const categories = allCategories || [];
  const filteredCategories = useMemo(() => {
    if (!categorySearch) return categories;
    return categories.filter((category: Category) =>
      category.name.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categories, categorySearch]);

  const filteredCompanies = useMemo(() => {
    if (!companySearch) return companies || [];
    return (companies || []).filter((company: Company) =>
      company.name.toLowerCase().includes(companySearch.toLowerCase())
    );
  }, [companies, companySearch]);

  // Display variables for categories and companies
  const displayCategories = useMemo(() => {
    return filteredCategories;
  }, [filteredCategories]);

  const displayCompanies = useMemo(() => {
    return filteredCompanies.slice(0, displayLimit);
  }, [filteredCompanies, displayLimit]);

  const hasMoreCompanies = useMemo(() => {
    return filteredCompanies.length > displayLimit;
  }, [filteredCompanies, displayLimit]);

  // Optimized product filtering with memoization (client-side only)
  const filteredProducts = useMemo(() => {
    return products.filter((product: Product) => {
      // Filter by selected category
      if (categoryId && categoryId !== "all") {
        const productCategoryId = product.categoryId || product.category?.id;
        if (String(productCategoryId) !== categoryId) {
          return false;
        }
      }

      // Filter by search input (client-side from loaded products)
      if (
        debouncedSearch &&
        !product.name.toLowerCase().includes(debouncedSearch.toLowerCase()) &&
        !product.description
          ?.toLowerCase()
          .includes(debouncedSearch.toLowerCase()) &&
        !product.company?.name
          ?.toLowerCase()
          .includes(debouncedSearch.toLowerCase())
      ) {
        return false;
      }

      // Filter by selected company (check both companyId and company.id)
      if (selectedCompanyId) {
        const productCompanyId = product.companyId || product.company?.id;
        if (String(productCompanyId) !== selectedCompanyId) {
          return false;
        }
      }

      return true;
    });
  }, [products, categoryId, debouncedSearch, selectedCompanyId]);

  // Load more companies handler
  const loadMoreCompanies = useCallback(() => {
    setDisplayLimit((prev) => prev + 20);
  }, []);

  // Show loading skeleton if any data is still loading
  if (productsLoading || categoriesLoading || companiesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-950 dark:via-gray-950 dark:to-black relative overflow-hidden pt-10">
        <style>{styles}</style>
        <div className="container mx-auto px-3 md:px-0">
          {/* AI-Motivated Animated Background */}
          <div className="fixed inset-0 pointer-events-none">
            <div className="absolute top-10 left-10 w-40 h-40 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" />
            <div
              className="absolute bottom-10 right-10 w-56 h-56 bg-gradient-to-r from-cyan-400/20 via-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-bounce"
              style={{ animationDuration: "3s" }}
            />
          </div>

          <main className="relative z-10 pt-10 sm:pt-12">
            {/* Compact Hero Header for Categories */}
            <div className="text-center mb-4 sm:mb-6">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-2">
                ✨ AI Try-On
              </div>
              <div className="text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-md mx-auto px-4">
                🚀 Smart fashion discovery powered by AI
              </div>
            </div>

            {/* Category Search Skeleton */}
            <div className="mb-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl blur-xl opacity-50" />
                <div className="relative bg-white/90 dark:bg-violet-800/10 backdrop-blur-sm rounded-2xl border border-blue-200/30 shadow-xl shadow-blue-500/10">
                  <Skeleton className="h-12 w-full rounded-2xl" />
                </div>
              </div>
            </div>

            {/* Categories Grid Skeleton - Matching actual layout */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 p-2">
              {[...Array(16)].map((_, index) => (
                <div
                  key={index}
                  className="group relative p-3 rounded-2xl bg-gradient-to-br from-white/90 dark:from-black/50 to-blue-50/50 dark:to-black/50 border border-blue-200/30 dark:border-none backdrop-blur-sm overflow-hidden"
                >
                  {/* AI Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-purple-400/10 to-pink-400/10 animate-pulse rounded-2xl" />

                  {/* Neural Network Pattern */}
                  <div className="absolute top-1 right-1 w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-30 animate-pulse" />
                  <div
                    className="absolute bottom-1 left-1 w-1 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-20 animate-pulse"
                    style={{ animationDelay: "0.5s" }}
                  />

                  <div className="relative z-10">
                    {/* Category Image Skeleton */}
                    <div className="w-16 h-16 mx-auto mb-2 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-blue-50 dark:from-gray-700 dark:to-gray-600 shadow-lg animate-pulse">
                      <div className="w-full h-full flex items-center justify-center">
                        <Sparkles
                          className="h-5 w-5 text-blue-400 animate-spin"
                          style={{ animationDuration: "2s" }}
                        />
                      </div>
                    </div>

                    {/* Category Name Skeleton */}
                    <div className="h-4 bg-gradient-to-r from-gray-200 to-blue-100 dark:from-gray-600 dark:to-gray-500 rounded-lg animate-pulse mb-1" />

                    {/* AI Ready Badge Skeleton */}
                    <div className="mt-1 flex justify-center">
                      <div className="px-2 py-0.5 bg-gradient-to-r from-blue-100/50 to-purple-100/50 dark:from-blue-800/50 dark:to-purple-800/50 rounded-full animate-pulse">
                        <div className="h-3 w-12 bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-600 dark:to-purple-600 rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-950 dark:via-gray-950 dark:to-black relative overflow-hidden pt-10">
      <style>{styles}</style>
      <div className="container mx-auto px-3 md:px-0">
        {/* AI-Motivated Animated Background */}
        <div className="fixed inset-0 pointer-events-none">
          {/* Neural network inspired animated gradients */}
          <div className="absolute top-10 left-10 w-40 h-40 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-10 right-10 w-56 h-56 bg-gradient-to-r from-cyan-400/20 via-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-bounce"
            style={{ animationDuration: "3s" }}
          />
          <div
            className="absolute top-1/3 right-1/4 w-32 h-32 bg-gradient-to-r from-green-400/15 via-teal-400/15 to-blue-400/15 rounded-full blur-2xl animate-ping"
            style={{ animationDuration: "4s" }}
          />
          <div
            className="absolute bottom-1/3 left-1/4 w-28 h-28 bg-gradient-to-r from-purple-400/15 via-pink-400/15 to-rose-400/15 rounded-full blur-2xl animate-pulse"
            style={{ animationDuration: "2s" }}
          />

          {/* AI Circuit patterns */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-20 left-1/4 w-px h-32 bg-gradient-to-b from-blue-500 to-transparent animate-pulse" />
            <div
              className="absolute top-40 left-1/3 w-24 h-px bg-gradient-to-r from-purple-500 to-transparent animate-pulse"
              style={{ animationDelay: "1s" }}
            />
            <div
              className="absolute bottom-32 right-1/3 w-px h-24 bg-gradient-to-t from-cyan-500 to-transparent animate-pulse"
              style={{ animationDelay: "2s" }}
            />
          </div>
        </div>

        <main className="relative z-10 pt-10 sm:pt-12">
          {currentStep === "categories" ? (
            /* Compact Hero Header for Categories */
            <motion.div
              className="text-center mb-4 sm:mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <motion.h1
                className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-2"
                whileHover={{ scale: 1.02 }}
              >
                ✨ AI Try-On
              </motion.h1>
              <motion.p
                className="text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-md mx-auto px-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                🚀 Smart fashion discovery powered by AI
              </motion.p>
            </motion.div>
          ) : (
            /* Innovative AI-Powered Header with Neural Network Animations */
            <motion.div
              className="relative mb-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Neural Network Background Pattern */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                <div
                  className="absolute top-2 left-1/4 w-1 h-1 bg-blue-400 rounded-full animate-ping opacity-60"
                  style={{ animationDelay: "0s" }}
                />
                <div
                  className="absolute top-4 right-1/3 w-1 h-1 bg-purple-400 rounded-full animate-ping opacity-60"
                  style={{ animationDelay: "1s" }}
                />
                <div
                  className="absolute bottom-3 left-1/3 w-1 h-1 bg-pink-400 rounded-full animate-ping opacity-60"
                  style={{ animationDelay: "2s" }}
                />

                {/* Connecting Lines */}
                <svg
                  className="absolute inset-0 w-full h-full opacity-20"
                  viewBox="0 0 400 100"
                >
                  <motion.path
                    d="M50,20 Q200,10 350,30"
                    stroke="url(#gradient1)"
                    strokeWidth="1"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse",
                    }}
                  />
                  <motion.path
                    d="M100,80 Q200,60 300,70"
                    stroke="url(#gradient2)"
                    strokeWidth="1"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      repeatType: "reverse",
                      delay: 0.5,
                    }}
                  />
                  <defs>
                    <linearGradient
                      id="gradient1"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient>
                    <linearGradient
                      id="gradient2"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* Main Header Container */}
              <motion.div
                className="relative bg-gradient-to-r from-white/95 via-blue-50/90 to-purple-50/95 dark:from-gray-800/95 dark:via-indigo-900/90 dark:to-purple-900/95 backdrop-blur-xl rounded-2xl border border-blue-200/30 dark:border-indigo-500/30 shadow-2xl shadow-blue-500/20 dark:shadow-indigo-500/20 p-3 sm:p-4"
                whileHover={{ scale: 1.01, y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flex items-center justify-between">
                  {/* Interactive Back Button with AI Glow */}
                  <motion.button
                    onClick={() => setCurrentStep("categories")}
                    className="group relative bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 dark:from-indigo-500/20 dark:to-purple-500/20 dark:hover:from-indigo-500/30 dark:hover:to-purple-500/30 text-xs sm:text-sm flex items-center gap-1 sm:gap-2 text-gray-700 hover:text-blue-700 dark:text-gray-300 dark:hover:text-blue-400 px-2 sm:px-4 py-2 rounded-xl border border-blue-200/50 hover:border-blue-400/60 dark:border-indigo-400/50 dark:hover:border-indigo-400/70 transition-all duration-300 overflow-hidden"
                    whileHover={{ x: -5, scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/20 to-blue-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 relative z-10" />
                    <span className="font-medium hidden sm:inline relative z-10">
                      Back
                    </span>
                    <span className="font-medium sm:hidden relative z-10">
                      Back
                    </span>
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse opacity-60" />
                  </motion.button>

                  {/* Dynamic AI Title with Category Context */}
                  <motion.div
                    className="flex-1 text-center relative min-w-0"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="relative inline-block">
                      {/* AI Brain Icon with Pulsing Effect */}
                      <motion.div
                        className="absolute -top-1 sm:-top-2 -left-6 sm:-left-8 w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-400 dark:to-purple-400 rounded-full opacity-80"
                        animate={{
                          scale: [1, 1.2, 1],
                          rotate: [0, 180, 360],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <div className="w-full h-full bg-white/30 dark:bg-gray-800/30 rounded-full animate-ping" />
                      </motion.div>

                      <motion.h1
                        className="text-sm sm:text-lg md:text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent relative truncate"
                        animate={{
                          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        🧠 AI Try-On Engine
                      </motion.h1>

                      {/* Category-specific subtitle */}
                      {allCategories?.find(
                        (c: Category) => String(c.id) === categoryId
                      ) && (
                        <motion.p
                          className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium px-2 sm:px-0"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <span className="hidden sm:inline">
                            Neural Fashion Analysis •{" "}
                          </span>
                          {
                            allCategories.find(
                              (c: Category) => String(c.id) === categoryId
                            )?.name
                          }{" "}
                          <span className="hidden sm:inline">Specialist</span>
                          <span className="sm:hidden">AI Ready</span>
                        </motion.p>
                      )}
                    </div>
                  </motion.div>

                  {/* Enhanced Category Chip with AI Processing Indicator */}
                  {allCategories?.find(
                    (c: Category) => String(c.id) === categoryId
                  ) && (
                    <motion.div
                      className="group relative bg-gradient-to-r from-blue-50/80 to-purple-50/80 hover:from-blue-100/90 hover:to-purple-100/90 dark:from-indigo-900/40 dark:to-purple-900/40 dark:hover:from-indigo-800/50 dark:hover:to-purple-800/50 px-2 sm:px-4 py-2 rounded-xl border border-blue-200/50 hover:border-blue-400/70 dark:border-indigo-400/30 dark:hover:border-indigo-400/50 shadow-lg hover:shadow-xl shadow-blue-500/10 hover:shadow-blue-500/20 dark:shadow-indigo-500/10 dark:hover:shadow-indigo-500/20 transition-all duration-300 cursor-pointer overflow-hidden"
                      initial={{ opacity: 0, scale: 0.9, x: 20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Processing Animation Background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/10 to-purple-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                      <div className="flex items-center gap-2 sm:gap-3 relative z-10">
                        {/* Enhanced Category Image with AI Border */}
                        <div className="relative">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 shadow-lg border-2 border-blue-200/50 group-hover:border-blue-400/70 dark:border-indigo-400/30 dark:group-hover:border-indigo-400/50 transition-colors">
                            {allCategories.find(
                              (c: Category) => String(c.id) === categoryId
                            )?.imageUrl ? (
                              <img
                                src={
                                  allCategories.find(
                                    (c: Category) => String(c.id) === categoryId
                                  )?.imageUrl!
                                }
                                alt="Category"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-pink-400/20 dark:from-blue-500/30 dark:via-purple-500/30 dark:to-pink-500/30 flex items-center justify-center">
                                <Sparkles
                                  className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400 animate-spin"
                                  style={{ animationDuration: "2s" }}
                                />
                              </div>
                            )}
                          </div>

                          {/* AI Processing Indicator */}
                          <motion.div
                            className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-400 rounded-full shadow-lg"
                            animate={{
                              scale: [1, 1.3, 1],
                              opacity: [0.7, 1, 0.7],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                          >
                            <div className="w-full h-full bg-white/30 dark:bg-gray-800/30 rounded-full animate-ping" />
                          </motion.div>
                        </div>

                        {/* Category Info with AI Context */}
                        <div className="hidden sm:block">
                          <h2 className="font-semibold text-sm bg-gradient-to-r from-blue-700 to-purple-700 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                            {
                              allCategories.find(
                                (c: Category) => String(c.id) === categoryId
                              )?.name
                            }
                          </h2>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="w-1 h-1 bg-blue-400 dark:bg-blue-500 rounded-full animate-pulse" />
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                              AI Ready • {filteredProducts.length} items
                              analyzed
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}

          {currentStep === "categories" ? (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className=""
            >
              {/* AI-Enhanced Category Selection */}
              <div className="mb-3">
                {/* Enhanced Category Search with AI styling */}
                <div className="mb-3">
                  <motion.div
                    className="relative"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl blur-xl opacity-50" />
                    <div className="relative bg-white/90 dark:bg-violet-800/10 dark:text-white backdrop-blur-sm rounded-xl border border-blue-200/30">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500" />
                      <Input
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        placeholder="Discover categories with AI..."
                        className="pl-12 pr-10 py-3 bg-transparent border-0 text-gray-800 dark:text-white placeholder:text-gray-500 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                      />
                      {categorySearch && (
                        <motion.button
                          onClick={() => setCategorySearch("")}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-blue-100 hover:bg-blue-200 rounded-full flex items-center justify-center text-blue-600 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <X className="h-3 w-3" />
                        </motion.button>
                      )}
                    </div>
                  </motion.div>

                  {/* Search Results Info */}
                  {categorySearch && (
                    <motion.div
                      className="text-center mt-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <p className="text-sm text-gray-600">
                        {filteredCategories.length > 0
                          ? `Found ${filteredCategories.length} categories matching "${categorySearch}"`
                          : `No categories found for "${categorySearch}"`}
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* AI-Enhanced Category Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 p-2">
                  {categoriesLoading ? (
                    // AI-Inspired Loading Skeleton for Categories
                    Array.from({ length: 8 }).map((_, index) => (
                      <motion.div
                        key={`category-skeleton-${index}`}
                        className="group relative p-3 rounded-2xl bg-gradient-to-br from-white/90 to-blue-50/50 border border-blue-200/30 backdrop-blur-sm overflow-hidden"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        {/* AI Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-purple-400/10 to-pink-400/10 animate-pulse rounded-2xl" />

                        {/* Neural Network Pattern */}
                        <div className="absolute top-1 right-1 w-2 h-2 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full animate-pulse" />

                        <div className="relative z-10">
                          {/* Image Skeleton */}
                          <div className="w-16 h-16 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-gray-200 to-blue-100 animate-pulse shadow-lg">
                            <div className="w-full h-full flex items-center justify-center">
                              <Sparkles
                                className="h-5 w-5 text-blue-400 animate-spin"
                                style={{ animationDuration: "2s" }}
                              />
                            </div>
                          </div>

                          {/* Title Skeleton */}
                          <div className="h-4 bg-gradient-to-r from-gray-200 to-blue-100 rounded-lg animate-pulse mb-1" />

                          {/* AI Indicator Skeleton */}
                          <div className="mt-1 flex justify-center">
                            <div className="px-2 py-0.5 bg-gradient-to-r from-blue-100/50 to-purple-100/50 rounded-full animate-pulse">
                              <div className="h-3 w-12 bg-gradient-to-r from-blue-200 to-purple-200 rounded" />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : categoriesError ? (
                    // Error State
                    <motion.div
                      className="col-span-full text-center py-12"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
                        <X className="h-8 w-8 text-red-500" />
                      </div>
                      <h3 className="text-gray-700 font-semibold text-lg mb-2">
                        Failed to load categories
                      </h3>
                      <p className="text-gray-500 text-sm mb-4">
                        Please check your connection and try again
                      </p>
                      <motion.button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg shadow-blue-500/25"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Retry
                      </motion.button>
                    </motion.div>
                  ) : (
                    displayCategories.map((c: Category, index: number) => {
                      return (
                        <motion.button
                          key={c.id}
                          onClick={() => handleCategorySelect(String(c.id))}
                          className="group relative p-3 rounded-2xl bg-gradient-to-br from-white/90 dark:from-blue-900/50 to-white dark:to-violet-900/50 dark:text-white border border-blue-200/30 dark:border-none hover:border-blue-400/60 hover:shadow-2xl hover:shadow-blue-500/20 hover:from-blue-50/80 hover:to-purple-50/60 transition-all duration-500 backdrop-blur-sm overflow-hidden"
                          whileHover={{ scale: 1.08, y: -8, rotateY: 5 }}
                          whileTap={{ scale: 0.95 }}
                          initial={{ opacity: 0, y: 20, rotateX: -10 }}
                          animate={{ opacity: 1, y: 0, rotateX: 0 }}
                          transition={{
                            delay: index * 0.05,
                            type: "spring",
                            stiffness: 200,
                            damping: 20,
                          }}
                        >
                          {/* AI Glow Effect */}
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 via-purple-400/0 to-pink-400/0 group-hover:from-blue-400/10 group-hover:via-purple-400/10 group-hover:to-pink-400/10 transition-all duration-500 rounded-2xl" />

                          {/* Neural Network Pattern */}
                          <div className="absolute top-1 right-1 w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-30 group-hover:opacity-60 animate-pulse" />
                          <div
                            className="absolute bottom-1 left-1 w-1 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-20 group-hover:opacity-40 animate-pulse"
                            style={{ animationDelay: "0.5s" }}
                          />

                          <div className="relative z-10">
                            <div className="w-16 h-16 mx-auto mb-2 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-blue-50 shadow-lg group-hover:shadow-xl transition-all duration-300">
                              {c.imageUrl ? (
                                <img
                                  src={c.imageUrl}
                                  alt={c.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-pink-400/20 flex items-center justify-center group-hover:from-blue-400/30 group-hover:via-purple-400/30 group-hover:to-pink-400/30 transition-all duration-300">
                                  <Sparkles className="h-5 w-5 text-blue-600 group-hover:text-purple-600 animate-pulse group-hover:animate-spin transition-all duration-300" />
                                </div>
                              )}
                            </div>
                            <h3 className="font-semibold text-sm text-gray-800 dark:text-white group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300 text-center leading-tight">
                              {c.name}
                            </h3>

                            {/* AI Indicator */}
                            <div className="mt-1 flex justify-center">
                              <div className="px-2 py-0.5 bg-gradient-to-r from-blue-100/50 to-purple-100/50 group-hover:from-blue-200/70 group-hover:to-purple-200/70 rounded-full transition-all duration-300">
                                <span className="text-xs font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                  AI Ready ✨
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })
                  )}
                </div>

                {/* No Categories Found State */}
                {categorySearch && filteredCategories.length === 0 && (
                  <motion.div
                    className="text-center py-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                      <Search className="h-10 w-10 text-blue-500" />
                    </div>
                    <h3 className="text-gray-700 font-semibold text-lg mb-2">
                      No categories found
                    </h3>
                    <p className="text-gray-500 text-sm mb-4">
                      Try a different search term or browse all categories
                    </p>
                    <motion.button
                      onClick={() => setCategorySearch("")}
                      className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg shadow-blue-500/25"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Show all categories
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className=""
            >
              {/* Smart Search and Company Filter */}
              <div className="mb-3">
                {/* Compact AI Brand Filter */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mb-3"
                >
                  {/* Compact Brand Filter Toggle */}
                  <motion.button
                    onClick={() => setShowCompanyFilter(!showCompanyFilter)}
                    className="group relative flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500/8 to-purple-500/8 hover:from-blue-500/15 hover:to-purple-500/15 border border-blue-200/40 hover:border-blue-300/60 rounded-lg transition-all duration-300 overflow-hidden"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* AI Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/5 to-purple-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />

                    {/* AI Icon */}
                    <div className="relative w-5 h-5 rounded-md bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-sm">
                      <Filter className="h-2.5 w-2.5 text-white" />
                      <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    </div>

                    {/* Compact Text */}
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="font-medium text-xs bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
                        Brands
                      </span>
                      <div className="w-px h-3 bg-gradient-to-b from-blue-300 to-purple-300 opacity-50" />
                      <span className="text-xs text-gray-500 truncate">
                        {selectedCompanyId
                          ? displayCompanies.find(
                              (c: Company) => String(c.id) === selectedCompanyId
                            )?.name || "Selected"
                          : `${displayCompanies.length} available`}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {selectedCompanyId && (
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCompanyId("");
                          }}
                          className="w-4 h-4 bg-blue-500/20 hover:bg-blue-500/30 text-blue-600 rounded text-xs flex items-center justify-center transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          ×
                        </motion.button>
                      )}
                      <ChevronDown
                        className={`h-3 w-3 text-blue-500 transition-transform duration-300 ${
                          showCompanyFilter ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </motion.button>

                  {/* Collapsible Brand Filter Content */}
                  <AnimatePresence>
                    {showCompanyFilter && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 p-3 bg-gradient-to-br from-white/80 dark:from-gray-900/50 dark:border-none to-blue-50/30 backdrop-blur-sm rounded-xl border border-blue-200/30">
                          {/* Brand Search - Moved to Bottom */}
                          <div className="mb-3 pb-3 border-b border-blue-200/30 dark:border-gray-800/80">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
                              <Input
                                value={companySearch}
                                onChange={(e) =>
                                  setCompanySearch(e.target.value)
                                }
                                placeholder="Search brands..."
                                className="pl-10 pr-8 py-2 bg-white/80 dark:bg-gray-800/50 border dark:border-none border-blue-200/50 text-gray-800 dark:text-white placeholder:text-gray-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400/50 transition-all duration-200"
                              />
                              {companySearch && (
                                <button
                                  onClick={() => setCompanySearch("")}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                            {debouncedCompanySearch &&
                              filteredCompanies.length === 0 && (
                                <p className="text-xs text-gray-500 mt-2 text-center">
                                  No brands found matching "
                                  {debouncedCompanySearch}"
                                </p>
                              )}
                          </div>

                          {/* Enhanced Brand Grid with Clear Images */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 overflow-y-auto custom-scrollbar p-2">
                            {/* All Brands Option as First Item */}
                            <motion.button
                              onClick={() => {
                                setSelectedCompanyId("");
                                setShowCompanyFilter(false);
                              }}
                              className={`group p-3 rounded-xl transition-all duration-300 relative ${
                                !selectedCompanyId
                                  ? "bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-xl shadow-blue-500/30"
                                  : "bg-white/90 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 border border-gray-200/50 hover:border-blue-400/60 hover:shadow-lg hover:shadow-blue-500/10"
                              } overflow-hidden`}
                              whileHover={{ scale: 1.02, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                            >
                              {/* All Brands Logo */}
                              <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 shadow-lg overflow-hidden flex items-center justify-center">
                                <Sparkles
                                  className={`h-6 w-6 ${
                                    !selectedCompanyId
                                      ? "text-white"
                                      : "text-blue-500"
                                  } animate-pulse`}
                                />
                              </div>

                              {/* All Brands Name */}
                              <h4
                                className={`font-semibold text-xs mb-1 text-center ${
                                  !selectedCompanyId
                                    ? "text-white"
                                    : "text-gray-800 group-hover:text-blue-700"
                                }`}
                              >
                                All Brands
                              </h4>

                              {/* Product Count */}
                              <div
                                className={`text-xs px-1 py-0.5 rounded-full text-center ${
                                  !selectedCompanyId
                                    ? "bg-white/20 text-white"
                                    : "bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-700"
                                }`}
                              >
                                {displayCompanies.length} brands
                              </div>

                              {/* AI Ready Badge */}
                              <div className="absolute top-1 right-1 w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                                <Sparkles className="h-2 w-2 text-white" />
                              </div>
                            </motion.button>

                            {companiesLoading ? (
                              // AI-Inspired Loading Skeleton for Companies
                              Array.from({ length: 5 }).map((_, index) => (
                                <motion.div
                                  key={`company-skeleton-${index}`}
                                  className="group p-3 rounded-xl bg-white/90 border border-gray-200/50 backdrop-blur-sm overflow-hidden"
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                >
                                  {/* Brand Logo Skeleton */}
                                  <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-gray-200 to-blue-100 animate-pulse shadow-lg">
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Sparkles
                                        className="h-4 w-4 text-blue-400 animate-spin"
                                        style={{ animationDuration: "2s" }}
                                      />
                                    </div>
                                  </div>

                                  {/* Brand Name Skeleton */}
                                  <div className="h-3 bg-gradient-to-r from-gray-200 to-blue-100 rounded-lg animate-pulse mb-1" />

                                  {/* Product Count Skeleton */}
                                  <div className="h-2 w-16 mx-auto bg-gradient-to-r from-gray-100 to-blue-50 rounded-full animate-pulse" />
                                </motion.div>
                              ))
                            ) : companiesError ? (
                              // Error State for Companies
                              <motion.div
                                className="col-span-full text-center py-8"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                              >
                                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
                                  <X className="h-6 w-6 text-red-500" />
                                </div>
                                <h4 className="text-gray-700 font-semibold text-sm mb-1">
                                  Failed to load brands
                                </h4>
                                <p className="text-gray-500 text-xs">
                                  Please try again
                                </p>
                              </motion.div>
                            ) : (
                              displayCompanies.map(
                                (company: Company, index: number) => (
                                  <motion.button
                                    key={company.id}
                                    onClick={() => {
                                      setSelectedCompanyId(String(company.id));
                                      setShowCompanyFilter(false);
                                    }}
                                    className={`group p-3 rounded-xl transition-all duration-300 relative ${
                                      selectedCompanyId === String(company.id)
                                        ? "bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-xl shadow-blue-500/30"
                                        : "bg-white/90 dark:bg-gray-700/60 dark:border-none dark:text-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 border border-gray-200/50 hover:border-blue-400/60 hover:shadow-lg hover:shadow-blue-500/10"
                                    }`}
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                  >
                                    {/* Company Logo */}
                                    <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 shadow-lg overflow-hidden">
                                      {company.logoUrl ? (
                                        <img
                                          src={company.logoUrl}
                                          alt={company.name}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-white font-bold text-sm">
                                          {company.name?.charAt(0) || "?"}
                                        </div>
                                      )}
                                    </div>

                                    {/* Company Name */}
                                    <h4
                                      className={`font-semibold text-xs mb-1 text-center dark:text-white ${
                                        selectedCompanyId === String(company.id)
                                          ? "text-white"
                                          : "text-gray-800 group-hover:text-blue-700"
                                      }`}
                                    >
                                      {company.name}
                                    </h4>

                                    {/* Product Count */}
                                    {company.productCount && (
                                      <div
                                        className={`text-xs px-1 py-0.5 rounded-full text-center ${
                                          selectedCompanyId ===
                                          String(company.id)
                                            ? "bg-white/20 text-white"
                                            : "bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-700"
                                        }`}
                                      >
                                        {company.productCount} products
                                      </div>
                                    )}

                                    {/* Selection Indicator */}
                                    {selectedCompanyId ===
                                      String(company.id) && (
                                      <motion.div
                                        className="absolute top-2 right-2 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{
                                          type: "spring",
                                          stiffness: 300,
                                        }}
                                      >
                                        <div className="w-3 h-3 bg-white rounded-full" />
                                      </motion.div>
                                    )}
                                  </motion.button>
                                )
                              )
                            )}
                          </div>

                          {/* Load More Brands Button */}
                          {hasMoreCompanies && (
                            <div className="flex justify-center mt-6">
                              <motion.button
                                onClick={loadMoreCompanies}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200/50 text-blue-600 hover:from-blue-500/20 hover:to-purple-500/20 hover:border-blue-300/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300"
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Sparkles className="h-4 w-4" />
                                <span>
                                  Load{" "}
                                  {Math.min(
                                    20,
                                    filteredCompanies.length - displayLimit
                                  )}{" "}
                                  more brands
                                </span>
                              </motion.button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>

              {/* Compact Search Bar - Hidden when brand filter is open */}
              {!showCompanyFilter && (
                <motion.div
                  className="relative max-w-md mx-auto mb-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search products..."
                    className="pl-10 pr-8 py-2 bg-white/90 dark:bg-gray-900 border dark:border-none border-gray-200/50 text-gray-700 placeholder:text-gray-400 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400/50 transition-all shadow-sm"
                  />
                  {searchInput && (
                    <button
                      onClick={() => setSearchInput("")}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </motion.div>
              )}
              {/* Smart Products Grid with Infinite Scroll - Hidden when brand filter is open */}
              {!showCompanyFilter && (
                <div className="space-y-3">
                  {/* Results count */}
                  {filteredProducts.length > 0 && (
                    <div className="flex items-center justify-between">
                      <p className="text-gray-600 text-sm">
                        Showing {Math.min(filteredProducts.length, 50)} of{" "}
                        {filteredProducts.length} products
                      </p>
                      {(debouncedSearch || selectedCompanyId) && (
                        <motion.button
                          onClick={() => {
                            setSearchInput("");
                            setSelectedCompanyId("");
                          }}
                          className="px-3 py-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-600 hover:from-blue-500/20 hover:to-purple-500/20 text-sm font-medium rounded-lg transition-all duration-300 border border-blue-200/50"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Clear filters
                        </motion.button>
                      )}
                    </div>
                  )}

                  {/* Compact Products Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                    {productsLoading ? (
                      // AI-Inspired Loading Skeleton for Products
                      Array.from({ length: 12 }).map((_, index) => (
                        <motion.div
                          className="bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-xl shadow-blue-500/10 p-4 max-w-4xl mx-auto"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="aspect-square bg-gradient-to-br from-gray-200 to-blue-100 relative overflow-hidden animate-pulse">
                            <div className="w-full h-full flex items-center justify-center">
                              <Sparkles
                                className="h-4 w-4 text-blue-400 animate-spin"
                                style={{ animationDuration: "2s" }}
                              />
                            </div>
                            {/* AI Try-on indicator skeleton */}
                            <div className="absolute top-1 right-1 w-4 h-4 bg-gradient-to-r from-blue-300 to-purple-300 rounded-full animate-pulse opacity-60" />
                          </div>
                          <div className="p-2">
                            <div className="h-3 bg-gradient-to-r from-gray-200 to-blue-100 rounded animate-pulse mb-1" />
                            <div className="h-3 w-16 bg-gradient-to-r from-blue-200 to-purple-200 rounded animate-pulse" />
                          </div>
                        </motion.div>
                      ))
                    ) : productsError ? (
                      // Error State for Products
                      <motion.div
                        className="col-span-full text-center py-12"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
                          <X className="h-8 w-8 text-red-500" />
                        </div>
                        <h3 className="text-gray-700 font-semibold text-lg mb-2">
                          Failed to load products
                        </h3>
                        <p className="text-gray-500 text-sm mb-4">
                          Please check your connection and try again
                        </p>
                        <motion.button
                          onClick={() => window.location.reload()}
                          className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg shadow-blue-500/25"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Retry
                        </motion.button>
                      </motion.div>
                    ) : (
                      filteredProducts
                        .slice(0, 50) // Show more products for better UX
                        .map((product: Product, index: number) => (
                          <motion.div
                            key={product.id}
                            className="group cursor-pointer bg-white/90 rounded-xl border border-gray-200/50 hover:border-blue-400/60 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden"
                            whileHover={{ scale: 1.03, y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            layout
                            onClick={() =>
                              setSelectedProductId({
                                id: String(product.id),
                                imageUrl: product.imageUrl || "",
                              })
                            }
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(index * 0.01, 0.5) }}
                          >
                            <div className="aspect-square bg-gray-100 relative overflow-hidden">
                              {product.imageUrl && (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  loading="lazy"
                                />
                              )}
                              {/* AI Try-on indicator */}
                              <div className="absolute top-1 right-1 w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center opacity-80">
                                <Sparkles className="h-2 w-2 text-white" />
                              </div>
                            </div>
                            <div className="p-2">
                              <h3 className="text-gray-700 font-medium text-xs truncate leading-tight">
                                {product.name}
                              </h3>
                              {product.price && (
                                <p className="text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text font-semibold text-xs mt-1">
                                  RF {product.price}
                                </p>
                              )}
                            </div>
                          </motion.div>
                        ))
                    )}
                  </div>

                  {/* No results message */}
                  {filteredProducts.length === 0 && products.length > 0 && (
                    <motion.div
                      className="text-center py-12"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                        <Search className="h-8 w-8 text-blue-500" />
                      </div>
                      <h3 className="text-gray-700 font-semibold text-lg mb-2">
                        No products found
                      </h3>
                      <p className="text-gray-500 text-sm mb-4">
                        Try adjusting your search or filters
                      </p>
                      <motion.button
                        onClick={() => {
                          setSearchInput("");
                          setSelectedCompanyId("");
                        }}
                        className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg shadow-blue-500/25"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Clear all filters
                      </motion.button>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Compact AI Try-On Widget */}
          {selectedProductId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-sm"
            >
              <motion.div
                className="relative bg-white rounded-2xl p-4 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    ✨ AI Try-On
                  </h2>
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={() => {
                        const randomProduct =
                          products[Math.floor(Math.random() * products.length)];
                        if (randomProduct) {
                          setSelectedProductId({
                            id: String(randomProduct.id),
                            imageUrl: randomProduct.imageUrl,
                          });
                        }
                      }}
                      className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Eye className="h-3 w-3 inline mr-1" />
                      Try Another
                    </motion.button>
                    <motion.button
                      onClick={() => setSelectedProductId(null)}
                      className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      ×
                    </motion.button>
                  </div>
                </div>

                <TryOnWidget
                  productId={selectedProductId.id}
                  productImageUrl={selectedProductId.imageUrl}
                  onUnselectProduct={() => setSelectedProductId(null)}
                  onNavigateToProduct={(productId) => {
                    // Navigate to product details page
                    window.location.href = `/product/${productId}`;
                  }}
                />
              </motion.div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
