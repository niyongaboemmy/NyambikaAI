import { useState } from "react";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  CreditCard,
  Smartphone,
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";

export default function Cart() {
  const {
    items: cartItems,
    updateQuantity,
    removeItem,
    subtotal,
    shipping,
    total,
    isSyncing,
  } = useCart();

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} RWF`;
  };

  const paymentMethods = [
    {
      id: "momo",
      name: "MTN Mobile Money",
      icon: Smartphone,
      color: "text-yellow-600",
    },
    {
      id: "airtel",
      name: "Airtel Money",
      icon: Smartphone,
      color: "text-red-600",
    },
    {
      id: "card",
      name: "Credit/Debit Card",
      icon: CreditCard,
      color: "text-blue-600",
    },
  ];

  const [selectedPayment, setSelectedPayment] = useState("momo");

  return (
    <>
      <main className="pt-10 pb-14 relative">
        {/* Hero Header */}
        <div className="relative mb-10 sm:mb-2">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10 rounded-3xl blur-2xl" />
          <div className="relative rounded-3xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-gray-900/40 backdrop-blur-xl px-4 sm:px-8 py-8">
            <div className="flex flex-col items-center text-center gap-3">
              <span className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                Smart checkout with AI recommendations
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight gradient-text">
                Shopping Cart
              </h1>
              <p className="text-sm sm:text-sm text-gray-600 dark:text-gray-300 max-w-2xl">
                Review your items, adjust quantities, and proceed securely
              </p>
            </div>
          </div>
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-4">
            <Card className="floating-card p-10 sm:p-12 max-w-md mx-auto relative overflow-hidden">
              <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-2xl" />
              <ShoppingBag className="h-16 w-16 text-blue-500/80 dark:text-blue-400/80 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                Igikoni Kirimo Ubusa / Empty Cart
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Ntamyenda URI MUFITE muri iki gikoni
              </p>
              <Link href="/products">
                <Button className="gradient-bg text-white px-6 py-3 rounded-xl hover:scale-105 transition-all duration-300 shadow-lg">
                  Komeza Guhitamo / Continue Shopping
                </Button>
              </Link>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-2">
              {cartItems.map((item) => (
                <Card
                  key={`${item.id}:${item.size || ''}`}
                  className="floating-card p-6 relative overflow-hidden"
                >
                  <div className="pointer-events-none absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-gradient-to-tr from-cyan-400/15 to-blue-500/15 blur-2xl" />
                  <div className="flex items-start space-x-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-24 h-24 object-cover rounded-xl"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                            {item.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Size: {item.size}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id, item.size)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          disabled={isSyncing}
                          aria-disabled={isSyncing}
                        >
                          {isSyncing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center space-x-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                item.quantity - 1,
                                item.size
                              )
                            }
                            className="glassmorphism rounded-lg h-8 w-8"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="font-semibold text-gray-800 dark:text-gray-200 min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                item.quantity + 1,
                                item.size
                              )
                            }
                            className="glassmorphism rounded-lg h-8 w-8"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xl font-bold text-[rgb(var(--electric-blue-rgb))]">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Order Summary & Checkout */}
            <div className="space-y-2">
              {/* Order Summary */}
              <Card className="floating-card p-6 relative overflow-hidden">
                <div className="pointer-events-none absolute -top-8 -right-8 h-28 w-28 rounded-full bg-gradient-to-br from-purple-500/15 to-indigo-500/15 blur-2xl" />
                <CardHeader className="p-0 mb-6">
                  <CardTitle className="text-xl gradient-text">
                    Incamake / Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Subtotal
                    </span>
                    <span className="font-semibold">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Shipping
                    </span>
                    <span className="font-semibold">
                      {formatPrice(shipping)}
                    </span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg">
                      <span className="font-bold">Total</span>
                      <span className="font-bold text-[rgb(var(--electric-blue-rgb))]">
                        {formatPrice(total)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card className="floating-card p-6">
                <CardHeader className="p-0 mb-6">
                  <CardTitle className="text-xl gradient-text">
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-3">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <div
                        key={method.id}
                        className={`glassmorphism rounded-xl p-4 cursor-pointer transition-all duration-300 ${
                          selectedPayment === method.id
                            ? "ring-2 ring-[rgb(var(--electric-blue-rgb))] scale-105"
                            : "hover:scale-105"
                        }`}
                        onClick={() => setSelectedPayment(method.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 ${method.color}`}>
                            <Icon className="w-full h-full" />
                          </div>
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            {method.name}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Checkout Button */}
              <Button className="w-full gradient-bg text-white py-4 rounded-xl hover:scale-105 transition-all duration-300 font-semibold text-lg shadow-lg">
                <CreditCard className="mr-2 h-5 w-5" />
                Kwishyura / Proceed to Checkout
              </Button>

              <Link href="/products">
                <Button
                  variant="ghost"
                  className="w-full glassmorphism py-4 rounded-xl hover:scale-105 transition-all duration-300 font-semibold"
                >
                  Komeza Guhitamo / Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
