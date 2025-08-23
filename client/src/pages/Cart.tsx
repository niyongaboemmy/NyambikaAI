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
import Footer from "@/components/Footer";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-background dark:via-slate-900 dark:to-slate-800">
      <main className="pt-24 pb-12 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold gradient-text mb-4">
              Igikoni / Shopping Cart
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Review your items before checkout
            </p>
          </div>

          {cartItems.length === 0 ? (
            <div className="text-center py-16">
              <Card className="floating-card p-12 max-w-md mx-auto">
                <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                  Igikoni Kirimo Ubusa / Empty Cart
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Ntamyenda URI MUFITE muri iki gikoni
                </p>
                <Link href="/products">
                  <Button className="gradient-bg text-white px-6 py-3 rounded-xl hover:scale-105 transition-all duration-300">
                    Komeza Guhitamo / Continue Shopping
                  </Button>
                </Link>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-6">
                {cartItems.map((item) => (
                  <Card key={item.id} className="floating-card p-6">
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
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {item.nameRw}
                            </p>
                            {item.description && (
                              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                                {item.description}
                              </p>
                            )}
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
              <div className="space-y-6">
                {/* Order Summary */}
                <Card className="floating-card p-6">
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
                <Button className="w-full gradient-bg text-white py-4 rounded-xl hover:scale-105 transition-all duration-300 font-semibold text-lg">
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
        </div>
      </main>

      <Footer />
    </div>
  );
}
