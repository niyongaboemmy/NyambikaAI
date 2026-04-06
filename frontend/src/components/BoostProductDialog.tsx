"use client";

import React, { useState } from "react";
import { Button } from "@/components/custom-ui/button";
import { Checkbox } from "@/components/custom-ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/custom-ui/alert-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS, apiClient, handleApiError } from "@/config/api";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useUserWalletDialog } from "@/contexts/UserWalletDialogContext";
import {
  Zap,
  Wallet,
  TrendingUp,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Plus,
  RotateCcw,
} from "lucide-react";

export type BoostProductDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
};

export default function BoostProductDialog({
  open,
  onOpenChange,
  productId,
}: BoostProductDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { open: openWallet } = useUserWalletDialog();
  const [confirmChecked, setConfirmChecked] = useState(false);
  const safeProductId =
    productId && String(productId).trim().length > 0 ? String(productId) : null;

  // Load product boost payment setting
  const { data: setting, isLoading: settingLoading } = useQuery<{
    id: number;
    name: string;
    description?: string | null;
    amountInRwf: number;
  }>({
    queryKey: ["payment-settings", "product-boost"],
    queryFn: async () => {
      const res = await apiClient.get(
        API_ENDPOINTS.PAYMENT_SETTINGS_PRODUCT_BOOST
      );
      // Normalize snake_case -> camelCase if needed
      const s = res.data || {};
      const amountInRwf =
        typeof s.amountInRwf === "number" ? s.amountInRwf : s.amount_in_rwf;
      return { ...s, amountInRwf } as any;
    },
    enabled: open,
    staleTime: 60_000,
  });

  // Load wallet balance
  const {
    data: wallet,
    refetch: refetchWallet,
    isFetching: walletFetching,
  } = useQuery<{ id: string; balance: string } | null>({
    queryKey: ["wallet"],
    queryFn: async () => {
      try {
        const res = await apiClient.get(API_ENDPOINTS.WALLET);
        const data = res?.data as any;
        if (!data || typeof data.balance === "undefined") {
          return { id: "", balance: "0" };
        }
        return data;
      } catch (error) {
        // Never return undefined to avoid TanStack Query error
        return { id: "", balance: "0" };
      }
    },
    enabled: open,
    staleTime: 30_000,
  });

  // Boost call
  const boostMutation = useMutation({
    mutationFn: async () => {
      if (!safeProductId) {
        throw new Error("Missing product id for boost.");
      }
      const res = await apiClient.post(
        API_ENDPOINTS.PRODUCT_BOOST(safeProductId)
      );
      return res.data as any;
    },
    onSuccess: () => {
      setConfirmChecked(false);
      onOpenChange(false);
      // Broadly invalidate products-related queries (home feed, store, product lists)
      queryClient.invalidateQueries({
        predicate: (q) => {
          const key = q.queryKey as any[];
          if (!Array.isArray(key) || key.length === 0) return false;
          const root = String(key[0] || "");
          return (
            root.includes("products") ||
            root.includes("infinite-products") ||
            root.includes("company-products") ||
            root === "companies"
          );
        },
      });
      // Refresh wallet after debit
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      // Next.js app router refresh (helps server components/pages revalidate)
      try {
        router.refresh();
      } catch {}
      toast({ title: "Boosted", description: "Product boosted successfully." });
    },
    onError: (e: any) => {
      const msg = handleApiError(e);
      try {
        const data = e?.response?.data;
        if (e?.response?.status === 402 && data?.required != null) {
          toast({
            title: "Insufficient balance",
            description: `Required: RF ${Number(
              data.required
            ).toLocaleString()} | Your balance: RF ${Number(
              data.balance || 0
            ).toLocaleString()}`,
            variant: "destructive",
          });
          return;
        }
      } catch {}
      toast({
        title: "Boost failed",
        description: msg,
        variant: "destructive",
      });
    },
  });

  const fee = setting?.amountInRwf ?? undefined;
  const balance = Number(wallet?.balance || 0);
  const hasInsufficientBalance = Boolean(
    wallet && setting && balance < setting.amountInRwf
  );

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setConfirmChecked(false);
      }}
    >
      <AlertDialogContent className="sm:max-w-[450px] overflow-hidden border-0 bg-gradient-to-br from-white via-blue-50/30 to-blue-50/30 dark:from-gray-900 dark:via-blue-950/30 dark:to-blue-950/30 backdrop-blur-xl shadow-2xl">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-blue-400/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-gradient-to-tr from-blue-400/20 to-blue-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        </div>

        <AlertDialogHeader className="relative z-10 text-center space-y-3">
          {/* Cute Animated SVG - Trophy/Medal for "going first" */}
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
            <svg
              className="w-7 h-7 text-white animate-pulse"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              <circle
                cx="12"
                cy="12"
                r="1"
                className="animate-ping"
                fill="white"
                opacity="0.8"
              />
            </svg>
          </div>

          <AlertDialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Go First & Stand Out
          </AlertDialogTitle>

          <AlertDialogDescription asChild className="text-base leading-relaxed">
            <div>
              {settingLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                  <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce delay-200"></div>
                  <span className="ml-2">Loading boost settings...</span>
                </div>
              ) : !setting ? (
                <div className="flex items-center justify-center space-x-2 text-red-500">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Could not load boost settings. Please try again.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Compact benefits with inline display */}
                  <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg p-3 border border-blue-200/30 dark:border-blue-700/30">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-blue-700 dark:text-blue-300 text-sm">
                        Get Priority Placement
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-300">
                      <span className="flex items-center space-x-1">
                        <Sparkles className="w-2.5 h-2.5 text-blue-500" />
                        <span>Top of search</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Sparkles className="w-2.5 h-2.5 text-blue-500" />
                        <span>Featured spot</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Sparkles className="w-2.5 h-2.5 text-blue-500" />
                        <span>More views</span>
                      </span>
                    </div>
                  </div>

                  {/* Compact cost and balance in one row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-r from-blue-500/10 to-blue-500/10 rounded-lg p-3 border border-blue-200/30 dark:border-blue-700/30">
                      <div className="flex items-center space-x-2 mb-1">
                        <Zap className="w-4 h-4 text-blue-500" />
                        <span className="font-semibold text-sm">Cost</span>
                      </div>
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        RF {setting.amountInRwf.toLocaleString()}
                      </div>
                    </div>

                    {wallet && (
                      <div
                        className={`bg-gradient-to-r rounded-lg p-3 border transition-all duration-300 ${
                          hasInsufficientBalance
                            ? "from-red-500/10 to-cyan-500/10 border-red-200/30 dark:border-red-700/30"
                            : "from-blue-500/10 to-blue-500/10 border-blue-200/30 dark:border-blue-700/30"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <Wallet
                              className={`w-4 h-4 ${
                                hasInsufficientBalance
                                  ? "text-red-500"
                                  : "text-blue-500"
                              }`}
                            />
                            <span className="font-semibold text-sm">
                              Balance
                            </span>
                          </div>
                          <button
                            type="button"
                            aria-label="Reload balance"
                            onClick={(e) => {
                              e.stopPropagation();
                              refetchWallet();
                            }}
                            className="p-1 rounded-md hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
                          >
                            <RotateCcw
                              className={`w-4 h-4 ${
                                walletFetching ? "animate-spin" : ""
                              }`}
                            />
                          </button>
                        </div>
                        <div
                          className={`text-lg font-bold ${
                            hasInsufficientBalance
                              ? "text-red-600 dark:text-red-400"
                              : "text-blue-600 dark:text-blue-400"
                          }`}
                        >
                          RF {Number(wallet.balance).toLocaleString()}
                        </div>
                        {hasInsufficientBalance && (
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center space-x-1 text-red-500 text-xs animate-pulse">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Insufficient balance</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openWallet();
                              }}
                              className="flex items-center space-x-1 text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded-md transition-all duration-200 hover:scale-105 shadow-sm"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Funds</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Competitive boosting note */}
                  <div className="mt-2 flex items-start gap-2 rounded-lg p-3 bg-amber-50 border border-amber-200/50 dark:bg-amber-950/30 dark:border-amber-700/30">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                    <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-200">
                      <span className="font-semibold">Note:</span> Boosting is
                      competitive. Others can overtake you. Check and boost
                      regularly to stay on top.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {setting && (
          <div className="relative z-10 mt-0">
            <div
              className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer select-none ${
                confirmChecked
                  ? "bg-gradient-to-r from-blue-50 to-blue-50 dark:from-blue-950/50 dark:to-blue-950/50 border-blue-300 dark:border-blue-600 shadow-lg shadow-blue-200/50 dark:shadow-blue-900/30"
                  : "bg-gradient-to-r from-blue-50/80 to-cyan-50/80 dark:from-blue-950/40 dark:to-cyan-950/40 border-blue-300 dark:border-blue-600 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg hover:shadow-blue-200/50 dark:hover:shadow-blue-900/30 hover:scale-[1.02]"
              }`}
              onClick={(e) => {
                e.preventDefault();
                setConfirmChecked(!confirmChecked);
              }}
            >
              <div className="relative">
                <Checkbox
                  id="confirm-boost"
                  checked={confirmChecked}
                  onCheckedChange={(checked) =>
                    setConfirmChecked(checked === true)
                  }
                  className={`data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-blue-500 border-2 w-5 h-5 ${
                    confirmChecked
                      ? "animate-pulse border-blue-500"
                      : "border-blue-600"
                  }`}
                />
                {!confirmChecked && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
                )}
              </div>
              <div className="text-sm font-semibold cursor-pointer flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle
                      className={`w-5 h-5 transition-all duration-300 ${
                        confirmChecked
                          ? "text-blue-500 scale-110 animate-pulse"
                          : "text-blue-500"
                      }`}
                    />
                    <span
                      className={
                        confirmChecked
                          ? "text-blue-700 dark:text-blue-300"
                          : "text-blue-700 dark:text-blue-300"
                      }
                    >
                      {confirmChecked
                        ? "✓ Ready to go first!"
                        : "Click to confirm boost"}
                    </span>
                  </div>
                  {!confirmChecked && (
                    <div className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400">
                      <span>👆</span>
                      <span>Click here</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <AlertDialogFooter className="relative z-10 mt-4 space-x-3">
          <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 border-0 transition-all duration-300 hover:scale-105">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              onClick={() => boostMutation.mutate()}
              disabled={
                !safeProductId ||
                !setting ||
                !confirmChecked ||
                boostMutation.isPending ||
                hasInsufficientBalance
              }
              className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white border-0 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-w-[120px]"
            >
              {boostMutation.isPending ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Boosting...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                  <span>Go First</span>
                </div>
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
