import { useMemo, useState } from "react";
import { useCompanies } from "@/hooks/useCompanies";
import { useLocation } from "wouter";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Search, Loader2, X } from "lucide-react";

export default function Companies() {
  const { data: companies = [], isLoading } = useCompanies();
  const [, setLocation] = useLocation();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return companies;
    return companies.filter((c) => {
      return [c.name, c.email, c.phone, c.location]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term));
    });
  }, [companies, q]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-background dark:via-slate-900 dark:to-slate-800">
      <main className="pt-24 pb-12 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-4xl font-bold gradient-text mb-2">
              Producers & Companies
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Discover brands on Nyambika
            </p>
          </div>

          {/* Instagram-style Search */}
          <div className="mb-8">
            <div className="max-w-2xl mx-auto">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative glassmorphism rounded-2xl p-1 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-slate-900/80 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Search className="text-gray-400 h-5 w-5 flex-shrink-0" />
                    <Input
                      placeholder="Search companies, brands, locations..."
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      className="flex-1 border-0 bg-transparent text-base placeholder:text-gray-400 focus:ring-0 focus:outline-none p-0 px-3"
                    />
                    {q && (
                      <button
                        onClick={() => setQ("")}
                        className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        aria-label="Clear search"
                      >
                        <X className="h-4 w-4 text-gray-400" />
                      </button>
                    )}
                  </div>
                  {q && (
                    <div className="px-4 pb-3">
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>
                          {filtered.length} result
                          {filtered.length !== 1 ? "s" : ""} found
                        </span>
                        {filtered.length > 0 && (
                          <>
                            <span>•</span>
                            <button
                              onClick={() => setQ("")}
                              className="text-blue-500 hover:text-blue-600 font-medium"
                            >
                              Clear
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <div className="flex items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="text-lg">Loading companies...</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-12 gap-4">
              {filtered.map((c) => {
                const label = c.name;
                const logo = c.logoUrl || undefined;
                const initials = (label || "?")
                  .split(" ")
                  .slice(0, 2)
                  .map((s) => s[0])
                  .join("")
                  .toUpperCase();
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setLocation(`/products?producerId=${c.producerId}`);
                    }}
                    className="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-4 xl:col-span-3 text-left floating-card neumorphism rounded-2xl p-4 hover:shadow-lg transition-shadow"
                    aria-label={`View products by ${label}`}
                    title={`View products by ${label}`}
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="h-12 w-12 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 flex items-center justify-center">
                          {logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
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
                            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                              {initials}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="truncate">
                        <div className="font-semibold truncate">{label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {c.location}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
