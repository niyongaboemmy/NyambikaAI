import { useState, useRef } from "react";
import { useParams, useLocation, useRoute } from "wouter";
import {
  Heart,
  ShoppingCart,
  Camera,
  Wand2,
  ArrowLeft,
  Star,
  Share2,
  Truck,
  Shield,
  RotateCcw,
  Loader2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";
import Footer from "@/components/Footer";
import TryOnWidget from "@/components/TryOnWidget";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";

interface ExtendedProduct extends Product {
  images?: string[];
  originalPrice?: number;
  discount?: number;
  rating?: number;
  reviewCount?: number;
  measurements?: Record<string, Record<string, string>>;
}

export default function ProductDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [showTryOn, setShowTryOn] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { addItem } = useCart();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      setLocation("/products");
    }
  };

  // Fetch product from API
  const {
    data: product,
    isLoading: productLoading,
    error,
  } = useQuery<ExtendedProduct>({
    queryKey: ["product", id],
    queryFn: async () => {
      if (!id) throw new Error("Product ID is required");
      const response = await fetch(`/api/products/${id}`);
      if (!response.ok) throw new Error("Failed to fetch product");
      const data = await response.json();

      // Build images array from main image and any additional images from backend
      const images = [
        data.imageUrl,
        ...((data.additionalImages as string[] | undefined) || []),
      ].filter(Boolean);

      return {
        ...data,
        images,
        rating: data.rating ?? 0,
        reviewCount: data.reviewCount ?? 0,
      };
    },
    enabled: !!id,
  });

  // Try-on is now handled by TryOnWidget

  const handleAddToCart = () => {
    if (!product) return;
    if (!selectedSize) {
      toast({
        title: "Size Required",
        description: "Please select a size first",
        variant: "destructive",
      });
      return;
    }
    if (!selectedColor) {
      toast({
        title: "Color Required",
        description: "Please select a color first",
        variant: "destructive",
      });
      return;
    }
    addItem(
      {
        id: product.id,
        name: product.name,
        nameRw: product.nameRw,
        description: product.description,
        price:
          typeof product.price === "number"
            ? product.price
            : parseFloat(product.price),
        image: product.imageUrl,
        size: selectedSize,
      },
      quantity
    );
    toast({
      title: "Added to cart",
      description: "Product added to your cart",
    });
  };

  const handleBuyNow = () => {
    if (!selectedSize) {
      toast({
        title: "Size Required",
        description: "Please select a size first",
        variant: "destructive",
      });
      return;
    }
    if (!selectedColor) {
      toast({
        title: "Color Required",
        description: "Please select a color first",
        variant: "destructive",
      });
      return;
    }

    handleAddToCart();
    setTimeout(() => {
      setLocation("/checkout");
    }, 500);
  };

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("rw-RW", {
      style: "currency",
      currency: "RWF",
      minimumFractionDigits: 0,
    })
      .format(numPrice)
      .replace("RWF", "RWF");
  };

  if (productLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-background dark:via-slate-900 dark:to-slate-800">
        <div className="flex justify-center items-center min-h-screen">
          <div className="flex items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="text-lg">Loading product...</span>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-background dark:via-slate-900 dark:to-slate-800">
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
            <Button onClick={handleBack}>
              Back to Products
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-background dark:via-slate-900 dark:to-slate-800">
      <main className="pt-24 pb-12 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="flex items-center gap-2 glassmorphism"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Products
            </Button>
            <div className="flex items-center gap-2">
              {(user?.role === "admin" ||
                (user?.role === "producer" &&
                  product.producerId === user?.id)) && (
                <Button
                  variant="outline"
                  className="glassmorphism"
                  onClick={() => setLocation(`/product-edit/${id}`)}
                >
                  Edit Product
                </Button>
              )}
              <Button variant="ghost" size="icon" className="glassmorphism">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`glassmorphism ${isFavorite ? "text-red-500" : ""}`}
                onClick={() => setIsFavorite(!isFavorite)}
              >
                <Heart
                  className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`}
                />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Images */}
            <div className="space-y-6">
              <div className="aspect-square rounded-3xl overflow-hidden bg-gray-100 dark:bg-gray-800 neumorphism">
                <img
                  src={product.images?.[currentImageIndex] || product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {product.images && product.images.length > 0 && (
                <div className="grid grid-cols-4 gap-3">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 transition-all duration-300 ${
                        currentImageIndex === index
                          ? "border-blue-500 ring-2 ring-blue-200"
                          : "border-transparent hover:border-blue-300"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-8">
              <div className="glassmorphism rounded-3xl p-8">
                <h1 className="text-2xl md:text-3xl font-bold gradient-text mb-2">
                  {product.name}
                </h1>
                <p className="text-base text-gray-600 dark:text-gray-300 mb-5">
                  {product.nameRw}
                </p>
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(product.rating || 0)
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                      {product.rating} ({product.reviewCount} reviews)
                    </span>
                  </div>
                  <Badge variant="secondary" className="ml-auto">
                    {product.inStock ? "In Stock" : "Out of Stock"}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mb-8">
                  <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {formatPrice(product.price)}
                  </span>
                  <div className="grid grid-cols-12 gap-2">
                    {product.originalPrice && (
                      <div className="col-span-6 md:col-span-3 lg:col-span-2">
                        <span className="text-lg text-gray-500 line-through">
                          {formatPrice(product.originalPrice)}
                        </span>
                        <Badge variant="destructive" className="animate-pulse">
                          -{product.discount}% OFF
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Size Selection */}
              <div className="glassmorphism rounded-3xl p-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span>Size Selection</span>
                  {selectedSize && (
                    <Badge variant="outline">{selectedSize}</Badge>
                  )}
                </h3>
                <div className="grid grid-cols-12 gap-3 mb-4">
                  {product.sizes?.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`col-span-6 md:col-span-3 lg:col-span-2 p-3 text-center border-2 rounded-xl transition-all duration-300 font-medium ${
                        selectedSize === size
                          ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300 scale-105 shadow-lg"
                          : "border-gray-300 hover:border-blue-300 hover:scale-105 dark:border-gray-600 glassmorphism"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                {selectedSize && product.measurements?.[selectedSize] && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-semibold mb-2 text-blue-800 dark:text-blue-200">
                      Size {selectedSize} Measurements:
                    </p>
                    <div className="text-sm text-blue-700 dark:text-blue-300 space-x-4">
                      {Object.entries(product.measurements[selectedSize]).map(
                        ([key, value]) => (
                          <span key={key} className="inline-block">
                            <strong>{key}:</strong> {value}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Color Selection */}
              <div className="glassmorphism rounded-3xl p-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span>Color Selection</span>
                  {selectedColor && (
                    <Badge variant="outline">{selectedColor}</Badge>
                  )}
                </h3>
                <div className="flex gap-3 flex-wrap">
                  {product.colors?.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2.5 border-2 rounded-xl transition-all duration-300 font-medium ${
                        selectedColor === color
                          ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300 scale-105 shadow-lg"
                          : "border-gray-300 hover:border-blue-300 hover:scale-105 dark:border-gray-600 glassmorphism"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Try-On Section */}
              <div className="glassmorphism rounded-3xl p-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-purple-500" />
                  AI Virtual Try-On
                </h3>

                {!showTryOn ? (
                  <Button
                    onClick={() => setShowTryOn(true)}
                    className="w-full gradient-bg text-white py-2.5 rounded-xl hover:scale-105 transition-all duration-300"
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    Try On with AI
                  </Button>
                ) : (
                  <TryOnWidget
                    productId={id!}
                    productImageUrl={product.imageUrl}
                  />
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Button
                    onClick={handleAddToCart}
                    disabled={!selectedSize || !selectedColor}
                    variant="outline"
                    className="flex-1 glassmorphism border-2 border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 py-2.5 rounded-xl"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                  <Button
                    onClick={handleBuyNow}
                    disabled={!selectedSize || !selectedColor}
                    className="flex-1 gradient-bg text-white py-2.5 rounded-xl hover:scale-105 transition-all duration-300"
                  >
                    Buy Now
                  </Button>
                </div>

                {/* Product Features */}
                <div className="glassmorphism rounded-2xl p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Truck className="h-5 w-5 text-green-500" />
                      <span className="text-sm">Free Delivery</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Shield className="h-5 w-5 text-blue-500" />
                      <span className="text-sm">Quality Guaranteed</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <RotateCcw className="h-5 w-5 text-purple-500" />
                      <span className="text-sm">Easy Returns</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
