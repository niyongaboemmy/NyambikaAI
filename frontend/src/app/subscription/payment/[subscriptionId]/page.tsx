"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  CheckCircle,
  Loader2,
} from "lucide-react";

interface PaymentPageProps {
  params: Promise<{ subscriptionId: string }>;
}

export default function PaymentPage({ params }: PaymentPageProps) {
  const router = useRouter();
  const [subscriptionId, setSubscriptionId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<
    "mobile_money" | "airtel_money"
  >("mobile_money");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [processing, setProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);

  useEffect(() => {
    params.then(({ subscriptionId }) => {
      setSubscriptionId(subscriptionId);
    });
  }, [params]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // In production, this would integrate with actual payment providers
      const response = await fetch(
        `/api/subscriptions/${subscriptionId}/payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentMethod,
            phoneNumber,
            paymentReference: `PAY_${Date.now()}`,
          }),
        }
      );

      if (response.ok) {
        setPaymentComplete(true);
        setTimeout(() => {
          router.push("/subscription?success=true");
        }, 2000);
      } else {
        throw new Error("Payment failed");
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (paymentComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-white mb-4">
            Payment Successful!
          </h1>
          <p className="text-gray-300 mb-6">
            Your subscription has been activated.
          </p>
          <div className="animate-pulse text-purple-400">Redirecting...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16">
        {/* Header */}
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-300 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Plans
          </button>

          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Complete Your Payment
            </h1>
            <p className="text-gray-300">
              Choose your preferred payment method to activate your subscription
            </p>
          </div>

          {/* Payment Form */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8">
            <form onSubmit={handlePayment} className="space-y-6">
              {/* Payment Method Selection */}
              <div>
                <label className="block text-white text-lg font-semibold mb-4">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("mobile_money")}
                    className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
                      paymentMethod === "mobile_money"
                        ? "border-purple-500 bg-purple-500/20"
                        : "border-white/20 bg-white/5 hover:border-white/30"
                    }`}
                  >
                    <Smartphone className="h-8 w-8 mx-auto mb-2 text-yellow-400" />
                    <div className="text-white font-semibold">
                      MTN Mobile Money
                    </div>
                    <div className="text-gray-400 text-sm">*182#</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("airtel_money")}
                    className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
                      paymentMethod === "airtel_money"
                        ? "border-purple-500 bg-purple-500/20"
                        : "border-white/20 bg-white/5 hover:border-white/30"
                    }`}
                  >
                    <CreditCard className="h-8 w-8 mx-auto mb-2 text-red-400" />
                    <div className="text-white font-semibold">Airtel Money</div>
                    <div className="text-gray-400 text-sm">*500#</div>
                  </button>
                </div>
              </div>

              {/* Phone Number Input */}
              <div>
                <label
                  htmlFor="phoneNumber"
                  className="block text-white text-lg font-semibold mb-2"
                >
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="07XXXXXXXX"
                  className="w-full p-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                  required
                />
                <p className="text-gray-400 text-sm mt-2">
                  Enter your{" "}
                  {paymentMethod === "mobile_money" ? "MTN" : "Airtel"} number
                </p>
              </div>

              {/* Payment Instructions */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-3">
                  Payment Instructions:
                </h3>
                <ol className="text-gray-300 space-y-2 text-sm">
                  <li>1. Click "Process Payment" below</li>
                  <li>2. You'll receive a payment prompt on your phone</li>
                  <li>
                    3. Enter your{" "}
                    {paymentMethod === "mobile_money" ? "MTN" : "Airtel"} PIN to
                    confirm
                  </li>
                  <li>4. Your subscription will be activated immediately</li>
                </ol>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={processing || !phoneNumber}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Processing Payment...
                  </>
                ) : (
                  "Process Payment"
                )}
              </button>
            </form>
          </div>

          {/* Security Notice */}
          <div className="text-center mt-8">
            <p className="text-gray-400 text-sm">
              🔒 Your payment is secured with end-to-end encryption
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
