import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Search, Filter, Heart, Plus, Loader2 } from "lucide-react";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Product, Category } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Products() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [favorites, setFavorites] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const isAdmin = user?.role === "admin";

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
        price: typeof editing.price === "number" ? String(editing.price) : editing.price,
        categoryId: editing.categoryId || "",
        imageUrl: editing.imageUrl || "",
      });
    }
  }, [editing]);

  // Fetch categories from API
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<
    (Category & { id: string; name: string; nameRw: string })[]
  >({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      return [{ id: "all", name: "All", nameRw: "Byose" }, ...data];
    },
  });

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
      toast({ title: "Update failed", description: e.message, variant: "destructive" });
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
      if (!res.ok && res.status !== 204) throw new Error("Failed to delete product");
    },
    onSuccess: () => {
      toast({ title: "Product deleted" });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: any) => {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    },
  });

  // Fetch products from API
  const { data: products = [], isLoading: productsLoading } = useQuery<
    Product[]
  >({
    queryKey: ["products", selectedCategory, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== "all")
        params.set("categoryId", selectedCategory);
      if (searchQuery) params.set("search", searchQuery);

      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
  });

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

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("rw-RW", {
      style: "currency",
      currency: "RWF",
      minimumFractionDigits: 0,
    })
      .format(numPrice)
      .replace("RWF", "RWF");
  };

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
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold gradient-text mb-4">
              Imyenda Yose / All Products
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Discover our complete fashion collection
            </p>
          </div>

          {/* Search and Filter */}
          <div className="glassmorphism rounded-2xl p-6 mb-12">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Shakisha imyenda... / Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 glassmorphism border-0 bg-transparent"
                />
              </div>

              {/* Category Filter */}
              <div className="flex gap-2 flex-wrap">
                {categoriesLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading categories...</span>
                  </div>
                ) : (
                  categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={
                        selectedCategory === category.id ? "default" : "ghost"
                      }
                      onClick={() => setSelectedCategory(category.id)}
                      className={
                        selectedCategory === category.id
                          ? "gradient-bg text-white"
                          : "glassmorphism"
                      }
                    >
                      {category.nameRw || category.name}
                    </Button>
                  ))
                )}
              </div>

              <Button variant="ghost" className="glassmorphism">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>

              {isAdmin && (
                <Button
                  onClick={() => setLocation("/add-product")}
                  className="ml-auto gradient-bg text-white"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Product
                </Button>
              )}
            </div>
          </div>

          {/* Products Grid */}
          {productsLoading ? (
            <div className="flex justify-center items-center py-16">
              <div className="flex items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="text-lg">Loading products...</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="group floating-card p-6 neumorphism"
                >
                  <div className="relative overflow-hidden rounded-2xl mb-4">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500";
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleFavorite(product.id)}
                      className={`absolute top-2 right-2 glassmorphism rounded-full p-2 ${
                        favorites.includes(product.id)
                          ? "text-red-500"
                          : "text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          favorites.includes(product.id) ? "fill-current" : ""
                        }`}
                      />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {product.nameRw}
                      </p>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-[rgb(var(--electric-blue-rgb))]">
                        {typeof product.price === "number"
                          ? formatPrice(product.price)
                          : product.price}
                      </span>
                      <Button
                        onClick={() => addToCart(product.id)}
                        className="gradient-bg text-white px-4 py-2 rounded-xl hover:scale-105 transition-all duration-300"
                      >
                        View Details
                      </Button>
                    </div>

                    {isAdmin && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditing(product);
                            setOpenEdit(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            if (confirm("Delete this product?")) {
                              deleteMutation.mutate(product.id);
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!productsLoading && products.length === 0 && (
            <div className="text-center py-16">
              <div className="glassmorphism rounded-3xl p-12 max-w-md mx-auto">
                <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                  Nta myenda Yabonetse / No Products Found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Gerageza gushakisha ijambo rishya cyangwa hitamo indi category
                </p>
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
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm">Name (Kinyarwanda)</label>
                <Input
                  value={editForm.nameRw}
                  onChange={(e) => setEditForm({ ...editForm, nameRw: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm">Description</label>
              <Input
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm">Price (RWF)</label>
                <Input
                  type="number"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm">Category</label>
                <select
                  className="w-full px-3 py-2 rounded-md border bg-background"
                  value={editForm.categoryId}
                  onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
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
                onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenEdit(false)}>
              Cancel
            </Button>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
