"use client";

import React, { useEffect, useRef, useState } from "react";
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

interface UserWalletProps {
  isMobile?: boolean;
}

export default function UserWallet({ isMobile = false }: UserWalletProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [amount, setAmount] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [pollingRefId, setPollingRefId] = useState<string | null>(null);
  const [activePayment, setActivePayment] = useState<{
    refId: string | null;
    status: string;
    amount: number;
  }>({ refId: null, status: "idle", amount: 0 });
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

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
      const redirectUrl =
        data?.redirectUrl ||
        data?.gateway?.body?.url ||
        data?.opay?.body?.url ||
        data?.gateway?.url ||
        data?.opay?.url;
      const mode = data?.mode;
      const refid =
        data?.refid || data?.payment?.externalReference || data?.payment?.refid;
      const reply =
        data?.gateway?.body?.reply || data?.opay?.body?.reply || undefined;
      const successFlag =
        data?.gateway?.body?.success ?? data?.opay?.body?.success;
      const retcode = data?.gateway?.body?.retcode ?? data?.opay?.body?.retcode;
      if (status === "completed") {
        toast({
          title: "🎉 Top-up Successful!",
          description: (
            <div className="space-y-2">
              <p className="font-medium">RWF {Number(amount).toLocaleString()} has been added to your wallet!</p>
              <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                <CheckCircle className="h-4 w-4" />
                <span>Your balance has been updated</span>
              </div>
            </div>
          ),
          className: "border-2 border-emerald-500/20 bg-emerald-50 dark:bg-emerald-950/50 backdrop-blur-sm",
          duration: 10000, // Show for 10 seconds
        });
        setActivePayment({ refId: null, status: "completed", amount: 0 });
      } else {
        // Set active payment for tracking
        if (refid) {
          setActivePayment({
            refId: refid,
            status: "pending",
            amount: Number(amount),
          });
        }

        // Show appropriate toast message
        if (
          successFlag === 0 ||
          (reply && String(reply).toUpperCase() === "FAILED")
        ) {
          toast({
            title: "⚠️ Payment not initiated",
            description:
              typeof retcode !== "undefined"
                ? `Gateway returned code ${retcode}. Please verify your details and try again.`
                : "The gateway could not start your payment. Please verify your phone number and try again.",
            variant: "destructive",
          });
          setActivePayment({ refId: null, status: "failed", amount: 0 });
        } else {
          const description =
            mode === "push"
              ? "We sent a payment request to your phone. Approve it to complete top-up."
              : "Please complete the payment on the next screen.";

          toast({
            title: "📲 Payment initiated",
            description: description,
          });
        }

        // Start polling for payment status
        if (refid) {
          setPollingRefId(refid);

          // Initial quick check after 3 seconds
          setTimeout(() => {
            qc.invalidateQueries({ queryKey: [API_ENDPOINTS.WALLET] });
            qc.invalidateQueries({ queryKey: [API_ENDPOINTS.WALLET_PAYMENTS] });
          }, 3000);

          // Secondary check after 8 seconds
          setTimeout(() => {
            qc.invalidateQueries({ queryKey: [API_ENDPOINTS.WALLET] });
            qc.invalidateQueries({ queryKey: [API_ENDPOINTS.WALLET_PAYMENTS] });
          }, 8000);

          // Final check after 15 seconds
          setTimeout(() => {
            qc.invalidateQueries({ queryKey: [API_ENDPOINTS.WALLET] });
            qc.invalidateQueries({ queryKey: [API_ENDPOINTS.WALLET_PAYMENTS] });
          }, 15000);
        }
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

  // Poll payment status until completion or timeout
  useEffect(() => {
    if (!pollingRefId) return;

    // Avoid multiple timers
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current as any);
      pollingTimerRef.current = null;
    }

    let attempts = 0;
    const maxAttempts = 36; // 3 minutes at 5s interval

    const checkStatus = async () => {
      if (!pollingRefId) return;
      attempts += 1;

      try {
        const { data } = await apiClient.post(API_ENDPOINTS.OPAY_CHECKSTATUS, {
          refid: pollingRefId,
        });

        const status = data?.status;

        if (status && status !== "pending") {
          // Payment completed or failed
          clearInterval(interval);
          pollingTimerRef.current = null;
          setPollingRefId(null);

          if (status === "completed") {
            setActivePayment((prev) => ({
              ...prev,
              refId: null,
            }));

            toast({
              title: "❌ Payment failed",
              description: "The payment was not approved. Please try again.",
              variant: "destructive",
            });
          }

          // Refresh wallet data
          qc.invalidateQueries({ queryKey: [API_ENDPOINTS.WALLET] });
          qc.invalidateQueries({ queryKey: [API_ENDPOINTS.WALLET_PAYMENTS] });
        } else if (attempts >= maxAttempts) {
          // Timeout reached
          clearInterval(interval);
          pollingTimerRef.current = null;
          setPollingRefId(null);
          setActivePayment((prev) => ({
            ...prev,
            status: "timeout",
          }));

          toast({
            title: "⏳ Still processing",
            description:
              "We're still processing your payment. The status will update automatically.",
          });
        }
      } catch (e: any) {
        console.error("Status check error:", e);

        // Don't stop on network errors, just log them
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          pollingTimerRef.current = null;
          setPollingRefId(null);
          setActivePayment((prev) => ({
            ...prev,
            status: "error",
          }));
        }
      }
    };

    // Initial check
    checkStatus();

    // Then check every 5 seconds
    const interval = setInterval(checkStatus, 5000);
    pollingTimerRef.current = interval as any;

    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current as any);
        pollingTimerRef.current = null;
      }
    };
  }, [pollingRefId]);

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

    // Reset any existing payment state
    setActivePayment({
      refId: null,
      status: "processing",
      amount: amt,
    });

    // Initiate payment
    topUpMutation.mutate({ amount: amt, phone: phone.trim() });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-3 w-3 text-emerald-500" />;
      case "pending":
      case "processing":
        return <Clock className="h-3 w-3 text-amber-500 animate-spin" />;
      case "failed":
      case "error":
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      case "timeout":
        return <Clock className="h-3 w-3 text-amber-300" />;
      default:
        return <Clock className="h-3 w-3 text-gray-400" />;
    }
  };

  // Get payment status message
  const getPaymentStatusMessage = () => {
    if (!activePayment.refId) return null;

    const messages = {
      processing: {
        title: "Processing Payment",
        description: "We're setting up your payment. Please wait...",
        icon: <Clock className="h-5 w-5 text-amber-500 animate-spin" />,
      },
      pending: {
        title: "Awaiting Confirmation",
        description:
          "Please complete the payment on your phone. This may take a moment...",
        icon: <Clock className="h-5 w-5 text-amber-500 animate-pulse" />,
      },
      completed: {
        title: "Payment Successful!",
        description: `RWF ${activePayment.amount} has been added to your wallet.`,
        icon: <CheckCircle className="h-5 w-5 text-emerald-500" />,
      },
      failed: {
        title: "Payment Failed",
        description: "We couldn't process your payment. Please try again.",
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      },
      timeout: {
        title: "Taking Longer Than Expected",
        description:
          "Your payment is still being processed. We'll update the status automatically.",
        icon: <Clock className="h-5 w-5 text-amber-300" />,
      },
      error: {
        title: "Connection Issue",
        description:
          "Having trouble checking payment status. Please check back in a moment.",
        icon: <AlertCircle className="h-5 w-5 text-red-400" />,
      },
    };

    return messages[activePayment.status as keyof typeof messages] || null;
  };

  const paymentStatus = getPaymentStatusMessage();

  return (
    <div
      className={`relative overflow-hidden ${
        isMobile
          ? "min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/10"
          : ""
      }`}
    >
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute ${
            isMobile ? "top-20 right-4" : "top-2 right-4"
          } w-16 h-16 opacity-10`}
        >
          <AnimatedCoins className="w-full h-full text-blue-500" />
        </div>
        <div className="absolute bottom-4 left-2 w-12 h-12 opacity-5">
          <Sparkles className="w-full h-full text-purple-500 animate-pulse" />
        </div>
        {/* Mobile-specific floating elements */}
        {isMobile && (
          <>
            <div className="absolute top-32 left-4 w-8 h-8 opacity-20">
              <div className="w-full h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse" />
            </div>
            <div className="absolute top-1/2 right-8 w-6 h-6 opacity-15">
              <div className="w-full h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-bounce" />
            </div>
          </>
        )}
      </div>

      <Card
        className={`relative bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/10 ${
          isMobile
            ? "border-0 shadow-none rounded-none bg-transparent"
            : "border border-blue-200/50 dark:border-blue-800/30 shadow-lg hover:shadow-xl"
        } transition-all duration-500 backdrop-blur-sm`}
      >
        <CardContent className={isMobile ? "p-4 pb-8" : "p-3 sm:p-4 md:p-6"}>
          {/* Header with animated icon - Hidden on mobile since it's in the header bar */}
          {!isMobile && (
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
          )}

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
          <div
            className={`relative mb-4 sm:mb-6 p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 dark:from-blue-500/20 dark:via-purple-500/20 dark:to-pink-500/20 border border-blue-200/30 dark:border-blue-700/30 backdrop-blur-sm ${
              isMobile ? "mx-2 mt-2" : ""
            }`}
          >
            {/* Mobile status indicator */}
            {isMobile && (
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    {wallet?.status || "Active"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="h-3 w-3" />
                  <span>Real-time sync</span>
                </div>
              </div>
            )}

            <div
              className={`flex ${
                isMobile ? "flex-col" : "flex-col sm:flex-row"
              } items-start sm:items-center justify-between gap-3 sm:gap-0`}
            >
              <div className="space-y-1 sm:space-y-2 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2">
                  <Coins className="h-3 w-3 sm:h-4 sm:w-4 animate-bounce" />
                  Current Balance
                </p>
                <div className="flex items-baseline gap-2">
                  {walletLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 animate-spin"></div>
                      <span
                        className={`${
                          isMobile
                            ? "text-2xl"
                            : "text-xl sm:text-2xl md:text-4xl"
                        } font-bold text-gray-400`}
                      >
                        Loading...
                      </span>
                    </div>
                  ) : (
                    <>
                      <span
                        className={`${
                          isMobile
                            ? "text-3xl"
                            : "text-xl sm:text-2xl md:text-3xl lg:text-4xl"
                        } font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse`}
                      >
                        RWF {Number(wallet?.balance || 0).toLocaleString()}
                      </span>
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 animate-bounce" />
                    </>
                  )}
                </div>
              </div>
              <div
                className={`relative ${
                  isMobile ? "self-center mt-2" : "self-end sm:self-auto"
                }`}
              >
                <div
                  className={`${
                    isMobile ? "w-16 h-16" : "w-12 h-12 sm:w-16 sm:h-16"
                  } rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center animate-pulse`}
                >
                  <Wallet
                    className={`${
                      isMobile ? "h-8 w-8" : "h-6 w-6 sm:h-8 sm:w-8"
                    } text-white`}
                  />
                </div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 animate-ping opacity-20"></div>
              </div>
            </div>
          </div>

          {/* Quick Top-up Actions */}
          <div
            className={`mb-4 sm:mb-6 space-y-3 sm:space-y-4 ${
              isMobile ? "mx-2" : ""
            }`}
          >
            <h4 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 animate-pulse" />
              Quick Actions
            </h4>
            <div
              className={`grid ${
                isMobile ? "grid-cols-2" : "grid-cols-4"
              } gap-2 sm:gap-3`}
            >
              {[5000, 10000, 25000, 50000].map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(quickAmount.toString())}
                  className={`relative overflow-hidden group border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-300 hover:scale-105 ${
                    isMobile
                      ? "p-4 h-auto flex flex-col gap-1"
                      : "p-2 sm:p-3 h-auto"
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  {isMobile ? (
                    <>
                      <span className="relative text-lg font-bold">
                        {quickAmount / 1000}K
                      </span>
                      <span className="relative text-xs text-gray-500 dark:text-gray-400">
                        RWF {quickAmount.toLocaleString()}
                      </span>
                    </>
                  ) : (
                    <span className="relative text-xs sm:text-sm font-medium">
                      {quickAmount / 1000}K
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Payment Status Banner */}
          {paymentStatus && (
            <div
              className={`mb-4 sm:mb-6 mx-2 sm:mx-0 p-4 rounded-xl ${
                activePayment.status === "completed"
                  ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50"
                  : activePayment.status === "failed" ||
                    activePayment.status === "error"
                  ? "bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50"
                  : "bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">{paymentStatus.icon}</div>
                <div>
                  <h4 className="font-medium text-sm sm:text-base">
                    {paymentStatus.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {paymentStatus.description}
                  </p>

                  {(activePayment.status === "pending" ||
                    activePayment.status === "processing") && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 bg-white dark:bg-gray-800 rounded-full flex-1 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse w-1/2"></div>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Processing...
                      </span>
                    </div>
                  )}

                  {activePayment.status === "failed" && (
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActivePayment({
                            refId: null,
                            status: "idle",
                            amount: 0,
                          });
                          setAmount("");
                          setPhone("");
                        }}
                        className="text-xs h-8"
                      >
                        Try Again
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Top-up Form */}
          <div
            className={`space-y-3 sm:space-y-4 mb-4 sm:mb-6 ${
              isMobile ? "mx-2" : ""
            } ${
              activePayment.status === "processing" ||
              activePayment.status === "pending"
                ? "opacity-50 pointer-events-none"
                : ""
            }`}
          >
            <div className="grid grid-cols-1 gap-3">
              <FormInput
                placeholder="Amount (RWF)"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`transition-all duration-300 ${
                  isMobile ? "text-base py-3 px-4" : "text-sm"
                }`}
              />
              <FormInput
                placeholder="Mobile Number (required)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`transition-all duration-300 ${
                  isMobile ? "text-base py-3 px-4" : "text-sm"
                }`}
              />
            </div>
            <Button
              onClick={handleTopUp}
              disabled={
                topUpMutation.isPending ||
                !amount ||
                !phone ||
                activePayment.status === "processing" ||
                activePayment.status === "pending"
              }
              className={`w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                isMobile
                  ? "py-4 text-base"
                  : "py-2.5 sm:py-3 text-sm sm:text-base"
              } ${
                activePayment.status === "processing" ||
                activePayment.status === "pending"
                  ? "animate-pulse"
                  : ""
              }`}
            >
              {activePayment.status === "processing" ||
              activePayment.status === "pending" ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                  <span>Processing Payment...</span>
                </div>
              ) : topUpMutation.isPending ? (
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
          <div className={`space-y-3 ${isMobile ? "mx-2 pb-4" : ""}`}>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30">
                <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />
              </div>
              <div className="flex items-center gap-3 w-full justify-between">
                <h4
                  className={`font-semibold text-gray-900 dark:text-gray-100 ${
                    isMobile ? "text-base" : ""
                  }`}
                >
                  Recent Activity
                </h4>
                <a
                  href="/wallet/transactions"
                  className={`text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline ${
                    isMobile ? "text-sm" : "text-xs sm:text-sm"
                  }`}
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
                {payments.slice(0, isMobile ? 3 : 5).map((payment, index) => (
                  <div
                    key={payment.id}
                    className={`group rounded-xl bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 hover:scale-[1.02] hover:shadow-md ${
                      isMobile ? "p-4" : "p-3"
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div
                      className={`flex items-center justify-between ${
                        isMobile ? "flex-col gap-3" : ""
                      }`}
                    >
                      <div
                        className={`flex items-center gap-3 ${
                          isMobile ? "w-full" : ""
                        }`}
                      >
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
                        <div className="flex-1">
                          <p
                            className={`font-medium text-gray-900 dark:text-white flex items-center gap-2 ${
                              isMobile ? "text-base" : "text-sm"
                            }`}
                          >
                            {payment.type === "topup" ? "Top-up" : "Payment"}
                            {getStatusIcon(payment.status)}
                          </p>
                          <p
                            className={`text-gray-500 dark:text-gray-400 ${
                              isMobile ? "text-sm" : "text-xs"
                            }`}
                          >
                            {new Date(payment.createdAt).toLocaleDateString()} •{" "}
                            {payment.provider?.toUpperCase() || payment.method}
                          </p>
                        </div>
                        {isMobile && (
                          <div className="text-right">
                            <p
                              className={`text-base font-bold ${
                                payment.type === "debit"
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              {payment.type === "debit" ? "-" : "+"} RWF{" "}
                              {Number(payment.amount).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                      {!isMobile && (
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
                      )}
                    </div>
                  </div>
                ))}

                {/* Mobile View All Button */}
                {isMobile && payments.length > 3 && (
                  <div className="pt-2">
                    <a
                      href="/wallet/transactions"
                      className="block w-full text-center py-3 px-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200/50 dark:border-blue-700/50 rounded-xl text-blue-600 dark:text-blue-400 font-medium hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 transition-all duration-300"
                    >
                      View All Transactions ({payments.length})
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mobile bottom padding for safe area */}
      {isMobile && <div className="h-8" />}
    </div>
  );
}
