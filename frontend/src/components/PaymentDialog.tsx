"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/custom-ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/custom-ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/custom-ui/tabs";
import { Input } from "@/components/custom-ui/input";
import { Label } from "@/components/custom-ui/label";
import apiClient from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import {
  Wallet,
  Smartphone,
  AlertCircle,
  Zap,
  ExternalLink,
  Copy,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import { useUserWalletDialog } from "@/contexts/UserWalletDialogContext";

export type PaymentMethodKind = "momo" | "wallet";

export interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number; // RWF
  title?: string; // Dynamic title based on service being paid
  description?: string;
  // Optional prefilled phone
  phone?: string;
  defaultMethod?: PaymentMethodKind;
  onSuccess: (args: {
    method: PaymentMethodKind;
    reference: string | null;
    meta?: any;
  }) => void;
  onError?: (error: any) => void;
  // Optional: subscription metadata for backend auto-activation via callback
  subscription?: {
    planId: string;
    billingCycle: "monthly" | "annual";
    targetProducerUserId?: string;
  };
}

export default function PaymentDialog(props: PaymentDialogProps) {
  const { toast } = useToast();
  const { open: openWalletDialog } = useUserWalletDialog();
  const {
    open,
    onOpenChange,
    amount,
    title,
    description,
    phone,
    defaultMethod = "momo",
    onSuccess,
    onError,
    subscription,
  } = props;
  const [active, setActive] = useState<PaymentMethodKind>(defaultMethod);
  const [submitting, setSubmitting] = useState(false);
  const [momoPhone, setMomoPhone] = useState<string>(phone || "");
  const [wallet, setWallet] = useState<{ balance: number } | null>(null);
  const [awaiting, setAwaiting] = useState<{
    refid: string | null;
    kind: "momo" | "topup";
  } | null>(null);
  const [polling, setPolling] = useState(false);
  const [errors, setErrors] = useState<{
    momo?: string;
    wallet?: string;
    general?: string;
    details?: any;
  }>({});
  const [walletInsufficient, setWalletInsufficient] = useState<{
    required: number;
    balance: number;
    shortfall: number;
  } | null>(null);

  useEffect(() => {
    setActive(defaultMethod);
  }, [defaultMethod]);

  useEffect(() => {
    if (!open) return;
    // Load wallet on open for the wallet tab
    apiClient
      .get("/api/wallet")
      .then((res) => {
        const b = Number(res.data?.balance) || 0;
        setWallet({ balance: b });
      })
      .catch(() => setWallet(null));
  }, [open]);

  const disabled = useMemo(
    () => submitting || amount <= 0,
    [submitting, amount]
  );

  // Check if wallet payment should be disabled due to insufficient balance
  const walletDisabled = useMemo(() => {
    if (!wallet) return true;
    return disabled || wallet.balance < amount;
  }, [disabled, wallet, amount]);

  const handleClose = () => onOpenChange(false);

  const payWithWallet = async () => {
    try {
      setSubmitting(true);
      setErrors((prev) => ({ ...prev, wallet: undefined }));
      setWalletInsufficient(null);
      const resp = await apiClient.post("/api/payments/wallet/charge", {
        amount,
        description: description || "Wallet charge",
        metadata: { kind: "generic" },
      });
      onSuccess({
        method: "wallet",
        reference: resp.data?.payment?.externalReference || null,
        meta: resp.data,
      });
      toast({
        title: "Payment successful",
        description: `Paid ${amount.toLocaleString()} RWF from wallet`,
      });
      handleClose();
    } catch (error: any) {
      const status = error?.response?.status;
      const data = error?.response?.data || {};
      const msg = data?.message || error?.message || "Wallet payment failed";
      if (
        status === 402 &&
        data?.message &&
        /insufficient/i.test(data.message)
      ) {
        const required = Number(data.required || amount) || amount;
        const balance = Number(data.balance || (wallet?.balance ?? 0)) || 0;
        const shortfall = Math.max(0, required - balance);
        setWalletInsufficient({ required, balance, shortfall });
        toast({
          title: "Insufficient balance",
          description: `You need ${shortfall.toLocaleString()} RWF more to complete this payment.`,
          variant: "destructive",
        });
      } else {
        setErrors((prev) => ({
          ...prev,
          wallet: msg,
          details: error?.response?.data,
        }));
        toast({
          title: "Payment failed",
          description: msg,
          variant: "destructive",
        });
      }
      onError?.(error);
    } finally {
      setSubmitting(false);
    }
  };

  const mapGatewayError = (err: any): string => {
    const status = err?.response?.status;
    const data = err?.response?.data || {};
    const msg = data?.message || err?.message || "Payment failed";
    const ret = data?.gateway?.retcode ?? data?.retcode;
    const code = String(ret || "");

    // Handle specific HTTP status codes
    if (status === 400) {
      return (
        data?.message ||
        "Invalid payment request. Please check your details and try again."
      );
    }
    if (status === 401) {
      return "Authentication required. Please sign in and try again.";
    }
    if (status === 403) {
      return "Payment not authorized. Please check your permissions.";
    }
    if (status === 429) {
      return "Too many payment attempts. Please wait a moment and try again.";
    }
    if (status === 500) {
      return "Payment service temporarily unavailable. Please try again later.";
    }

    // Handle gateway-specific error codes
    switch (code) {
      case "600":
        return "Payment provider is temporarily unavailable. Please try again or contact support.";
      case "607":
        return "Mobile Money transaction failed. Please verify your number and balance.";
      case "603":
        return "Missing required details. Please try again.";
      case "608":
        return "Transaction timeout. Please try again.";
      case "609":
        return "Insufficient funds in your mobile money account.";
      default:
        return msg;
    }
  };

  const refreshWallet = async () => {
    try {
      const w = await apiClient.get("/api/wallet");
      const bal = Number(
        w?.data?.balance ||
          w?.data?.wallet?.balance ||
          w?.data?.wallet?.wallet?.balance ||
          0
      );
      setWallet({ balance: bal });
    } catch (_) {}
  };

  const startPollingStatus = async (
    refid: string,
    opts?: { kind?: "momo" | "topup"; onApproved?: () => Promise<void> }
  ) => {
    setPolling(true);
    const deadline = Date.now() + 90_000; // 90s
    try {
      while (Date.now() < deadline) {
        try {
          const resp = await apiClient.post(
            "/api/payments/opay/checkstatus-public",
            { refid }
          );
          const gw = resp.data?.gateway || resp.data;
          const sid = String(gw?.statusid || gw?.statusId || "");
          if (sid === "01") {
            toast({
              title: "Payment approved",
              description: "Your payment was completed.",
            });
            if (opts?.kind === "topup") {
              // Refresh wallet then run any callback
              await refreshWallet();
              if (opts?.onApproved) await opts.onApproved();
            } else {
              // Fire success now that payment is approved
              onSuccess({ method: "momo", reference: refid, meta: gw });
              handleClose();
            }
            break;
          }
          if (sid === "02") {
            toast({
              title: "Payment failed",
              description: "The transaction failed.",
              variant: "destructive",
            });
            break;
          }
        } catch (_) {
          // ignore transient
        }
        await new Promise((r) => setTimeout(r, 4000));
      }
    } finally {
      setPolling(false);
    }
  };

  const payWithMomo = async () => {
    if (!momoPhone || momoPhone.replace(/\D/g, "").length < 9) {
      toast({
        title: "Invalid phone",
        description: "Enter a valid phone number",
        variant: "destructive",
      });
      return;
    }
    try {
      setSubmitting(true);
      setErrors((prev) => ({ ...prev, momo: undefined }));
      const resp = await apiClient.post("/api/payments/opay/pay", {
        amount,
        phone: momoPhone,
        details: description || "payment",
        pmethod: "momo",
        ...(subscription
          ? {
              subscriptionPlanId: subscription.planId,
              billingCycle: subscription.billingCycle,
              targetProducerUserId: subscription.targetProducerUserId,
            }
          : {}),
      });
      const data = resp.data || {};
      const redirectUrl = data.redirectUrl as string | null;
      const refid = data.refid as string | null;

      // If redirect url provided, open it in new tab to complete checkout
      if (redirectUrl) {
        window.open(redirectUrl, "_blank", "noopener,noreferrer");
      }
      // Show awaiting indicator while waiting for approval
      setAwaiting({ refid: refid || null, kind: "momo" });
      // Do not call onSuccess yet; will be triggered on approval via polling
      toast({
        title: "Payment initiated",
        description: redirectUrl
          ? "Complete payment in the opened page"
          : "Check your phone to approve the payment",
      });
      toast({
        title: "We’ll notify you",
        description: "This dialog will update once the payment is approved.",
      });
      if (refid) startPollingStatus(refid, { kind: "momo" });
    } catch (error: any) {
      console.error("PayWithMomo Error:", error);
      const msg = mapGatewayError(error);
      toast({
        title: "Payment failed",
        description: msg,
        variant: "destructive",
      });
      onError?.(error);
      setErrors((prev) => ({
        ...prev,
        momo: msg,
        details: {
          status: error?.response?.status,
          statusText: error?.response?.statusText,
          data: error?.response?.data,
          message: error?.message,
          code: error?.code,
        },
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const initiateWalletTopup = async (topupAmount: number) => {
    if (!momoPhone || momoPhone.replace(/\D/g, "").length < 9) {
      toast({
        title: "Phone needed",
        description: "Enter a valid phone to top up via MoMo",
        variant: "destructive",
      });
      return;
    }
    try {
      setSubmitting(true);
      const resp = await apiClient.post("/api/payments/opay/initiate", {
        amount: topupAmount,
        phone: momoPhone,
        details: "wallet_topup",
        pmethod: "momo",
      });
      const data = resp.data || {};
      const redirectUrl = data.redirectUrl as string | null;
      const refid = data.refid as string | null;
      if (redirectUrl)
        window.open(redirectUrl, "_blank", "noopener,noreferrer");
      setAwaiting({ refid: refid || null, kind: "topup" });
      toast({
        title: "Top-up initiated",
        description: redirectUrl
          ? "Complete top-up in the opened page"
          : "Approve top-up on your phone",
      });
      if (refid)
        await startPollingStatus(refid, {
          kind: "topup",
          onApproved: async () => {
            toast({
              title: "Top-up completed",
              description: "Retrying wallet payment now...",
            });
            setWalletInsufficient(null);
            await payWithWallet();
          },
        });
    } catch (error: any) {
      console.error("WalletTopup Error:", error);
      const msg = mapGatewayError(error);
      toast({
        title: "Top-up failed",
        description: msg,
        variant: "destructive",
      });
      onError?.(error);
      setErrors((prev) => ({
        ...prev,
        wallet: msg,
        details: {
          status: error?.response?.status,
          statusText: error?.response?.statusText,
          data: error?.response?.data,
          message: error?.message,
          code: error?.code,
        },
      }));
    } finally {
      setSubmitting(false);
    }
  };

  // Payment-related SVG components
  const CreditCardSVG = ({ className = "w-6 h-6" }: { className?: string }) => (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      initial={{ scale: 0.8 }}
      animate={{ scale: [0.8, 1.1, 1] }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <motion.rect
        x="2"
        y="4"
        width="20"
        height="16"
        rx="3"
        fill="url(#cardGradient)"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: "easeInOut" }}
      />
      <motion.rect
        x="2"
        y="8"
        width="20"
        height="3"
        fill="rgba(255,255,255,0.3)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      />
      <defs>
        <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
    </motion.svg>
  );

  const MobilePaySVG = ({ className = "w-6 h-6" }: { className?: string }) => (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "backOut" }}
    >
      <motion.rect
        x="5"
        y="2"
        width="14"
        height="20"
        rx="2"
        fill="url(#phoneGradient)"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      />
      <motion.circle
        cx="12"
        cy="18"
        r="1.5"
        fill="white"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.6 }}
      />
      <motion.rect
        x="7"
        y="6"
        width="10"
        height="8"
        rx="1"
        fill="rgba(255,255,255,0.9)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      />
      <motion.path
        d="M10 9l2 2 4-4"
        stroke="#10B981"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.8 }}
      />
      <defs>
        <linearGradient id="phoneGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>
    </motion.svg>
  );

  const WalletSVG = ({ className = "w-6 h-6" }: { className?: string }) => (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      initial={{ rotateY: -90 }}
      animate={{ rotateY: 0 }}
      transition={{ duration: 0.6, ease: "backOut" }}
    >
      <motion.path
        d="M21 7H7a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2"
        fill="url(#walletGradient)"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      />
      <motion.circle
        cx="17"
        cy="13"
        r="2"
        fill="white"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 0.8 }}
      />
      <motion.circle
        cx="17"
        cy="13"
        r="0.5"
        fill="url(#walletGradient)"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 1 }}
      />
      <defs>
        <linearGradient id="walletGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
      </defs>
    </motion.svg>
  );

  const ProcessingSVG = ({ className = "w-8 h-8" }: { className?: string }) => (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
    >
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke="url(#processingGradient)"
        strokeWidth="2"
        fill="none"
        strokeDasharray="31.416"
        initial={{ strokeDashoffset: 31.416 }}
        animate={{ strokeDashoffset: [31.416, 0, 31.416] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.path
        d="M12 6v6l4 2"
        stroke="url(#processingGradient)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <defs>
        <linearGradient
          id="processingGradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>
    </motion.svg>
  );

  // Enhanced AI loader with payment theme
  const PaymentLoader = () => (
    <div className="flex items-center gap-3">
      <ProcessingSVG className="w-5 h-5" />
      <motion.div
        className="flex gap-1"
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: "linear-gradient(45deg, #3B82F6, #8B5CF6, #EC4899)",
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </motion.div>
    </div>
  );

  // Floating particles background
  const FloatingParticles = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full opacity-20"
          style={{
            background: `linear-gradient(45deg, ${
              [
                "#3B82F6",
                "#8B5CF6",
                "#EC4899",
                "#10B981",
                "#F59E0B",
                "#EF4444",
              ][i]
            }, transparent)`,
            left: `${10 + i * 15}%`,
            top: `${20 + i * 10}%`,
          }}
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            scale: [1, 1.5, 1],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5,
          }}
        />
      ))}
    </div>
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Enhanced backdrop with AI-inspired gradient */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-black/60 via-purple-900/20 to-blue-900/20 backdrop-blur-sm"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg"
          >
            {/* Enhanced holographic background with floating particles */}
            <FloatingParticles />
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/30 via-purple-500/30 to-cyan-500/30 blur-2xl animate-pulse" />
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-pink-500/20 via-emerald-500/10 to-blue-500/20 blur-xl" />
            <motion.div
              className="absolute inset-0 rounded-3xl bg-gradient-to-br from-yellow-400/10 via-transparent to-purple-600/10"
              animate={{
                background: [
                  "linear-gradient(45deg, rgba(251, 191, 36, 0.1), transparent, rgba(147, 51, 234, 0.1))",
                  "linear-gradient(135deg, rgba(59, 130, 246, 0.1), transparent, rgba(236, 72, 153, 0.1))",
                  "linear-gradient(225deg, rgba(16, 185, 129, 0.1), transparent, rgba(139, 92, 246, 0.1))",
                ],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />

            <Card className="relative overflow-hidden shadow-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-3xl border border-white/20 dark:border-gray-700/20">
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 transition-colors"
                disabled={!!awaiting?.refid && polling}
              >
                <X className="h-4 w-4" />
              </button>

              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg"
                    animate={{
                      rotate: [0, 360],
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                      scale: {
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      },
                    }}
                  >
                    <CreditCardSVG className="h-6 w-6 text-white" />
                  </motion.div>
                  <div>
                    <CardTitle className="text-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {title || "Smart Payment Hub"}
                    </CardTitle>
                    <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                      <motion.div
                        className="w-2 h-2 rounded-full bg-green-500"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      Secure • Fast • AI-Powered
                    </div>
                  </div>
                </div>

                {/* Amount display with AI styling */}
                <motion.div
                  className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border border-blue-200/50 dark:border-blue-700/50"
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Amount
                    </span>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-yellow-500" />
                      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {Number(amount).toLocaleString()} RWF
                      </span>
                    </div>
                  </div>
                  {description && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {description}
                    </div>
                  )}
                </motion.div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Payment Status - Awaiting */}
                {awaiting?.refid && (
                  <motion.div
                    className="p-4 rounded-2xl border border-blue-200 dark:border-blue-700 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <PaymentLoader />
                      <span className="font-medium text-blue-800 dark:text-blue-200">
                        Processing Payment...
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-300">
                          Reference ID:
                        </span>
                        <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                          {awaiting.refid}
                        </code>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(
                                awaiting.refid || ""
                              );
                              toast({
                                title: "Copied!",
                                description: "Reference ID copied to clipboard",
                              });
                            } catch (e) {
                              toast({
                                title: "Copy failed",
                                description: "Could not copy reference",
                                variant: "destructive",
                              });
                            }
                          }}
                          className="flex-1"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy ID
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                          className="flex-1"
                        >
                          <a
                            href="https://nyambika.com/support/payments"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Help
                          </a>
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Error Display - Enhanced */}
                {(errors.momo || errors.wallet || errors.general) &&
                  !awaiting?.refid && (
                    <motion.div
                      className="p-4 rounded-2xl border border-red-200 dark:border-red-700 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="font-medium text-red-800 dark:text-red-200">
                            Payment Error
                          </div>
                          <div className="text-sm text-red-700 dark:text-red-300">
                            {errors.momo || errors.wallet || errors.general}
                          </div>
                          {errors.details && (
                            <details className="text-xs">
                              <summary className="cursor-pointer text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200">
                                Technical Details
                              </summary>
                              <pre className="mt-2 p-2 bg-red-100 dark:bg-red-900/50 rounded text-red-800 dark:text-red-200 overflow-auto">
                                {JSON.stringify(errors.details, null, 2)}
                              </pre>
                            </details>
                          )}
                          {active === "momo" && errors.momo && (
                            <Button
                              onClick={payWithMomo}
                              disabled={submitting}
                              size="sm"
                              className="w-full mt-3 bg-red-600 hover:bg-red-700"
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              {submitting ? "Retrying..." : "Retry Payment"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                {/* Insufficient Balance Warning */}
                {walletInsufficient && active === "wallet" && (
                  <motion.div
                    className="p-4 rounded-2xl border border-yellow-200 dark:border-yellow-700 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                          Insufficient Wallet Balance
                        </div>
                        <div className="space-y-2 text-sm text-yellow-700 dark:text-yellow-300">
                          <div className="flex justify-between">
                            <span>Required:</span>
                            <span className="font-medium">
                              {walletInsufficient.required.toLocaleString()} RWF
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Available:</span>
                            <span className="font-medium">
                              {walletInsufficient.balance.toLocaleString()} RWF
                            </span>
                          </div>
                          <div className="flex justify-between border-t border-yellow-200 dark:border-yellow-700 pt-2">
                            <span>Need to add:</span>
                            <span className="font-bold text-yellow-800 dark:text-yellow-200">
                              {walletInsufficient.shortfall.toLocaleString()}{" "}
                              RWF
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            onClick={() =>
                              initiateWalletTopup(walletInsufficient.shortfall)
                            }
                            disabled={submitting}
                            size="sm"
                            className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            Top Up via MoMo
                          </Button>
                          <Button
                            onClick={() => openWalletDialog()}
                            variant="outline"
                            size="sm"
                            className="flex-1 border-yellow-300 dark:border-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/30"
                          >
                            <Wallet className="h-3 w-3 mr-1" />
                            Open Wallet
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Payment Method Tabs - Enhanced */}
                <Tabs value={active} onValueChange={(v: any) => setActive(v)}>
                  <TabsList className="grid grid-cols-2 w-full mb-6 p-1 bg-gradient-to-r from-gray-100/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
                    <TabsTrigger
                      value="momo"
                      className="flex items-center gap-2 justify-center rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 hover:scale-105"
                    >
                      <MobilePaySVG className="h-4 w-4" />
                      Mobile Money
                    </TabsTrigger>
                    <TabsTrigger
                      value="wallet"
                      className="flex items-center gap-2 justify-center rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 hover:scale-105"
                    >
                      <WalletSVG className="h-4 w-4" />
                      Smart Wallet
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="momo" className="space-y-4">
                    <motion.div
                      className="space-y-4"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className="space-y-2">
                        <Label
                          htmlFor="momoPhone"
                          className="text-sm font-medium"
                        >
                          Mobile Money Number
                        </Label>
                        <div className="relative">
                          <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="momoPhone"
                            type="tel"
                            placeholder="07xx xxx xxx"
                            value={momoPhone}
                            onChange={(e) => setMomoPhone(e.target.value)}
                            className="pl-10 rounded-xl border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400"
                          />
                        </div>
                      </div>
                      <Button
                        className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all"
                        disabled={disabled}
                        onClick={payWithMomo}
                      >
                        {submitting ? (
                          <div className="flex items-center gap-2">
                            <PaymentLoader />
                            Processing...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <MobilePaySVG className="h-5 w-5" />
                            Pay {amount.toLocaleString()} RWF
                          </div>
                        )}
                      </Button>
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="wallet" className="space-y-4">
                    <motion.div
                      className="space-y-4"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      {/* Wallet Balance Display */}
                      <div className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200 dark:border-green-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Wallet className="h-5 w-5 text-green-600" />
                            <span className="font-medium text-green-800 dark:text-green-200">
                              Wallet Balance
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                              {wallet ? wallet.balance.toLocaleString() : "—"}{" "}
                              RWF
                            </div>
                            {wallet && wallet.balance < amount && (
                              <div className="text-xs text-red-600 dark:text-red-400">
                                Insufficient balance
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Wallet Shortcut Button */}
                      <Button
                        variant="outline"
                        className="w-full rounded-xl border-dashed border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/30"
                        onClick={() => {
                          openWalletDialog();
                        }}
                      >
                        <Wallet className="h-4 w-4 mr-2" />
                        Open Wallet
                      </Button>

                      <Button
                        className="w-full h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={walletDisabled}
                        onClick={payWithWallet}
                      >
                        {submitting ? (
                          <div className="flex items-center gap-2">
                            <PaymentLoader />
                            Processing...
                          </div>
                        ) : walletDisabled &&
                          wallet &&
                          wallet.balance < amount ? (
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Insufficient Balance
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <WalletSVG className="h-5 w-5" />
                            Pay {amount.toLocaleString()} RWF
                          </div>
                        )}
                      </Button>
                    </motion.div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
