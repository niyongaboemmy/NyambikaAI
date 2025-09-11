"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/custom-ui/card";
import { Button } from "@/components/custom-ui/button";
import { Badge } from "@/components/custom-ui/badge";
import { Input } from "@/components/custom-ui/input";
import { Label } from "@/components/custom-ui/label";
import { Textarea } from "@/components/custom-ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/custom-ui/select";
import {
  CreditCard,
  Smartphone,
  Building2,
  User,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Receipt,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import PaymentDialog, { type PaymentMethodKind } from "@/components/PaymentDialog";
import { apiClient, API_ENDPOINTS } from "@/config/api";

interface Producer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  location: string;
  subscriptionStatus: "active" | "expired" | "pending";
  subscriptionExpiry: string;
  lastPayment: string;
  totalPaid: number;
  commissionEarned: number;
  productsCount: number;
}

interface PaymentData {
  amount: number;
  duration: number;
  paymentMethod: "momo" | "airtel" | "bank";
  phoneNumber: string;
  notes: string;
}

export default function SubscriptionRenewal() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const producerId = params.producerId as string;

  const [producer, setProducer] = useState<Producer | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData>({
    amount: 50000,
    duration: 1,
    paymentMethod: "momo",
    phoneNumber: "",
    notes: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [defaultMethod, setDefaultMethod] = useState<PaymentMethodKind>("momo");

  useEffect(() => {
    // Mock data for demonstration
    const mockProducers = [
      {
        id: "1",
        name: "Marie Mukamana",
        email: "marie@example.com",
        phone: "+250788123456",
        company: "Marie's Fashion",
        location: "Kigali, Rwanda",
        subscriptionStatus: "expired" as const,
        subscriptionExpiry: "2024-01-10",
        lastPayment: "2023-12-10",
        totalPaid: 150000,
        commissionEarned: 30000,
        productsCount: 25,
      },
      {
        id: "3",
        name: "Grace Uwimana",
        email: "grace@example.com",
        phone: "+250788345678",
        company: "Grace Collections",
        location: "Musanze, Rwanda",
        subscriptionStatus: "expired" as const,
        subscriptionExpiry: "2024-01-10",
        lastPayment: "2023-12-10",
        totalPaid: 75000,
        commissionEarned: 15000,
        productsCount: 12,
      },
      {
        id: "5",
        name: "Alice Smith",
        email: "alice@example.com",
        phone: "+250788567890",
        company: "Alice Fashion Hub",
        location: "Gisenyi, Rwanda",
        subscriptionStatus: "pending" as const,
        subscriptionExpiry: "2024-01-25",
        lastPayment: "2023-11-25",
        totalPaid: 60000,
        commissionEarned: 12000,
        productsCount: 8,
      },
    ];

    const foundProducer = mockProducers.find((p) => p.id === producerId);

    setTimeout(() => {
      setProducer(foundProducer || null);
      if (foundProducer) {
        setPaymentData((prev) => ({
          ...prev,
          phoneNumber: foundProducer.phone,
        }));
      }
      setIsLoading(false);
    }, 1000);
  }, [producerId]);

  const subscriptionPlans = [
    { duration: 1, price: 50000, label: "1 Month" },
    { duration: 3, price: 135000, label: "3 Months", discount: "10%" },
    { duration: 6, price: 240000, label: "6 Months", discount: "20%" },
    { duration: 12, price: 420000, label: "12 Months", discount: "30%" },
  ];

  const handlePlanChange = (duration: number) => {
    const plan = subscriptionPlans.find((p) => p.duration === duration);
    if (plan) {
      setPaymentData((prev) => ({
        ...prev,
        duration,
        amount: plan.price,
      }));
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDefaultMethod("momo");
    setShowPayment(true);
  };

  const completeAgentRenewal = async (pay: { method: PaymentMethodKind; reference: string | null }) => {
    if (!producer) return;
    try {
      setIsProcessing(true);
      const paymentMethod = pay.method === "wallet" ? "wallet" : "mobile_money";
      await apiClient.post(API_ENDPOINTS.AGENT_PROCESS_PAYMENT, {
        producerId: producer.id,
        // Using duration as plan length; backend can map to a plan
        duration: paymentData.duration,
        amount: paymentData.amount,
        paymentMethod,
        paymentReference: pay.reference,
      });
      setPaymentSuccess(true);
    } catch (error) {
      console.error("Agent renewal error", error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user || user.role !== "agent") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Access Denied
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                You need agent privileges to access this page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="w-64 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="w-full h-96 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          <div className="w-full h-96 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (!producer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Producer Not Found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                The producer you're looking for doesn't exist or you don't have
                access to manage them.
              </p>
              <Button
                onClick={() => router.push("/agent/producers-management")}
              >
                Back to Producers
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Payment Successful!
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {producer.name}'s subscription has been renewed for{" "}
                {paymentData.duration} month(s). You've earned{" "}
                {(paymentData.amount * 0.2).toLocaleString()} RWF commission.
              </p>
              <div className="space-y-2">
                <Button
                  onClick={() => router.push("/agent/producers-management")}
                  className="w-full"
                >
                  Back to Producers
                </Button>
                <Button
                  onClick={() => router.push("/agent-dashboard")}
                  variant="outline"
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const commissionAmount = paymentData.amount * 0.2;

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/agent/producers-management")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Subscription Renewal
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Process subscription payment for {producer.name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Producer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Producer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {producer.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {producer.name}
                </h3>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {producer.company}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>{producer.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{producer.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>{producer.location}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Products</p>
                  <p className="font-semibold">{producer.productsCount}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Total Paid</p>
                  <p className="font-semibold">
                    {producer.totalPaid.toLocaleString()} RWF
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Status</p>
                  <Badge
                    className={
                      producer.subscriptionStatus === "expired"
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                    }
                  >
                    {producer.subscriptionStatus === "expired"
                      ? "Expired"
                      : "Pending"}
                  </Badge>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">
                    Last Payment
                  </p>
                  <p className="font-semibold">
                    {new Date(producer.lastPayment).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePaymentSubmit} className="space-y-6">
              {/* Subscription Plan */}
              <div className="space-y-3">
                <Label>Subscription Plan</Label>
                <div className="grid grid-cols-2 gap-3">
                  {subscriptionPlans.map((plan) => (
                    <div
                      key={plan.duration}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        paymentData.duration === plan.duration
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                      onClick={() => handlePlanChange(plan.duration)}
                    >
                      <div className="text-sm font-medium">{plan.label}</div>
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {plan.price.toLocaleString()} RWF
                      </div>
                      {plan.discount && (
                        <div className="text-xs text-green-600 dark:text-green-400">
                          Save {plan.discount}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-3">
                <Label>Payment Method</Label>
                <Select
                  value={paymentData.paymentMethod}
                  onValueChange={(value: "momo" | "airtel" | "bank") =>
                    setPaymentData((prev) => ({
                      ...prev,
                      paymentMethod: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="momo">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        MTN Mobile Money
                      </div>
                    </SelectItem>
                    <SelectItem value="airtel">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        Airtel Money
                      </div>
                    </SelectItem>
                    <SelectItem value="bank">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Bank Transfer
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+250788123456"
                  value={paymentData.phoneNumber}
                  onChange={(e) =>
                    setPaymentData((prev) => ({
                      ...prev,
                      phoneNumber: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this payment..."
                  value={paymentData.notes}
                  onChange={(e) =>
                    setPaymentData((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>

              {/* Payment Summary */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subscription Amount:</span>
                  <span className="font-medium">
                    {paymentData.amount.toLocaleString()} RWF
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Your Commission (20%):</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {commissionAmount.toLocaleString()} RWF
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Duration:</span>
                  <span className="font-medium">
                    {paymentData.duration} month(s)
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between font-semibold">
                    <span>Total Amount:</span>
                    <span>{paymentData.amount.toLocaleString()} RWF</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing Payment...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Process Payment
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      {/* Payment Dialog */}
      <PaymentDialog
        open={showPayment}
        onOpenChange={setShowPayment}
        amount={paymentData.amount}
        description={producer ? `Agent renewal for ${producer.name} (${paymentData.duration} mo)` : "Agent renewal"}
        defaultMethod={defaultMethod}
        onSuccess={({ method, reference }) => completeAgentRenewal({ method, reference })}
        onError={(err) => console.error("Payment error", err)}
      />
    </div>
  );
}
