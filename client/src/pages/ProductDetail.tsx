import { useState, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { Heart, ShoppingCart, Camera, Wand2, ArrowLeft, Star, Share2, Truck, Shield, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface ProductDetailProps {}

export default function ProductDetail({}: ProductDetailProps) {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showTryOn, setShowTryOn] = useState(false);
  const [customerImage, setCustomerImage] = useState<string | null>(null);
  const [tryOnResult, setTryOnResult] = useState<string | null>(null);
  const [isProcessingTryOn, setIsProcessingTryOn] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock product data (in real app, fetch from API)
  const product = {
    id: id || '1',
    name: 'Elegant Evening Dress',
    nameRw: 'Ikoti Nziza y\'Umugoroba',
    description: 'Premium silk blend with intricate embroidery. Perfect for special occasions and elegant events. Features a flowing silhouette that flatters all body types.',
    price: 85000,
    originalPrice: 120000,
    discount: 29,
    currency: 'RWF',
    images: [
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1000',
      'https://images.unsplash.com/photo-1566479179817-c0e22ca41a80?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1000',
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1000'
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Navy Blue', 'Burgundy', 'Black', 'Emerald'],
    measurements: {
      XS: { chest: '82cm', waist: '66cm', length: '140cm' },
      S: { chest: '86cm', waist: '70cm', length: '142cm' },
      M: { chest: '90cm', waist: '74cm', length: '144cm' },
      L: { chest: '94cm', waist: '78cm', length: '146cm' },
      XL: { chest: '98cm', waist: '82cm', length: '148cm' }
    },
    rating: 4.8,
    reviewCount: 124,
    inStock: true,
    category: 'women',
    brand: 'Nyambika Collection',
    material: '100% Silk Blend',
    careInstructions: 'Dry clean only'
  };

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  // Handle image upload for try-on
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setCustomerImage(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          variant: "destructive"
        });
      }
    }
  };

  // AI Try-on processing
  const processTryOn = async () => {
    if (!customerImage || !product.id) return;

    setIsProcessingTryOn(true);
    try {
      // Create try-on session
      const sessionResponse = await fetch('/api/try-on-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'demo-user-1'
        },
        body: JSON.stringify({
          customerImageUrl: customerImage,
          productId: product.id
        })
      });

      if (!sessionResponse.ok) {
        throw new Error('Failed to create try-on session');
      }

      const session = await sessionResponse.json();

      // Process the try-on
      const processResponse = await fetch(`/api/try-on-sessions/${session.id}/process`, {
        method: 'POST',
        headers: { 'x-user-id': 'demo-user-1' }
      });

      if (processResponse.ok) {
        const result = await processResponse.json();
        setTryOnResult(result.tryOnImageUrl || customerImage);
        toast({
          title: "Try-on completed!",
          description: "Your virtual try-on is ready."
        });
      } else {
        throw new Error('Try-on processing failed');
      }
    } catch (error) {
      console.error('Try-on error:', error);
      toast({
        title: "Try-on failed",
        description: "Please try again or contact support.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingTryOn(false);
    }
  };

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSize) {
        throw new Error('Please select a size');
      }

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'demo-user-1'
        },
        body: JSON.stringify({
          productId: product.id,
          quantity,
          size: selectedSize,
          color: selectedColor
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add to cart');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Added to cart!",
        description: `${product.name} (${selectedSize}) added to your cart.`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add to cart",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Buy now - direct to checkout
  const handleBuyNow = async () => {
    if (!selectedSize) {
      toast({
        title: "Size required",
        description: "Please select a size before purchasing.",
        variant: "destructive"
      });
      return;
    }

    // Add to cart and redirect to checkout
    try {
      await addToCartMutation.mutateAsync();
      setLocation('/checkout');
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getRecommendedSize = () => {
    // Simple size recommendation logic
    if (tryOnResult) {
      return selectedSize || 'M'; // Return current selection or default
    }
    return 'M'; // Default recommendation
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-background dark:via-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="sticky top-0 z-50 glassmorphism border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/products')}
            className="glassmorphism"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Subira / Back
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="glassmorphism">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className={`glassmorphism ${isFavorite ? 'text-red-500' : ''}`}
              onClick={() => setIsFavorite(!isFavorite)}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <Card className="floating-card p-2">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
                <img
                  src={product.images[currentImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {product.discount > 0 && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    -{product.discount}%
                  </div>
                )}
              </div>
            </Card>
            
            {/* Thumbnail Images */}
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-24 rounded-lg overflow-hidden border-2 transition-all ${
                    currentImageIndex === index 
                      ? 'border-primary shadow-lg' 
                      : 'border-gray-200 dark:border-gray-700'
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
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-2">
                {product.name}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                {product.nameRw}
              </p>
              
              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= Math.floor(product.rating)
                          ? 'text-yellow-500 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {product.rating} ({product.reviewCount} reviews)
                </span>
              </div>

              {/* Price */}
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl font-bold text-primary">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice > product.price && (
                  <span className="text-lg text-gray-500 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>

              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Size Selection */}
            <Card className="floating-card p-6">
              <h3 className="font-bold mb-4">Hitamo Ingano / Choose Size</h3>
              <div className="grid grid-cols-5 gap-2 mb-4">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`py-3 px-4 rounded-lg border text-center font-medium transition-all ${
                      selectedSize === size
                        ? 'border-primary bg-primary text-white'
                        : 'border-gray-300 dark:border-gray-600 hover:border-primary'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              
              {selectedSize && (
                <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <strong>Size {selectedSize} measurements:</strong><br />
                  Chest: {product.measurements[selectedSize as keyof typeof product.measurements]?.chest}, 
                  Waist: {product.measurements[selectedSize as keyof typeof product.measurements]?.waist}, 
                  Length: {product.measurements[selectedSize as keyof typeof product.measurements]?.length}
                </div>
              )}
            </Card>

            {/* Color Selection */}
            <Card className="floating-card p-6">
              <h3 className="font-bold mb-4">Hitamo Ibara / Choose Color</h3>
              <div className="flex gap-3">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                      selectedColor === color
                        ? 'border-primary bg-primary text-white'
                        : 'border-gray-300 dark:border-gray-600 hover:border-primary'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </Card>

            {/* Virtual Try-On */}
            <Card className="floating-card p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                AI Virtual Try-On
              </h3>
              
              {!showTryOn ? (
                <Button
                  onClick={() => setShowTryOn(true)}
                  className="w-full gradient-bg text-white"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Reba Uko Ikubana / See How It Looks
                </Button>
              ) : (
                <div className="space-y-4">
                  {!customerImage ? (
                    <div 
                      className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        Upload your photo for virtual try-on
                      </p>
                    </div>
                  ) : !tryOnResult ? (
                    <div className="space-y-4">
                      <img 
                        src={customerImage} 
                        alt="Your photo" 
                        className="w-full max-h-48 object-cover rounded-lg"
                      />
                      <Button
                        onClick={processTryOn}
                        disabled={isProcessingTryOn || !selectedSize}
                        className="w-full gradient-bg text-white"
                      >
                        {isProcessingTryOn ? (
                          <>
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Wand2 className="mr-2 h-4 w-4" />
                            Try On This Dress
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <img 
                        src={tryOnResult} 
                        alt="Try-on result" 
                        className="w-full max-h-64 object-cover rounded-lg"
                      />
                      <div className="text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                        <strong>AI Recommendation:</strong> Size {getRecommendedSize()} looks great on you!
                      </div>
                      <Button
                        onClick={() => {
                          setCustomerImage(null);
                          setTryOnResult(null);
                        }}
                        variant="outline"
                        className="w-full"
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Try Again
                      </Button>
                    </div>
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              )}
            </Card>

            {/* Quantity and Actions */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="font-medium">Quantity:</label>
                <div className="flex items-center border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 border-x">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => addToCartMutation.mutate()}
                  disabled={!selectedSize || addToCartMutation.isPending}
                  variant="outline"
                  className="glassmorphism"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {addToCartMutation.isPending ? 'Adding...' : 'Add to Cart'}
                </Button>
                <Button
                  onClick={handleBuyNow}
                  disabled={!selectedSize}
                  className="gradient-bg text-white"
                >
                  Gura Ubu / Buy Now
                </Button>
              </div>
            </div>

            {/* Product Info */}
            <Card className="floating-card p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Free Delivery</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Within Kigali in 1-2 days
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Quality Guarantee</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      30-day return policy
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}