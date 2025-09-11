"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/custom-ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/custom-ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/custom-ui/tabs";
import { Input } from "@/components/custom-ui/input";
import { Label } from "@/components/custom-ui/label";
import apiClient from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Wallet, Smartphone } from "lucide-react";

export type PaymentMethodKind = "momo" | "wallet";

export interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number; // RWF
  description?: string;
  // Optional prefilled phone
  phone?: string;
  defaultMethod?: PaymentMethodKind;
  onSuccess: (args: { method: PaymentMethodKind; reference: string | null; meta?: any }) => void;
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
  const { open, onOpenChange, amount, description, phone, defaultMethod = "momo", onSuccess, onError, subscription } = props;
  const [active, setActive] = useState<PaymentMethodKind>(defaultMethod);
  const [submitting, setSubmitting] = useState(false);
  const [momoPhone, setMomoPhone] = useState<string>(phone || "");
  const [wallet, setWallet] = useState<{ balance: number } | null>(null);
  const [awaiting, setAwaiting] = useState<{ refid: string | null } | null>(null);
  const [polling, setPolling] = useState(false);

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

  const disabled = useMemo(() => submitting || amount <= 0, [submitting, amount]);

  const handleClose = () => onOpenChange(false);

  const payWithWallet = async () => {
    try {
      setSubmitting(true);
      const resp = await apiClient.post("/api/payments/wallet/charge", {
        amount,
        description: description || "Wallet charge",
        metadata: { kind: "generic" },
      });
      onSuccess({ method: "wallet", reference: resp.data?.payment?.externalReference || null, meta: resp.data });
      toast({ title: "Payment successful", description: `Paid ${amount.toLocaleString()} RWF from wallet` });
      handleClose();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Wallet payment failed";
      toast({ title: "Payment failed", description: msg, variant: "destructive" });
      onError?.(error);
    } finally {
      setSubmitting(false);
    }
  };

  const mapGatewayError = (err: any): string => {
    const msg = err?.response?.data?.message || err?.message || "Payment failed";
    const ret = err?.response?.data?.gateway?.retcode ?? err?.response?.data?.retcode;
    const code = String(ret || "");
    switch (code) {
      case "600":
        return "Payment provider is temporarily unavailable. Please try again or contact support.";
      case "607":
        return "Mobile Money transaction failed. Please verify your number and balance.";
      case "603":
        return "Missing required details. Please try again.";
      default:
        return msg;
    }
  };

  const startPollingStatus = async (refid: string) => {
    setPolling(true);
    const deadline = Date.now() + 90_000; // 90s
    try {
      while (Date.now() < deadline) {
        try {
          const resp = await apiClient.post("/api/payments/opay/checkstatus-public", { refid });
          const gw = resp.data?.gateway || resp.data;
          const sid = String(gw?.statusid || gw?.statusId || "");
          if (sid === "01") {
            toast({ title: "Payment approved", description: "Your payment was completed." });
            break;
          }
          if (sid === "02") {
            toast({ title: "Payment failed", description: "The transaction failed." , variant: "destructive"});
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
      toast({ title: "Invalid phone", description: "Enter a valid phone number", variant: "destructive" });
      return;
    }
    try {
      setSubmitting(true);
      const resp = await apiClient.post("/api/payments/opay/pay", {
        amount,
        phone: momoPhone,
        details: description || "payment",
        pmethod: "momo",
        ...(subscription ? { subscriptionPlanId: subscription.planId, billingCycle: subscription.billingCycle, targetProducerUserId: subscription.targetProducerUserId } : {}),
      });
      const data = resp.data || {};
      const redirectUrl = data.redirectUrl as string | null;
      const refid = data.refid as string | null;

      // If redirect url provided, open it in new tab to complete checkout
      if (redirectUrl) {
        window.open(redirectUrl, "_blank", "noopener,noreferrer");
      }
      // Show awaiting indicator while waiting for approval
      setAwaiting({ refid: refid || null });
      onSuccess({ method: "momo", reference: refid, meta: data });
      toast({ title: "Payment initiated", description: redirectUrl ? "Complete payment in the opened page" : "Check your phone to approve the payment" });
      if (refid) startPollingStatus(refid);
    } catch (error: any) {
      const msg = mapGatewayError(error);
      toast({ title: "Payment failed", description: msg, variant: "destructive" });
      onError?.(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="relative w-full max-w-lg">
            <Card className="overflow-hidden border-0 shadow-2xl bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-xl">Complete Payment</CardTitle>
                <div className="text-sm text-gray-600 dark:text-gray-300">Amount: <span className="font-semibold">{amount.toLocaleString()} RWF</span></div>
              </CardHeader>
              <CardContent>
                {awaiting?.refid && (
                  <div className="mb-3 rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-900/30 p-3 text-blue-800 dark:text-blue-100 flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    Waiting for payment approval...
                  </div>
                )}
                <Tabs value={active} onValueChange={(v: any) => setActive(v)}>
                  <TabsList className="grid grid-cols-2 w-full mb-4">
                    <TabsTrigger value="momo" className="flex items-center gap-2 justify-center">
                      <Smartphone className="h-4 w-4" /> MoMo
                    </TabsTrigger>
                    <TabsTrigger value="wallet" className="flex items-center gap-2 justify-center">
                      <Wallet className="h-4 w-4" /> Wallet
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="momo" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="momoPhone">Phone number</Label>
                      <Input id="momoPhone" type="tel" placeholder="07xx xxx xxx" value={momoPhone} onChange={(e) => setMomoPhone(e.target.value)} />
                    </div>
                    <Button className="w-full" disabled={disabled} onClick={payWithMomo}>
                      {submitting ? "Processing..." : `Pay ${amount.toLocaleString()} RWF with MoMo`}
                    </Button>
                  </TabsContent>

                  <TabsContent value="wallet" className="space-y-4">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Wallet balance: <span className="font-semibold">{wallet ? wallet.balance.toLocaleString() : "—"} RWF</span>
                    </div>
                    <Button className="w-full" variant="secondary" disabled={disabled} onClick={payWithWallet}>
                      {submitting ? "Processing..." : `Pay ${amount.toLocaleString()} RWF from Wallet`}
                    </Button>
                  </TabsContent>
                </Tabs>

                <div className="mt-4 text-center">
                  <button onClick={handleClose} className="text-sm text-gray-500 hover:underline" disabled={!!awaiting?.refid && polling}>Close</button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
