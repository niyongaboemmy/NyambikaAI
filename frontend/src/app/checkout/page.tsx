"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiClient, handleApiError, API_ENDPOINTS } from "@/config/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormInput } from "@/components/ui/form-input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  ArrowLeft,
  CreditCard,
  Truck,
  MapPin,
  Phone,
  Mail,
  User,
  ShoppingBag,
  Loader2,
} from "lucide-react";

interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  demo: boolean;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: "momo",
    name: "Mobile Money",
    description: "Pay with MTN Mobile Money or Airtel Money",
    icon: Phone,
    demo: true,
  },
  {
    id: "card",
    name: "Credit/Debit Card",
    description: "Visa, Mastercard, or local bank cards",
    icon: CreditCard,
    demo: true,
  },
  {
    id: "bank_transfer",
    name: "Bank Transfer",
    description: "Direct bank transfer",
    icon: CreditCard,
    demo: true,
  },
  {
    id: "cash_on_delivery",
    name: "Cash on Delivery",
    description: "Pay when your order arrives",
    icon: Truck,
    demo: false,
  },
];

function CheckoutPage() {
  const router = useRouter();
  const { items, total, subtotal, shipping, clear } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState("momo");
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    province: "",
    postalCode: "",
    country: "Rwanda",
  });
  const [billingAddress, setBillingAddress] = useState<ShippingAddress>({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    province: "",
    postalCode: "",
    country: "Rwanda",
  });
  const [useSameAddress, setUseSameAddress] = useState(true);
  const [notes, setNotes] = useState("");
  const [sizeEvidenceImages, setSizeEvidenceImages] = useState<File[]>([]);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      router.push("/cart");
    }
  }, [items.length, router]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to proceed with checkout.",
        variant: "destructive",
      });
      router.push("/auth/signin?redirect=/checkout");
    }
  }, [isAuthenticated, router, toast]);

  const handleAddressChange = (
    field: keyof ShippingAddress,
    value: string,
    type: "shipping" | "billing" = "shipping"
  ) => {
    if (type === "shipping") {
      setShippingAddress((prev) => ({ ...prev, [field]: value }));
      if (useSameAddress) {
        setBillingAddress((prev) => ({ ...prev, [field]: value }));
      }
    } else {
      setBillingAddress((prev) => ({ ...prev, [field]: value }));
    }
  };

  const validateAddress = (address: ShippingAddress): boolean => {
    const required = ["fullName", "email", "phone", "address", "city"];
    return required.every((field) => address[field as keyof ShippingAddress]);
  };

  const handleSubmitOrder = async () => {
    if (!validateAddress(shippingAddress)) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required shipping information.",
        variant: "destructive",
      });
      return;
    }

    if (!useSameAddress && !validateAddress(billingAddress)) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required billing information.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate subtotal from cart items
      const subtotal = items.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);

      // Calculate total including shipping
      const orderTotal = subtotal + shipping;

      // Upload size evidence images if any
      let sizeEvidenceUrls: string[] = [];
      if (sizeEvidenceImages.length > 0) {
        const formData = new FormData();
        sizeEvidenceImages.forEach((file, index) => {
          formData.append(`sizeEvidence_${index}`, file);
        });

        try {
          const uploadResponse = await apiClient.post(API_ENDPOINTS.UPLOAD_SIZE_EVIDENCE, formData, {
            headers: { "Content-Type": "multipart/form-data" }
          });
          sizeEvidenceUrls = uploadResponse.data.urls;
        } catch (uploadError) {
          console.error("Error uploading size evidence:", uploadError);
          toast({
            title: "Upload Warning",
            description: "Size evidence images could not be uploaded, but order will proceed.",
            variant: "destructive",
          });
        }
      }

      const orderData = {
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          size: item.size,
          price: item.price, // Add price to each item
        })),
        shippingAddress: JSON.stringify(shippingAddress), // Stringify the address object
        paymentMethod: selectedPayment,
        notes,
        sizeEvidenceImages: sizeEvidenceUrls, // Add uploaded image URLs
        total: orderTotal.toFixed(2), // Include shipping in total
        subtotal: subtotal.toFixed(2), // Also send subtotal for reference
        shipping: shipping.toFixed(2)  // Send shipping amount separately
      };

      // Call backend directly via centralized apiClient (adds Authorization)
      const { data: order } = await apiClient.post(API_ENDPOINTS.ORDERS, orderData);

      // Clear cart and wait for it to complete
      await new Promise<void>((resolve) => {
        clear();
        // Add a small delay to ensure cart is cleared before redirecting
        setTimeout(resolve, 100);
      });

      // Show success message
      toast({
        title: "Order Placed Successfully!",
        description: `Your order #${order.id.slice(0, 8)} has been placed.`,
      });

      // Redirect to orders page
      return router.push("/orders");
    } catch (error) {
      console.error("Order submission error:", error);
      toast({
        title: "Order Failed",
        description: handleApiError(error),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-RW", {
      style: "currency",
      currency: "RWF",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (!isAuthenticated || items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen pt-6 sm:pt-8 pb-8 md:pb-10">
        {/* Header */}
        <div className="md:sticky top-0 z-50 glassmorphism border border-transparent rounded-2xl mb-4 sm:mb-6">
          <div className="px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.push("/cart")}
              className="glassmorphism"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cart
            </Button>
            <h1 className="text-lg sm:text-xl font-bold gradient-text">
              Checkout
            </h1>
            <div className="w-0 sm:w-20" />
          </div>
        </div>

        <div className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-1 sm:gap-2 lg:gap-4">
            {/* Main Checkout Form */}
            <div className="lg:col-span-3 space-y-4 sm:space-y-4 order-first md:order-last">
              {/* Shipping Information */}
              <Card className="w-full overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Shipping Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="grid sm:grid-cols-2 gap-2 sm:gap-4">
                    <FormInput
                      id="fullName"
                      label="Full Name *"
                      icon={User}
                      value={shippingAddress.fullName}
                      onChange={(e) =>
                        handleAddressChange("fullName", e.target.value)
                      }
                      placeholder="Enter your full name"
                    />
                    <FormInput
                      id="email"
                      label="Email *"
                      type="email"
                      icon={Mail}
                      value={shippingAddress.email}
                      onChange={(e) =>
                        handleAddressChange("email", e.target.value)
                      }
                      placeholder="your@email.com"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2 sm:gap-4">
                    <FormInput
                      id="phone"
                      label="Phone Number *"
                      icon={Phone}
                      value={shippingAddress.phone}
                      onChange={(e) =>
                        handleAddressChange("phone", e.target.value)
                      }
                      placeholder="+250 XXX XXX XXX"
                    />
                    <FormInput
                      id="country"
                      label="Country"
                      icon={MapPin}
                      value={shippingAddress.country}
                      onChange={(e) =>
                        handleAddressChange("country", e.target.value)
                      }
                      placeholder="Rwanda"
                    />
                  </div>

                  <FormInput
                    id="address"
                    label="Street Address *"
                    icon={MapPin}
                    value={shippingAddress.address}
                    onChange={(e) =>
                      handleAddressChange("address", e.target.value)
                    }
                    placeholder="Street address, apartment, suite, etc."
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                    <FormInput
                      id="city"
                      label="City *"
                      value={shippingAddress.city}
                      onChange={(e) =>
                        handleAddressChange("city", e.target.value)
                      }
                      placeholder="Kigali"
                    />
                    <FormInput
                      id="province"
                      label="Province"
                      value={shippingAddress.province}
                      onChange={(e) =>
                        handleAddressChange("province", e.target.value)
                      }
                      placeholder="Kigali City"
                    />
                    <FormInput
                      id="postalCode"
                      label="Postal Code"
                      value={shippingAddress.postalCode}
                      onChange={(e) =>
                        handleAddressChange("postalCode", e.target.value)
                      }
                      placeholder="00000"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card className="w-full overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 md:p-6 md:pt-0">
                  <RadioGroup
                    value={selectedPayment}
                    onValueChange={setSelectedPayment}
                    className="space-y-1 sm:space-y-1"
                  >
                    {paymentMethods.map((method) => {
                      const Icon = method.icon;
                      return (
                        <div
                          key={method.id}
                          className={`flex items-start p-3 sm:p-4 border rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 cursor-pointer ${
                            selectedPayment === method.id
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                              : "border-gray-200 dark:border-gray-700"
                          }`}
                          style={{ gap: "12px" }}
                          onClick={() => setSelectedPayment(method.id)}
                        >
                          <RadioGroupItem value={method.id} id={method.id} />
                          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <div className="flex items-center gap-2 w-full">
                              <span className="font-medium text-sm sm:text-base truncate">
                                {method.name}
                              </span>
                              {method.demo && (
                                <span className="flex-shrink-0 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded-full">
                                  DEMO
                                </span>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-words">
                              {method.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Size Evidence Photos */}
              <Card className="w-full overflow-hidden">
                <CardHeader>
                  <CardTitle>Size Evidence Photos (Optional)</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Upload up to 2 photos to help the producer understand your size requirements
                  </p>
                </CardHeader>
                <CardContent>
                  <ImageUpload
                    onImagesChange={setSizeEvidenceImages}
                    maxImages={2}
                    maxSizeMB={5}
                    acceptedTypes={["image/jpeg", "image/png", "image/webp"]}
                  />
                </CardContent>
              </Card>

              {/* Order Notes */}
              <Card className="w-full overflow-hidden">
                <CardHeader>
                  <CardTitle>Order Notes (Optional)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special instructions for your order..."
                    rows={3}
                    className="rounded-md text-sm sm:text-base min-h-[72px]"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-2 order-first md:order-last">
              <Card className="md:floating-card lg:sticky lg:top-28">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  {/* Order Items */}
                  <div className="space-y-2 sm:space-y-3 max-h-52 sm:max-h-80 overflow-y-auto">
                    {items.map((item) => (
                      <div
                        key={`${item.id}-${item.size}`}
                        className="flex gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                      >
                        <img
                          src={item.image || "https://via.placeholder.com/48"}
                          alt={item.name}
                          className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-md flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-xs sm:text-sm truncate">
                            {item.name}
                          </h4>
                          <div className="flex flex-wrap gap-1 text-xs text-gray-600 dark:text-gray-400">
                            {item.size && <span>Size: {item.size}</span>}
                            {item.color && <span>• Color: {item.color}</span>}
                          </div>
                          <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-400">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-right">
                          <div className="text-gray-500 text-xs">
                            {formatPrice(item.price)} each
                          </div>
                          <div className="font-bold text-primary">
                            {formatPrice(item.price * item.quantity)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Price Breakdown */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Shipping</span>
                      <span>{formatPrice(shipping)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span className="text-primary">{formatPrice(total)}</span>
                    </div>
                  </div>

                  {/* Place Order Button */}
                  <Button
                    onClick={handleSubmitOrder}
                    disabled={isSubmitting}
                    className="w-full gradient-bg text-white py-3 sm:py-4 text-sm sm:text-base font-semibold"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing Order...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Place Order • </span>
                        <span className="sm:hidden">Order • </span>
                        {formatPrice(total)}
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                    By placing this order, you agree to our Terms of Service and
                    Privacy Policy.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default CheckoutPage;
