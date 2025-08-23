import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Search, Plus, Loader2 } from "lucide-react";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Product, Category } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import ProductCard from "@/components/ProductCard";
import { useInfiniteProducts } from "@/hooks/useInfiniteProducts";
import { useCompanies } from "@/hooks/useCompanies";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CompactSearchBar from "@/components/feed/CompactSearchBar";
import SelectedCompanyBar from "@/components/feed/SelectedCompanyBar";

export default function Products() {
  const [path, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const isAdmin = user?.role === "admin";
  const isProducer = user?.role === "producer";

  // Read producerId from URL to filter products by producer
  const producerId = useMemo(() => {
    try {
      const search =
        typeof window !== "undefined" ? window.location.search : "";
      return new URLSearchParams(search).get("producerId") || "";
    } catch {
      return "";
    }
  }, [path]);

  // Load companies for Company filter
  const { data: companies = [] } = useCompanies();

  // Set selected company when producerId changes
  useEffect(() => {
    if (producerId && companies.length > 0) {
      const company = companies.find((c) => c.producerId === producerId);
      setSelectedCompany(company || null);
    } else {
      setSelectedCompany(null);
    }
  }, [producerId, companies]);

  // Debounce search typing for smoother UX
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchQuery), 250);
    return () => clearTimeout(id);
  }, [searchQuery]);

  // Edit dialog state
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    nameRw: "",
    description: "",
    price: "",
    categoryId: "",
    imageUrl: "",
  });

  useEffect(() => {
    if (editing) {
      setEditForm({
        name: editing.name,
        nameRw: editing.nameRw || "",
        description: editing.description || "",
        price:
          typeof editing.price === "number"
            ? String(editing.price)
            : editing.price,
        categoryId: editing.categoryId || "",
        imageUrl: editing.imageUrl || "",
      });
    }
  }, [editing]);

  // Fetch categories from API (still needed for Edit dialog only)
  const { data: categories = [] } = useQuery<
    (Category & { id: string; name: string; nameRw: string })[]
  >({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      return data;
    },
  });

  // Handle company selection
  const handleCompanySelect = (company: any) => {
    const url = new URL(window.location.href);
    if (company) {
      url.searchParams.set("producerId", String(company.producerId));
      setSelectedCompany(company);
    } else {
      url.searchParams.delete("producerId");
      setSelectedCompany(null);
    }
    window.history.replaceState({}, "", url.toString());
    setLocation(url.pathname + url.search);
  };

  // Handle search toggle
  const handleSearchToggle = () => {
    setSearchExpanded(!searchExpanded);
    if (!searchExpanded) {
      // Focus search input when opened
      setTimeout(() => {
        const searchInput = document.querySelector(
          'input[type="text"]'
        ) as HTMLInputElement;
        if (searchInput) searchInput.focus();
      }, 100);
    } else {
      // Clear search when closed
      setSearchQuery("");
    }
  };

  // Update product (admin)
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`/api/products/${editing.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...editForm,
          price: String(parseFloat(editForm.price || "0")),
        }),
      });
      if (!res.ok) throw new Error("Failed to update product");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Product updated" });
      setOpenEdit(false);
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: any) => {
      toast({
        title: "Update failed",
        description: e.message,
        variant: "destructive",
      });
    },
  });

  // Delete product (admin)
  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok && res.status !== 204)
        throw new Error("Failed to delete product");
    },
    onSuccess: () => {
      toast({ title: "Product deleted" });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: any) => {
      toast({
        title: "Delete failed",
        description: e.message,
        variant: "destructive",
      });
    },
  });

  // Infinite products (50 per page)
  const {
    data: productsPages,
    isLoading: productsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteProducts({
    categoryId: "all",
    // do not pass search here; search locally first
    producerId,
    limit: 50,
  });

  const products = (productsPages?.pages || []).flat();

  // Local search across all keys
  const term = (debouncedSearch || "").trim().toLowerCase();
  const locallyFilteredProducts = useMemo(() => {
    return products.filter((p: any) => {
      if (!term) return true;
      return Object.values(p).some((v) => {
        if (v == null) return false;
        const s =
          typeof v === "string" ? v : typeof v === "number" ? String(v) : "";
        return s && s.toLowerCase().includes(term);
      });
    });
  }, [products, term]);

  // Sentinel for infinite scroll
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { root: null, rootMargin: "600px 0px", threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, products.length]);

  // If search/category changes and no local results in current pages, auto fetch next page
  useEffect(() => {
    if (
      locallyFilteredProducts.length === 0 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    searchQuery,
    locallyFilteredProducts.length,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ]);

  // Add to favorites mutation
  const addToFavoritesMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": "demo-user", // Replace with actual user ID from auth
        },
        body: JSON.stringify({ productId }),
      });
      if (!response.ok) throw new Error("Failed to add to favorites");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Added to favorites",
        description: "Product saved to your favorites list",
      });
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add to favorites",
        variant: "destructive",
      });
    },
  });

  // Remove from favorites mutation
  const removeFromFavoritesMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await fetch(`/api/favorites/${productId}`, {
        method: "DELETE",
        headers: { "x-user-id": "demo-user" },
      });
      if (!response.ok) throw new Error("Failed to remove from favorites");
    },
    onSuccess: () => {
      toast({
        title: "Removed from favorites",
        description: "Product removed from your favorites list",
      });
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove from favorites",
        variant: "destructive",
      });
    },
  });

  const toggleFavorite = (productId: string) => {
    if (favorites.includes(productId)) {
      removeFromFavoritesMutation.mutate(productId);
      setFavorites((prev) => prev.filter((id) => id !== productId));
    } else {
      addToFavoritesMutation.mutate(productId);
      setFavorites((prev) => [...prev, productId]);
    }
  };

  const addToCart = (productId: string) => {
    // Navigate to product detail page for size selection
    setLocation(`/product/${productId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-background dark:via-slate-900 dark:to-slate-800">
      <main className="pt-24 pb-12 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Instagram-style Header */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedCompany ? selectedCompany.name : "Discover"}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {selectedCompany
                  ? `${selectedCompany.location || "Fashion Brand"}`
                  : "Explore fashion from all brands"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Search Icon */}
              <button
                onClick={handleSearchToggle}
                className={`p-2 rounded-full transition-all duration-200 ${
                  searchExpanded
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
                aria-label="Toggle search"
              >
                <Search className="h-6 w-6" />
              </button>
              {(isAdmin || isProducer) && (
                <Button
                  onClick={() => setLocation("/product-registration")}
                  className="gradient-bg text-white"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Product
                </Button>
              )}
            </div>
          </div>

          {/* Instagram Stories - Always at top */}
          <div className="mb-5">
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex items-start gap-3 pb-2 min-w-max px-1 pt-2">
                {/* Your Story - All Brands */}
                <button
                  onClick={() => handleCompanySelect(null)}
                  className="flex flex-col items-center gap-2 group min-w-[80px]"
                  aria-label="Show all brands"
                >
                  <div
                    className={`relative transition-all duration-300 ${
                      !selectedCompany
                        ? "bg-gradient-to-tr from-purple-500 via-pink-500 to-red-500 shadow-lg scale-110"
                        : "bg-gray-300 dark:bg-gray-600 group-hover:bg-gray-400 dark:group-hover:bg-gray-500"
                    } p-[3px] rounded-full group-hover:scale-105`}
                  >
                    <div className="bg-white dark:bg-slate-900 rounded-full p-[2px]">
                      <div className="h-[72px] w-[72px] rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center relative overflow-hidden">
                        <span className="text-white font-bold text-xl z-10">
                          All
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent"></div>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center leading-tight">
                    All Brands
                  </span>
                </button>

                {/* Company Stories */}
                {companies.map((company: any) => {
                  const isSelected = selectedCompany?.id === company.id;
                  const label = company.name;
                  const logo = company.logoUrl as string | undefined;
                  const initials = (label || "?")
                    .split(" ")
                    .slice(0, 2)
                    .map((s: string) => s[0])
                    .join("")
                    .toUpperCase();

                  return (
                    <button
                      key={company.id}
                      onClick={() => handleCompanySelect(company)}
                      className="flex flex-col items-center gap-2 group min-w-[80px]"
                      aria-pressed={isSelected}
                      title={label}
                    >
                      {/* Instagram gradient ring */}
                      <div
                        className={`relative transition-all duration-300 ${
                          isSelected
                            ? "bg-gradient-to-tr from-purple-500 via-pink-500 to-red-500 shadow-lg scale-110"
                            : "bg-gray-300 dark:bg-gray-600 group-hover:bg-gradient-to-tr group-hover:from-purple-400 group-hover:via-pink-400 group-hover:to-red-400"
                        } p-[3px] rounded-full group-hover:scale-105`}
                      >
                        <div className="bg-white dark:bg-slate-900 rounded-full p-[2px]">
                          <div className="h-[72px] w-[72px] rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center relative">
                            {logo ? (
                              <img
                                src={logo}
                                alt={label}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  (
                                    e.currentTarget as HTMLImageElement
                                  ).style.display = "none";
                                }}
                                loading="lazy"
                              />
                            ) : (
                              <span className="text-xl font-bold text-gray-600 dark:text-gray-300">
                                {initials}
                              </span>
                            )}
                            {/* Subtle overlay for better text visibility */}
                            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
                          </div>
                        </div>
                        {/* Viewed indicator dot */}
                        {isSelected && (
                          <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full flex items-center justify-center">
                            <div className="h-2 w-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center leading-tight max-w-[75px] truncate">
                        {label}
                      </span>
                    </button>
                  );
                })}

                {/* View All Companies Indicator */}
                <button
                  onClick={() => setLocation("/companies")}
                  className="flex flex-col items-center gap-2 group min-w-[80px]"
                  aria-label="View all companies"
                  title="View all companies"
                >
                  <div className="relative bg-gray-200 dark:bg-gray-700 p-[3px] rounded-full group-hover:bg-gradient-to-tr group-hover:from-blue-400 group-hover:via-purple-400 group-hover:to-pink-400 transition-all duration-300 group-hover:scale-105">
                    <div className="bg-white dark:bg-slate-900 rounded-full p-[2px]">
                      <div className="h-[72px] w-[72px] rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center relative border-2 border-dashed border-gray-300 dark:border-gray-600">
                        <div className="flex flex-col items-center">
                          <span className="text-2xl font-bold text-gray-400 dark:text-gray-500">
                            +
                          </span>
                          <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
                            More
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center leading-tight">
                    View All
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* TikTok-style Compact Search Bar */}
          {searchExpanded && (
            <CompactSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onCancel={handleSearchToggle}
              placeholder={selectedCompany ? `Search ${selectedCompany.name}...` : "Search products..."}
              resultsCount={locallyFilteredProducts.length}
              stickyTopClass="top-20"
            />
          )}

          {/* Clear Selected Company Bar - Sticky when scrolling */}
          {selectedCompany && (
            <SelectedCompanyBar company={selectedCompany} onClear={() => handleCompanySelect(null)} />
          )}

          {/* Instagram-style Products Grid */}
          {productsLoading ? (
            <div className="flex justify-center items-center py-16">
              <div className="flex items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="text-lg">Loading products...</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-12 gap-1 md:gap-2">
              {locallyFilteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isAdmin={isAdmin}
                  isProducer={isProducer}
                  currentUserId={user?.id}
                  isFavorited={favorites.includes(product.id)}
                  onToggleFavorite={toggleFavorite}
                  onViewDetails={addToCart}
                  hideDesc
                  hideActions
                  onEdit={(id) => setLocation(`/product-edit/${id}`)}
                  onDelete={(id) => {
                    if (confirm("Delete this product?")) {
                      deleteMutation.mutate(id);
                    }
                  }}
                />
              ))}
              {/* Sentinel */}
              <div ref={loadMoreRef} className="col-span-full h-2" />
              {isFetchingNextPage && (
                <div className="col-span-full flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!productsLoading && locallyFilteredProducts.length === 0 && (
            <div className="text-center py-16">
              <div className="glassmorphism rounded-3xl p-12 max-w-md mx-auto">
                <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                  {searchQuery ? "No Products Found" : "Select a Brand"}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchQuery
                    ? "Try different keywords or browse all brands"
                    : "Choose a brand from the stories above to see their products"}
                </p>
                {searchQuery && (
                  <Button
                    variant="outline"
                    onClick={() => setSearchQuery("")}
                    className="mt-4"
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Edit Dialog */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm">Name</label>
                <Input
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm">Name (Kinyarwanda)</label>
                <Input
                  value={editForm.nameRw}
                  onChange={(e) =>
                    setEditForm({ ...editForm, nameRw: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <label className="text-sm">Description</label>
              <Input
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm">Price (RWF)</label>
                <Input
                  type="number"
                  value={editForm.price}
                  onChange={(e) =>
                    setEditForm({ ...editForm, price: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm">Category</label>
                <select
                  className="w-full px-3 py-2 rounded-md border bg-background"
                  value={editForm.categoryId}
                  onChange={(e) =>
                    setEditForm({ ...editForm, categoryId: e.target.value })
                  }
                >
                  {categories
                    .filter((c: any) => c.id !== "all")
                    .map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.nameRw || c.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm">Image URL</label>
              <Input
                value={editForm.imageUrl}
                onChange={(e) =>
                  setEditForm({ ...editForm, imageUrl: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenEdit(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
