import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TryOnWidget from "@/components/TryOnWidget";
import Footer from "@/components/Footer";
import type { Product, Category } from "@shared/schema";
import { ArrowLeft, ChevronLeft, ChevronRight, Filter } from "lucide-react";

export default function TryOnStart() {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const { data: products } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Failed to load products");
      return res.json();
    },
  });
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to load categories");
      return res.json();
    },
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (products || []).filter((p) => {
      const matchCat = categoryId === "all" || p.categoryId === categoryId;
      if (!term) return matchCat;
      const inName = p.name?.toLowerCase().includes(term) || p.nameRw?.toLowerCase().includes(term);
      return matchCat && inName;
    });
  }, [products, search, categoryId]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-background dark:via-slate-900 dark:to-slate-800">
      <main className="pt-24 pb-12 px-4 md:px-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header actions */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <a href="/" className="flex items-center gap-2 glassmorphism px-3 py-2 rounded-xl text-sm">
                <ArrowLeft className="h-4 w-4" /> Back Home
              </a>
              <h1 className="text-2xl md:text-3xl font-bold gradient-text">AI Try-On: Select Product</h1>
            </div>
          </div>

          {/* Filters */}
          <Card className="floating-card p-4">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="text-sm font-semibold block mb-2">Search</label>
                  <div className="relative">
                    <Input
                      placeholder="Search by name..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                      className="rounded-xl"
                    />
                    <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <div className="col-span-1">
                  <label className="text-sm font-semibold block mb-2">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => {
                      setCategoryId(e.target.value);
                      setPage(1);
                    }}
                    className="w-full glassmorphism px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700"
                  >
                    <option value="all">All Categories</option>
                    {categories?.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-1 flex items-end">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {filtered.length} results
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main content: grid + widget */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Product Grid */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {paged.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProductId(String(p.id))}
                    className={`group relative overflow-hidden rounded-2xl border transition-all hover:shadow-lg ${
                      String(p.id) === selectedProductId
                        ? "border-blue-500 ring-2 ring-blue-200"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                    title={p.name}
                  >
                    <img src={p.imageUrl} alt={p.name} className="w-full h-40 object-cover" />
                    <div className="p-3 text-left">
                      <p className="font-semibold line-clamp-1">{p.name}</p>
                      {p.nameRw && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{p.nameRw}</p>
                      )}
                    </div>
                  </button>
                ))}
                {!paged.length && (
                  <div className="col-span-full text-sm text-gray-500">No products match your filters.</div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="ghost"
                    className="glassmorphism"
                    disabled={currentPage === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    className="glassmorphism"
                    disabled={currentPage === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Try-On widget */}
            <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24 self-start">
              <Card className="floating-card p-6">
                <CardContent className="p-0">
                  {!selectedProductId ? (
                    <div className="h-[520px] flex items-center justify-center text-center text-gray-600 dark:text-gray-300">
                      <div>
                        <p className="text-lg font-semibold mb-2">Choose a product to begin</p>
                        <p className="text-sm">Select an item from the grid to use AI Try-On</p>
                      </div>
                    </div>
                  ) : (
                    <TryOnWidget productId={selectedProductId} />
                  )}
                </CardContent>
              </Card>
              {selectedProductId && (
                <div>
                  <Button asChild className="w-full gradient-bg text-white">
                    <a href={`/product/${selectedProductId}`}>Continue to Product</a>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
