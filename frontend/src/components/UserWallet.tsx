"use client";

import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, API_ENDPOINTS, handleApiError } from "@/config/api";
import { Card, CardContent } from "@/components/custom-ui/card";
import { Button } from "@/components/custom-ui/button";
import { FormInput } from "@/components/custom-ui/form-input";
import { useToast } from "@/hooks/use-toast";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Coins,
} from "lucide-react";

interface WalletInfo {
  id: string;
  balance: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

interface WalletPayment {
  id: string;
  type: "topup" | "debit";
  amount: string;
  currency: string;
  method: string;
  provider?: string;
  phone?: string;
  status: "pending" | "completed" | "failed";
  createdAt: string;
}

// Animated Wallet SVG Component
const AnimatedWalletIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g className="animate-pulse">
      <rect
        x="3"
        y="6"
        width="18"
        height="12"
        rx="2"
        fill="currentColor"
        fillOpacity="0.1"
        stroke="currentColor"
        strokeWidth="2"
        className="animate-[pulse_2s_ease-in-out_infinite]"
      />
      <circle
        cx="17"
        cy="12"
        r="2"
        fill="currentColor"
        className="animate-[bounce_1.5s_ease-in-out_infinite]"
      />
      <path
        d="M7 10h6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="animate-[fadeInOut_3s_ease-in-out_infinite]"
      />
    </g>
  </svg>
);

// Animated Coins SVG Component
const AnimatedCoins = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g>
      <circle
        cx="9"
        cy="12"
        r="3"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="2"
        className="animate-[spin_3s_linear_infinite]"
      />
      <circle
        cx="15"
        cy="12"
        r="3"
        fill="currentColor"
        fillOpacity="0.3"
        stroke="currentColor"
        strokeWidth="2"
        className="animate-[spin_3s_linear_infinite_reverse]"
      />
      <path
        d="M9 10v4M15 10v4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="animate-[pulse_2s_ease-in-out_infinite]"
      />
    </g>
  </svg>
);

export default function UserWallet() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [amount, setAmount] = useState<string>("");
  const [phone, setPhone] = useState<string>("");

  // Prefill phone number from authenticated user profile
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await apiClient.get(API_ENDPOINTS.ME, {
          // ensure we don't spam login modal on public pages
          // but ME requires auth anyway; keep default behavior
        } as any);
        const userPhone = data?.user?.phone || data?.phone;
        if (mounted && userPhone && !phone) {
          setPhone(userPhone);
        }
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const { data: wallet, isLoading: walletLoading } = useQuery<WalletInfo>({
    queryKey: [API_ENDPOINTS.WALLET],
    queryFn: async () => {
      const { data } = await apiClient.get(API_ENDPOINTS.WALLET);
      return data;
    },
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery<
    WalletPayment[]
  >({
    queryKey: [API_ENDPOINTS.WALLET_PAYMENTS],
    queryFn: async () => {
      const { data } = await apiClient.get(API_ENDPOINTS.WALLET_PAYMENTS);
      return data || [];
    },
  });
  const hasPending = (payments || []).some((p) => p.status === "pending");

  const topUpMutation = useMutation({
    mutationFn: async ({
      amount,
      phone,
    }: {
      amount: number;
      phone?: string;
    }) => {
      try {
        const { data } = await apiClient.post(API_ENDPOINTS.OPAY_INITIATE, {
          amount,
          provider: "mtn", // default
          phone,
        });
        return data;
      } catch (error) {
        throw new Error(handleApiError(error));
      }
    },
    onSuccess: (data: any) => {
      const status = data?.payment?.status;
      const url =
        data?.gateway?.body?.url ||
        data?.opay?.body?.url ||
        data?.gateway?.url ||
        data?.opay?.url;
      const reply =
        data?.gateway?.body?.reply || data?.opay?.body?.reply || undefined;
      const successFlag =
        data?.gateway?.body?.success ?? data?.opay?.body?.success;
      const retcode = data?.gateway?.body?.retcode ?? data?.opay?.body?.retcode;
      if (status === "completed") {
        toast({
          title: "✨ Top-up successful",
          description: "Your wallet has been credited!",
        });
      } else {
        // If gateway explicitly returns a failure or no URL, show a helpful message
        if (
          successFlag === 0 ||
          (reply && String(reply).toUpperCase() === "FAILED") ||
          (!url && successFlag !== 1)
        ) {
          toast({
            title: "⚠️ Payment not initiated",
            description:
              typeof retcode !== "undefined"
                ? `Gateway returned code ${retcode}. Please verify your details and try again.`
                : "The gateway could not start your payment. Please verify your phone number and try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "📲 Payment initiated",
            description:
              "We sent a payment request to your phone. Approve it to complete top-up.",
          });
        }
        if (url && typeof window !== "undefined") {
          // Prefer same-tab navigation for better mobile UX
          try {
            window.location.href = url;
          } catch {
            window.open(url, "_blank");
          }
        }
        // Light polling to auto-refresh while waiting for callback
        setTimeout(() => {
          qc.invalidateQueries({ queryKey: [API_ENDPOINTS.WALLET] });
          qc.invalidateQueries({ queryKey: [API_ENDPOINTS.WALLET_PAYMENTS] });
        }, 3000);
        setTimeout(() => {
          qc.invalidateQueries({ queryKey: [API_ENDPOINTS.WALLET] });
          qc.invalidateQueries({ queryKey: [API_ENDPOINTS.WALLET_PAYMENTS] });
        }, 8000);
        setTimeout(() => {
          qc.invalidateQueries({ queryKey: [API_ENDPOINTS.WALLET] });
          qc.invalidateQueries({ queryKey: [API_ENDPOINTS.WALLET_PAYMENTS] });
        }, 15000);
      }
      setAmount("");
      setPhone("");
      qc.invalidateQueries({ queryKey: [API_ENDPOINTS.WALLET] });
      qc.invalidateQueries({ queryKey: [API_ENDPOINTS.WALLET_PAYMENTS] });
    },
    onError: (err: any) => {
      toast({
        title: "💫 Oops!",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleTopUp = () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast({
        title: "🎯 Invalid amount",
        description: "Enter a positive amount to add some magic!",
        variant: "destructive",
      });
      return;
    }
    if (!phone || phone.trim().length < 8) {
      toast({
        title: "📞 Phone required",
        description: "Please enter your mobile number to initiate payment.",
        variant: "destructive",
      });
      return;
    }
    topUpMutation.mutate({ amount: amt, phone: phone.trim() });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-3 w-3 text-emerald-500" />;
      case "pending":
        return <Clock className="h-3 w-3 text-amber-500 animate-spin" />;
      case "failed":
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return <Clock className="h-3 w-3 text-gray-400" />;
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-2 right-4 w-16 h-16 opacity-10">
          <AnimatedCoins className="w-full h-full text-blue-500" />
        </div>
        <div className="absolute bottom-4 left-2 w-12 h-12 opacity-5">
          <Sparkles className="w-full h-full text-purple-500 animate-pulse" />
        </div>
      </div>

      <Card className="relative bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/10 border border-blue-200/50 dark:border-blue-800/30 shadow-lg hover:shadow-xl transition-all duration-500 backdrop-blur-sm">
        <CardContent className="p-3 sm:p-4 md:p-6">
          {/* Header with animated icon */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                <AnimatedWalletIcon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 animate-ping opacity-20"></div>
              </div>
              <div>
                <h3 className="text-sm sm:text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  My Wallet
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                  Digital currency hub
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                {wallet?.status || "Active"}
              </span>
            </div>
          </div>

          {/* Pending Payment Banner */}
          {hasPending && (
            <div className="mb-4 sm:mb-6 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-700/40 flex items-start gap-3">
              <Clock className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-xs sm:text-sm text-amber-800 dark:text-amber-200">
                We’re waiting for your payment confirmation. This can take up to
                a few minutes depending on your provider. This page will
                auto-refresh.
              </div>
            </div>
          )}

          {/* Balance Display with Floating Animation */}
          <div className="relative mb-4 sm:mb-6 p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 dark:from-blue-500/20 dark:via-purple-500/20 dark:to-pink-500/20 border border-blue-200/30 dark:border-blue-700/30 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <div className="space-y-1 sm:space-y-2 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2">
                  <Coins className="h-3 w-3 sm:h-4 sm:w-4 animate-bounce" />
                  Current Balance
                </p>
                <div className="flex items-baseline gap-2">
                  {walletLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 animate-spin"></div>
                      <span className="text-xl sm:text-2xl md:text-4xl font-bold text-gray-400">
                        Loading...
                      </span>
                    </div>
                  ) : (
                    <>
                      <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">
                        RWF {Number(wallet?.balance || 0).toLocaleString()}
                      </span>
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 animate-bounce" />
                    </>
                  )}
                </div>
              </div>
              <div className="relative self-end sm:self-auto">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center animate-pulse">
                  <Wallet className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 animate-ping opacity-20"></div>
              </div>
            </div>
          </div>

          {/* Quick Top-up Actions */}
          <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
            <h4 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 animate-pulse" />
              Quick Actions
            </h4>
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {[5000, 10000, 25000, 50000].map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(quickAmount.toString())}
                  className="relative overflow-hidden group border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-300 hover:scale-105 p-2 sm:p-3 h-auto"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative text-xs sm:text-sm font-medium">
                    {quickAmount / 1000}K
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {/* Top-up Form */}
          <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
            <div className="grid grid-cols-1 gap-3">
              <FormInput
                placeholder="Amount (RWF)"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                icon={Coins}
                className="text-sm transition-all duration-300"
              />
              <FormInput
                placeholder="Mobile Number (required)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                icon={Sparkles}
                className="text-sm transition-all duration-300"
              />
            </div>
            <Button
              onClick={handleTopUp}
              disabled={topUpMutation.isPending || !amount || !phone}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2.5 sm:py-3 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {topUpMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                  <span>Initiating payment...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  <span>Add Funds (OPAY)</span>
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              )}
            </Button>
          </div>

          {/* Recent Transactions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30">
                <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />
              </div>
              <div className="flex items-center gap-3 w-full justify-between">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  Recent Activity
                </h4>
                <a
                  href="/wallet/transactions"
                  className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
                >
                  View all
                </a>
              </div>
            </div>

            {paymentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 animate-spin"></div>
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-gray-400 animate-pulse" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No transactions yet
                </p>
                <p className="text-xs text-gray-400">
                  Your wallet activity will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {payments.slice(0, 5).map((payment, index) => (
                  <div
                    key={payment.id}
                    className="group p-3 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            payment.type === "topup"
                              ? "bg-emerald-100 dark:bg-emerald-900/30"
                              : "bg-red-100 dark:bg-red-900/30"
                          }`}
                        >
                          {payment.type === "topup" ? (
                            <ArrowUpRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <ArrowDownLeft className="h-4 w-4 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            {payment.type === "topup" ? "Top-up" : "Payment"}
                            {getStatusIcon(payment.status)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(payment.createdAt).toLocaleDateString()} •{" "}
                            {payment.provider?.toUpperCase() || payment.method}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-bold ${
                            payment.type === "debit"
                              ? "text-red-600 dark:text-red-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {payment.type === "debit" ? "-" : "+"} RWF{" "}
                          {Number(payment.amount).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
