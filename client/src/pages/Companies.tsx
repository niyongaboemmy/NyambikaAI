import { useMemo, useState } from "react";
import { useCompanies } from "@/hooks/useCompanies";
import { useLocation } from "wouter";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Loader2,
  X,
  TrendingUp,
  Star,
  Award,
  Users,
  ShoppingBag,
  Eye,
  ArrowRight,
} from "lucide-react";

// Mock performance data - in real app, this would come from analytics API
const generateCompanyMetrics = (company: any) => {
  const baseScore = Math.floor(Math.random() * 30) + 70; // 70-100 range
  return {
    performanceScore: baseScore,
    totalProducts: Math.floor(Math.random() * 50) + 10,
    monthlyViews: Math.floor(Math.random() * 10000) + 1000,
    rating: (4.0 + Math.random() * 1.0).toFixed(1),
    growth: Math.floor(Math.random() * 40) + 5, // 5-45% growth
    isTopPerformer: baseScore >= 85,
    isTrending: Math.random() > 0.7,
    badge:
      baseScore >= 95
        ? "Elite"
        : baseScore >= 85
        ? "Premium"
        : baseScore >= 75
        ? "Rising Star"
        : "Growing",
  };
};

export default function Companies() {
  const { data: companies = [], isLoading } = useCompanies();
  const [, setLocation] = useLocation();
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "performance" | "trending">(
    "performance"
  );

  const companiesWithMetrics = useMemo(() => {
    return companies.map((company) => ({
      ...company,
      metrics: generateCompanyMetrics(company),
    }));
  }, [companies]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let result = companiesWithMetrics;

    if (term) {
      result = result.filter((c) => {
        return [c.name, c.email, c.phone, c.location]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term));
      });
    }

    // Sort by selected criteria
    result.sort((a, b) => {
      switch (sortBy) {
        case "performance":
          return b.metrics.performanceScore - a.metrics.performanceScore;
        case "trending":
          return (
            (b.metrics.isTrending ? 1 : 0) - (a.metrics.isTrending ? 1 : 0)
          );
        case "name":
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return result;
  }, [companiesWithMetrics, q, sortBy]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-background dark:via-slate-900 dark:to-slate-800">
      <main className="pt-24 pb-12 px-4 md:px-6">
        <div className=" ">
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Top Brands
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Rwanda's fashion entrepreneurs
            </p>

            {/* Compact Stats */}
            <div className="flex justify-center items-center gap-6 text-xs">
              <span>
                <strong className="text-blue-600">{filtered.length}</strong>{" "}
                Active
              </span>
              <span>
                <strong className="text-green-600">
                  {filtered.filter((c) => c.metrics.isTopPerformer).length}
                </strong>{" "}
                Top
              </span>
              <span>
                <strong className="text-purple-600">
                  {filtered.filter((c) => c.metrics.isTrending).length}
                </strong>{" "}
                Trending
              </span>
            </div>
          </div>

          {/* Compact Search */}
          <div className="mb-4">
            <div className="max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search brands..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="pl-10 pr-10 py-2 text-sm rounded-xl border-gray-200 dark:border-gray-700"
                />
                {q && (
                  <button
                    onClick={() => setQ("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Compact Sort Controls */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {[
              { key: "performance", label: "Top", icon: TrendingUp },
              { key: "trending", label: "Hot", icon: Star },
              { key: "name", label: "A-Z", icon: Users },
            ].map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={sortBy === key ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy(key as any)}
                className={`text-xs ${
                  sortBy === key
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <Icon className="h-3 w-3 mr-1" />
                {label}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <div className="flex items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="text-lg">Loading companies...</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filtered.map((c, index) => {
                const label = c.name;
                const logo = c.logoUrl || undefined;
                const metrics = c.metrics;
                const initials = (label || "?")
                  .split(" ")
                  .slice(0, 2)
                  .map((s) => s[0])
                  .join("")
                  .toUpperCase();

                return (
                  <div
                    key={c.id}
                    className="relative group bg-white dark:bg-gray-900 rounded-2xl p-3 shadow-md hover:shadow-lg transition-all duration-200 border border-gray-100 dark:border-gray-800"
                  >
                    {/* Compact Header */}
                    <div className="flex flex-col items-center text-center mb-3">
                      <div className="relative mb-2">
                        <div className="h-12 w-12 rounded-xl overflow-hidden bg-white dark:bg-slate-800 flex items-center justify-center border">
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
                            <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
                              {initials}
                            </span>
                          )}
                        </div>
                        {/* Compact badges */}
                        {index < 3 && (
                          <div
                            className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                              index === 0
                                ? "bg-yellow-500"
                                : index === 1
                                ? "bg-gray-500"
                                : "bg-orange-500"
                            }`}
                          >
                            {index + 1}
                          </div>
                        )}
                        {metrics.isTrending && (
                          <div className="absolute -bottom-1 -left-1 bg-pink-500 rounded-full p-1">
                            <TrendingUp className="h-2 w-2 text-white" />
                          </div>
                        )}
                      </div>

                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate w-full">
                        {label}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate w-full">
                        {c.location}
                      </p>

                      {/* Compact metrics */}
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                          <span>{metrics.rating}</span>
                        </div>
                        <div className="text-gray-500">
                          {metrics.totalProducts} items
                        </div>
                      </div>

                      {/* Performance bar */}
                      <div className="w-full mt-2">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                          <div
                            className={`h-1 rounded-full ${
                              metrics.performanceScore >= 90
                                ? "bg-green-500"
                                : metrics.performanceScore >= 80
                                ? "bg-blue-500"
                                : metrics.performanceScore >= 70
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${metrics.performanceScore}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {metrics.performanceScore}/100
                        </div>
                      </div>
                    </div>

                    {/* Compact action */}
                    <Button
                      onClick={() => setLocation(`/store/${c.id}`)}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                      size="sm"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
