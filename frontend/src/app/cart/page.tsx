"use client";

import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  CreditCard,
  Zap,
  Sparkles,
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/custom-ui/button";
import { Card } from "@/components/custom-ui/card";
import { useCart } from "@/contexts/CartContext";
import Link from "next/link";

function CartPage() {
  const {
    items: cartItems,
    updateQuantity,
    removeItem,
    total,
    isSyncing,
    isDeleting,
  } = useCart();

  const formatPrice = (price: number) => `${price.toLocaleString()} RWF`;

  return (
    <div className="min-h-screen pt-6 md:pt-3 relative overflow-hidden">
      {/* AI-inspired animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-blue-500/3 dark:bg-blue-500/5 rounded-full blur-2xl animate-pulse delay-500" />
      </div>

      <main className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Compact Header */}
        <div className="text-center mb-3 sm:mb-3">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 backdrop-blur-sm border border-gray-200/50 dark:border-white/10 mb-2">
            <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs sm:text-sm text-gray-700 dark:text-white/80">
              AI-Powered Cart
            </span>
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 via-blue-600 to-purple-600 dark:from-blue-400 dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            Shopping Cart
          </h1>
        </div>

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/15 to-purple-500/15 dark:from-blue-500/20 dark:to-purple-500/20 rounded-full blur-xl" />
              <ShoppingBag className="relative w-16 h-16 sm:w-20 sm:h-20 text-blue-600 dark:text-blue-400 mb-4 sm:mb-6" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-2 text-center">
              Empty Cart
            </h3>
            <p className="text-gray-600 dark:text-white/60 mb-6 sm:mb-8 text-center text-sm sm:text-base">
              Your cart is waiting for amazing products
            </p>
            <Link href="/products">
              <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 sm:px-8 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 text-sm sm:text-base">
                Start Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {/* Cart Items - Mobile Responsive Design */}
            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-4">
              {cartItems.map((item, index) => (
                <Card
                  key={`${item.id}:${item.size || ""}:${index}`}
                  className="bg-white/80 dark:bg-white/5 backdrop-blur-sm border-none rounded-xl sm:rounded-2xl p-3 sm:p-4 hover:bg-white/90 dark:hover:bg-white/10 transition-all duration-300 shadow-sm dark:shadow-none"
                  style={{ marginTop: "8px" }}
                >
                  {/* Mobile Layout: Stack vertically on small screens */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    {/* Product Image and Info */}
                    <div className="flex items-center gap-3 sm:gap-4 flex-1">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg sm:rounded-xl flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 dark:text-white text-sm sm:text-base truncate">
                          {item.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-white/60">
                          Size: {item.size}
                        </p>
                      </div>
                    </div>

                    {/* Mobile: Price and Controls Row */}
                    <div className="flex items-center justify-between sm:justify-end sm:gap-4">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 sm:gap-3">
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
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-white"
                        >
                          <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                        <span className="text-gray-800 dark:text-white font-semibold min-w-[1.5rem] sm:min-w-[2rem] text-center text-sm sm:text-base">
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
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-white"
                        >
                          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </div>

                      {/* Price */}
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-blue-600 dark:text-blue-400 text-sm sm:text-base">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>

                      {/* Delete Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          console.log("Deleting item:", {
                            id: item.id,
                            size: item.size,
                          });
                          removeItem(item.id, item.size);
                        }}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-100 dark:bg-red-500/20 hover:bg-red-200 dark:hover:bg-red-500/30 text-red-600 dark:text-red-400 flex-shrink-0"
                        disabled={isDeleting(item.id, item.size)}
                      >
                        {isDeleting(item.id, item.size) ? (
                          <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Mobile Responsive Summary & Checkout */}
            <Card className="bg-gradient-to-r from-white/90 to-white/80 dark:from-white/10 dark:to-white/5 backdrop-blur-sm border border-gray-200/50 dark:border-white/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg dark:shadow-none">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                  <span className="text-base sm:text-lg font-bold text-gray-800 dark:text-white">
                    Total
                  </span>
                </div>
                <span className="text-xl sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                  {formatPrice(total)}
                </span>
              </div>

              {/* Mobile: Stack buttons vertically on small screens */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link href="/checkout" className="flex-1">
                  <Button className="w-full bg-gradient-to-r from-violet-500 to-blue-600 hover:from-blue-600 hover:to-violet-700 text-white py-3 sm:py-4 rounded-full font-semibold text-base sm:text-sm transition-all duration-300 transform hover:scale-105 shadow-lg">
                    <CreditCard className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                    Checkout
                  </Button>
                </Link>
                <Link href="/products" className="sm:flex-shrink-0">
                  <Button
                    variant="ghost"
                    className="w-full sm:w-auto bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-white px-4 sm:px-6 py-3 sm:py-4 rounded-full font-semibold transition-all duration-300 text-sm sm:text-sm"
                  >
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

export default CartPage;
