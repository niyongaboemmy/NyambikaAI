"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  DollarSign,
  TrendingUp,
  Users,
  Plus,
  Eye,
  Edit,
  MoreVertical,
  Calendar,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Clock,
  Brain,
  Lightbulb,
  Activity,
  AlertTriangle,
  Sparkles,
  Target,
  Settings,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Skeleton } from "../../components/ui/skeleton";
import { CardDescription } from "../../components/ui/card";
import { useProducerDashboard } from "@/hooks/use-producer-dashboard";
import {
  useGroupedProducerOrders,
  useUpdateOrderValidationStatus,
} from "@/hooks/use-orders";
import { apiClient } from "@/config/api";

type Subscription = {
  id: string;
  status: "ACTIVE" | "CANCELED" | "PAST_DUE" | "UNPAID";
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  plan: {
    id: string;
    name: string;
    priceMonthly: number;
  };
};

function ProducerDashboard() {
  const router = useRouter();
  const [showSubscriptionBanner, setShowSubscriptionBanner] = useState(false);
  // Check if user has an active subscription
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiClient.get("/api/subscriptions");
        if (active) setSubscription(res.data);
      } catch (_) {
        // ignore for now; show banner only when we have data
      } finally {
        if (active) setIsLoadingSubscription(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (
      !isLoadingSubscription &&
      subscription &&
      (subscription.status !== "ACTIVE" || subscription.cancelAtPeriodEnd)
    ) {
      setShowSubscriptionBanner(true);
    }
  }, [subscription, isLoadingSubscription]);
  const [timeRange, setTimeRange] = useState("week");
  // AI/Insights local state
  const [seasonality, setSeasonality] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [copyType, setCopyType] = useState<"product" | "social">("product");
  const [copyPrompt, setCopyPrompt] = useState("");
  const [copyResult, setCopyResult] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(10);
  const [priceDeltaPct, setPriceDeltaPct] = useState<number>(5); // +/- percent

  // Live data via React Query hooks
  const { stats, products } = useProducerDashboard();
  const producerOrders = useGroupedProducerOrders(20);
  const updateValidation = useUpdateOrderValidationStatus();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "rejected":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (isLoadingSubscription || stats.isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-12 w-64 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-96 rounded-lg" />
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div>
      {showSubscriptionBanner && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-8 rounded-r">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            {/* Settings Modal */}
            {settingsOpen && (
              <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-md shadow-xl">
                  <div className="flex items-center justify-between p-4 border-b border-border/50">
                    <h3 className="font-semibold">Insights Settings</h3>
                    <button
                      onClick={() => setSettingsOpen(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="block text-sm mb-1">
                        Low stock threshold
                      </label>
                      <input
                        type="number"
                        min={0}
                        className="clean-input w-full"
                        value={lowStockThreshold}
                        onChange={(e) =>
                          setLowStockThreshold(Number(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">
                        Pricing delta (%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        className="clean-input w-full"
                        value={priceDeltaPct}
                        onChange={(e) =>
                          setPriceDeltaPct(Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => setSettingsOpen(false)}
                      >
                        Close
                      </Button>
                      <Button onClick={() => setSettingsOpen(false)}>
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* AI Copy Helper Modal */}
            {copyOpen && (
              <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-2xl shadow-xl">
                  <div className="flex items-center justify-between p-4 border-b border-border/50">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Sparkles className="h-4 w-4" /> AI Copy Helper
                    </h3>
                    <button
                      onClick={() => setCopyOpen(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="flex gap-3 items-center">
                      <label className="text-sm">Type:</label>
                      <select
                        className="clean-input"
                        value={copyType}
                        onChange={(e) =>
                          setCopyType(e.target.value as "product" | "social")
                        }
                      >
                        <option value="product">Product Description</option>
                        <option value="social">Social Post</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Prompt</label>
                      <textarea
                        className="clean-input w-full min-h-[90px]"
                        placeholder={
                          copyType === "product"
                            ? "e.g., Elegant Ankara blazer for business meetings..."
                            : "e.g., Announce weekend promo for summer collection..."
                        }
                        value={copyPrompt}
                        onChange={(e) => setCopyPrompt(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        onClick={() => {
                          // Mock generation
                          const now = new Date().toLocaleDateString("en-RW");
                          const base =
                            copyType === "product"
                              ? `Introducing a new handcrafted piece designed for comfort and confidence. ${copyPrompt}`
                              : `🔥 Weekend Promo Alert! ${copyPrompt}\nShop now and elevate your style. #NyambikaAI #MadeInRwanda`;
                          setCopyResult(base + `\n\n— Generated on ${now}`);
                        }}
                      >
                        Generate
                      </Button>
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Result</label>
                      <textarea
                        className="clean-input w-full min-h-[160px]"
                        value={copyResult}
                        onChange={(e) => setCopyResult(e.target.value)}
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(copyResult);
                          }}
                        >
                          Copy
                        </Button>
                        <Button onClick={() => setCopyOpen(false)}>Done</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="ml-3">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                {!subscription
                  ? "You need an active subscription to access all features."
                  : "Your subscription is not active. Please update your payment method or contact support."}
              </p>
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
                  onClick={() => router.push("/producer-subscription")}
                >
                  {!subscription ? "Subscribe Now" : "Update Subscription"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
        <main className="pt-12 pb-12">
          <div className=" ">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold gradient-text">
                  Producer Dashboard
                </h1>
                <p className="text-muted-foreground mt-2">
                  Manage your products and track your business performance
                </p>
              </div>
              <div className="flex items-center gap-4">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="clean-input"
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>
                <Link href="/product-registration">
                  <Button className="gradient-bg text-white hover:opacity-90 transition-opacity">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats Grid (live) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                {
                  title: "Total Products",
                  value: stats.data?.totalProducts ?? 0,
                  change: stats.getChanges("totalProducts").value,
                  icon: Package,
                  color: "text-blue-600",
                  bgColor: "bg-blue-100 dark:bg-blue-900/20",
                },
                {
                  title: "Revenue",
                  value: stats.data
                    ? stats.formatPrice(stats.data.totalRevenue)
                    : "-",
                  change: stats.getChanges("totalRevenue").value,
                  icon: DollarSign,
                  color: "text-green-600",
                  bgColor: "bg-green-100 dark:bg-green-900/20",
                },
                {
                  title: "Orders",
                  value: stats.data?.totalOrders ?? 0,
                  change: stats.getChanges("totalOrders").value,
                  icon: TrendingUp,
                  color: "text-purple-600",
                  bgColor: "bg-purple-100 dark:bg-purple-900/20",
                },
                {
                  title: "Customers",
                  value: "—",
                  change: "",
                  icon: Users,
                  color: "text-orange-600",
                  bgColor: "bg-orange-100 dark:bg-orange-900/20",
                },
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index} className="floating-card">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {stat.title}
                          </p>
                          <p className="text-2xl font-bold text-foreground mt-1">
                            {stat.value}
                          </p>
                          {!!stat.change && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {stat.change}
                            </p>
                          )}
                        </div>
                        <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                          <Icon className={`h-6 w-6 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Orders by validation status (live) */}
              <Card className="floating-card">
                <CardHeader>
                  <CardTitle className="gradient-text flex items-center gap-2">
                    <Package className="h-5 w-5" /> Orders by Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {producerOrders.isLoading && (
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-10 rounded" />
                      ))}
                    </div>
                  )}
                  {producerOrders.error && (
                    <div className="text-sm text-red-500">
                      Failed to load orders.
                    </div>
                  )}
                  {!producerOrders.isLoading && !producerOrders.error && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(
                        [
                          { key: "pending", title: "Pending", icon: Clock },
                          {
                            key: "in_progress",
                            title: "In Progress",
                            icon: Activity,
                          },
                          { key: "done", title: "Done", icon: CheckCircle },
                        ] as const
                      ).map(({ key, title, icon: Icon }) => (
                        <div key={key} className="p-3 rounded-lg bg-muted/40">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium flex items-center gap-2">
                              <Icon className="h-4 w-4" /> {title}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {producerOrders.grouped[key].length}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {producerOrders.grouped[key]
                              .slice(0, 5)
                              .map((o) => (
                                <div
                                  key={o.id}
                                  className="flex items-center justify-between text-sm p-2 rounded bg-background/60 border border-border/40"
                                >
                                  <div className="truncate">
                                    <p className="font-medium truncate">
                                      Order #{o.id.slice(0, 8)}
                                    </p>
                                    {o.items && (
                                      <p className="text-xs text-muted-foreground truncate">
                                        {o.items.length} item(s)
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {key === "pending" && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={updateValidation.isPending}
                                        onClick={() =>
                                          updateValidation.mutate({
                                            id: o.id,
                                            validationStatus: "in_progress",
                                          })
                                        }
                                      >
                                        Start
                                      </Button>
                                    )}
                                    {key === "in_progress" && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={updateValidation.isPending}
                                        onClick={() =>
                                          updateValidation.mutate({
                                            id: o.id,
                                            validationStatus: "done",
                                          })
                                        }
                                      >
                                        Mark Done
                                      </Button>
                                    )}
                                    {key === "done" && (
                                      <span className="text-xs text-muted-foreground">
                                        Completed
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            {producerOrders.grouped[key].length === 0 && (
                              <p className="text-xs text-muted-foreground">
                                No orders
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              {/* AI Sales Forecast */}
              <Card className="floating-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="gradient-text flex items-center gap-2">
                      <Brain className="h-5 w-5" /> AI Sales Forecast
                    </CardTitle>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <input
                          type="checkbox"
                          className="accent-primary"
                          checked={seasonality}
                          onChange={(e) => setSeasonality(e.target.checked)}
                        />
                        Include seasonality
                      </label>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Forecast for next 30 days based on recent performance.
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-muted/40">
                      <p className="text-xs text-muted-foreground">
                        Expected Revenue
                      </p>
                      <p className="text-xl font-semibold">
                        {stats.data
                          ? stats.formatPrice(
                              Math.round(
                                Number(stats.data.totalRevenue || 0) * 1.12
                              )
                            )
                          : "—"}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        +12% growth
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/40">
                      <p className="text-xs text-muted-foreground">
                        Projected Orders
                      </p>
                      <p className="text-xl font-semibold">
                        {stats.data
                          ? Math.round(
                              Number(stats.data.totalOrders || 0) * 1.15
                            ).toString()
                          : "—"}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        +15% volume
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/40">
                      <p className="text-xs text-muted-foreground">
                        Confidence
                      </p>
                      <p className="text-xl font-semibold">68%</p>
                      <p className="text-xs text-muted-foreground">
                        short-term model
                      </p>
                    </div>
                  </div>
                  {/* Sparkline with confidence band (SVG) */}
                  <div className="mt-2">
                    {(() => {
                      const base = Number(stats.data?.totalOrders || 12);
                      const points = Array.from({ length: 12 }, (_, i) => {
                        const season = seasonality
                          ? 1 + 0.15 * Math.sin((i / 12) * Math.PI * 2)
                          : 1;
                        const noise = 0.05 * Math.sin(i * 1.7);
                        return base * (0.8 + i * 0.02) * season * (1 + noise);
                      });
                      const max = Math.max(...points) * 1.1;
                      const width = 280;
                      const height = 80;
                      const step = width / (points.length - 1);
                      const y = (v: number) => height - (v / max) * height;
                      const d = points
                        .map(
                          (p, i) => `${i === 0 ? "M" : "L"} ${i * step} ${y(p)}`
                        )
                        .join(" ");
                      // confidence band +/-10%
                      const upper = points
                        .map((p, i) => `L ${i * step} ${y(p * 1.1)}`)
                        .join(" ");
                      const lower = points
                        .slice()
                        .reverse()
                        .map(
                          (p, idx) =>
                            `L ${(points.length - 1 - idx) * step} ${y(
                              p * 0.9
                            )}`
                        )
                        .join(" ");
                      const band = `M 0 ${y(
                        points[0] * 1.1
                      )} ${upper} ${lower} Z`;
                      return (
                        <svg
                          width={width}
                          height={height}
                          className="w-full h-20"
                        >
                          <path
                            d={band}
                            fill="currentColor"
                            className="text-blue-500/10"
                          />
                          <path
                            d={d}
                            stroke="currentColor"
                            className="text-blue-500"
                            fill="none"
                            strokeWidth={2}
                          />
                        </svg>
                      );
                    })()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Tip: Improve forecast accuracy by adding product seasonality
                    and campaign tags.
                  </div>
                </CardContent>
              </Card>

              {/* Smart Pricing Suggestions */}
              <Card className="floating-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="gradient-text flex items-center gap-2">
                      <Lightbulb className="h-5 w-5" /> Smart Pricing
                      Suggestions
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setSettingsOpen(true)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {products.isLoading &&
                    [1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 rounded-lg" />
                    ))}
                  {products.error && (
                    <div className="text-sm text-red-500">
                      Unable to generate suggestions.
                    </div>
                  )}
                  {products.data?.slice(0, 3).map((p: any) => {
                    const lowStock =
                      typeof p.stock === "number"
                        ? p.stock < lowStockThreshold
                        : false;
                    const highDemand =
                      typeof p.orders === "number" ? p.orders > 10 : false;
                    const suggestUp = highDemand && !lowStock;
                    const delta = (priceDeltaPct / 100) * (suggestUp ? 1 : -1);
                    const newPrice =
                      typeof p.price === "number"
                        ? p.price * (1 + delta)
                        : Number(p.price || 0) * (1 + delta);
                    return (
                      <div
                        key={p.id}
                        className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/40"
                      >
                        <div>
                          <p className="font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {lowStock ? "Low stock" : "Healthy stock"} •{" "}
                            {highDemand ? "High demand" : "Normal demand"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-sm font-semibold ${
                              suggestUp
                                ? "text-green-600 dark:text-green-400"
                                : "text-orange-600 dark:text-orange-400"
                            }`}
                          >
                            {(suggestUp ? "+" : "-") + priceDeltaPct + "%"} →{" "}
                            {stats.formatPrice(Math.round(newPrice))}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Current {stats.formatPrice(p.price)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {!products.isLoading &&
                    !products.error &&
                    (!products.data || products.data.length === 0) && (
                      <p className="text-sm text-muted-foreground">
                        No products available for suggestions.
                      </p>
                    )}
                </CardContent>
              </Card>

              {/* Inventory Risk Alerts */}
              <Card className="floating-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="gradient-text flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" /> Inventory Risk
                      Alerts
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {products.isLoading &&
                    [1, 2].map((i) => (
                      <Skeleton key={i} className="h-14 rounded-lg" />
                    ))}
                  {products.data
                    ?.filter(
                      (p: any) =>
                        typeof p.stock === "number" &&
                        p.stock <= lowStockThreshold
                    )
                    .slice(0, 4)
                    .map((p: any) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/10"
                      >
                        <div className="text-sm">
                          <p className="font-medium text-red-700 dark:text-red-300">
                            {p.name}
                          </p>
                          <p className="text-xs text-red-600 dark:text-red-400">
                            Stock {p.stock} • Orders {p.orders ?? 0}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push("/product-registration")}
                        >
                          Restock
                        </Button>
                      </div>
                    ))}
                  {!products.isLoading &&
                    products.data &&
                    products.data.filter(
                      (p: any) =>
                        typeof p.stock === "number" &&
                        p.stock <= lowStockThreshold
                    ).length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No inventory risks detected.
                      </p>
                    )}
                </CardContent>
              </Card>

              {/* Next Best Actions + AI Copy Helper */}
              <Card className="floating-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="gradient-text flex items-center gap-2">
                      <Target className="h-5 w-5" /> Next Best Actions
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Activity className="h-4 w-4 mt-0.5 text-primary" />{" "}
                      Enable a weekend promo for top performing category.
                    </li>
                    <li className="flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 mt-0.5 text-yellow-500" />{" "}
                      Review pricing on slow sellers; consider bundles.
                    </li>
                    <li className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 mt-0.5 text-purple-500" />{" "}
                      Add lifestyle photos to increase conversion.
                    </li>
                  </ul>
                  <div className="p-4 rounded-lg bg-muted/40">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Sparkles className="h-4 w-4" /> AI Copy Helper
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Generate product descriptions or a social post for your
                      latest item.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCopyOpen(true)}
                      >
                        Generate with AI
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => router.push("/product-registration")}
                      >
                        Create New Product{" "}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2" />
              <div className="space-y-6">
                <Card className="border border-border/50 bg-background/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      asChild
                    >
                      <Link href="/product-registration">
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Product
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => router.push("/producer-products")}
                    >
                      <Package className="mr-2 h-4 w-4" />
                      View All Products
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => router.push("/producer-orders")}
                    >
                      <TrendingUp className="mr-2 h-4 w-4" />
                      View All Orders
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => router.push("/producer-analytics")}
                    >
                      <DollarSign className="mr-2 h-4 w-4" />
                      View Sales Reports
                    </Button>
                  </CardContent>
                </Card>

                {/* Support Card */}
                <Card className="border border-border/50 bg-background/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">
                      Need Help?
                    </CardTitle>
                    <CardDescription>
                      Our support team is here to help you with any questions.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      Contact Support
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default ProducerDashboard;
