import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, CreditCard, Smartphone, MapPin, User, Package, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

// Payment form component for Stripe
function StripePaymentForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/checkout?payment_success=true',
      },
      redirect: 'if_required'
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "Your order has been placed!",
      });
      onSuccess();
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full gradient-bg text-white"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
            Processing...
          </>
        ) : (
          'Complete Payment'
        )}
      </Button>
    </form>
  );
}

export default function Checkout() {
  const [, setLocation] = useLocation();
  const [paymentMethod, setPaymentMethod] = useState('mtn_money');
  const [orderStep, setOrderStep] = useState<'details' | 'payment' | 'success'>('details');
  const [clientSecret, setClientSecret] = useState('');
  const [orderData, setOrderData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: 'Kigali',
    district: '',
    notes: ''
  });
  const { toast } = useToast();

  // Fetch cart items
  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ['/api/cart'],
    queryFn: async () => {
      const response = await fetch('/api/cart', {
        headers: { 'x-user-id': 'demo-user-1' }
      });
      if (!response.ok) throw new Error('Failed to fetch cart');
      return response.json();
    }
  });

  // Calculate totals
  const subtotal = cartItems.reduce((sum: number, item: any) => 
    sum + (parseFloat(item.product?.price || '0') * item.quantity), 0
  );
  const deliveryFee = subtotal > 50000 ? 0 : 2000; // Free delivery over 50k RWF
  const total = subtotal + deliveryFee;

  // Create payment intent for Stripe
  const createPaymentIntentMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'demo-user-1'
        },
        body: JSON.stringify({
          amount: total,
          currency: 'rwf',
          payment_method_types: ['card']
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setOrderStep('payment');
    },
    onError: (error: any) => {
      toast({
        title: "Payment setup failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'demo-user-1'
        },
        body: JSON.stringify({
          total: total.toString(),
          paymentMethod,
          shippingAddress: `${orderData.address}, ${orderData.district}, ${orderData.city}`,
          notes: orderData.notes,
          items: cartItems.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product?.price || '0',
            size: item.size,
            color: item.color
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      return response.json();
    },
    onSuccess: (order) => {
      setOrderStep('success');
      toast({
        title: "Order placed successfully!",
        description: `Order #${order.id.slice(0, 8)} has been created.`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Order failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSubmitOrder = () => {
    // Validate form
    if (!orderData.fullName || !orderData.phone || !orderData.address) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (paymentMethod === 'mtn_money' || paymentMethod === 'airtel_money' || paymentMethod === 'cash') {
      // For mobile money and cash, proceed directly to order creation
      createOrderMutation.mutate();
    } else if (paymentMethod === 'card') {
      // For card payments, create payment intent
      createPaymentIntentMutation.mutate();
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Checkout Form Skeleton */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-40" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                </Card>
              </div>
              
              {/* Order Summary Skeleton */}
              <div>
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <Skeleton className="w-16 h-16 rounded-md" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                    
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <div className="flex justify-between font-bold">
                        <Skeleton className="h-5 w-12" />
                        <Skeleton className="h-5 w-24" />
                      </div>
                    </div>
                    
                    <Skeleton className="h-12 w-full" />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-background dark:via-slate-900 dark:to-slate-800">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <Card className="floating-card p-8">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Add some products to your cart before checking out.
            </p>
            <Button onClick={() => setLocation('/products')} className="gradient-bg text-white">
              Continue Shopping
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (orderStep === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-background dark:via-slate-900 dark:to-slate-800">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <Card className="floating-card p-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-3xl font-bold gradient-text mb-4">
              Murakoze! / Thank You!
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
              Your order has been placed successfully. You will receive a confirmation SMS shortly.
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Next steps:</strong><br />
                1. You'll receive an SMS confirmation<br />
                2. Our team will contact you to confirm details<br />
                3. Your order will be prepared and delivered
              </p>
            </div>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => setLocation('/orders')} className="gradient-bg text-white">
                View Orders
              </Button>
              <Button onClick={() => setLocation('/products')} variant="outline">
                Continue Shopping
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (orderStep === 'payment' && clientSecret) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-background dark:via-slate-900 dark:to-slate-800">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <Card className="floating-card p-8">
            <CardHeader>
              <CardTitle className="text-center text-2xl gradient-text">
                Complete Your Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Amount:</span>
                  <span className="text-xl font-bold text-primary">{formatPrice(total)}</span>
                </div>
              </div>
              
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <StripePaymentForm onSuccess={() => createOrderMutation.mutate()} />
              </Elements>
              
              <Button
                onClick={() => setOrderStep('details')}
                variant="outline"
                className="w-full mt-4"
              >
                Back to Order Details
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-background dark:via-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="sticky top-0 z-50 glassmorphism border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/cart')}
            className="glassmorphism"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Subira / Back
          </Button>
          <h1 className="text-xl font-bold gradient-text">
            Gura / Checkout
          </h1>
          <div className="w-20" /> {/* Spacer */}
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Details */}
            <Card className="floating-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Amakuru Yawe / Your Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={orderData.fullName}
                      onChange={(e) => setOrderData({...orderData, fullName: e.target.value})}
                      placeholder="Amazina yawe yose"
                      className="glassmorphism border-0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={orderData.phone}
                      onChange={(e) => setOrderData({...orderData, phone: e.target.value})}
                      placeholder="+250 7XX XXX XXX"
                      className="glassmorphism border-0"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={orderData.email}
                    onChange={(e) => setOrderData({...orderData, email: e.target.value})}
                    placeholder="your@email.com"
                    className="glassmorphism border-0"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Delivery Address */}
            <Card className="floating-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Aho Tuzohereza / Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">Street Address *</Label>
                  <Input
                    id="address"
                    value={orderData.address}
                    onChange={(e) => setOrderData({...orderData, address: e.target.value})}
                    placeholder="KG 123 St, House #45"
                    className="glassmorphism border-0"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="district">District</Label>
                    <Input
                      id="district"
                      value={orderData.district}
                      onChange={(e) => setOrderData({...orderData, district: e.target.value})}
                      placeholder="Gasabo, Nyarugenge, Kicukiro"
                      className="glassmorphism border-0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={orderData.city}
                      onChange={(e) => setOrderData({...orderData, city: e.target.value})}
                      className="glassmorphism border-0"
                      disabled
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Special Instructions (Optional)</Label>
                  <Input
                    id="notes"
                    value={orderData.notes}
                    onChange={(e) => setOrderData({...orderData, notes: e.target.value})}
                    placeholder="Any special delivery instructions..."
                    className="glassmorphism border-0"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card className="floating-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Uburyo bwo Kwishyura / Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <label className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all ${
                    paymentMethod === 'mtn_money' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="mtn_money"
                      checked={paymentMethod === 'mtn_money'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-primary"
                    />
                    <Smartphone className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium">MTN MoMo</span>
                  </label>

                  <label className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all ${
                    paymentMethod === 'airtel_money' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="airtel_money"
                      checked={paymentMethod === 'airtel_money'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-primary"
                    />
                    <Smartphone className="h-5 w-5 text-red-600" />
                    <span className="font-medium">Airtel Money</span>
                  </label>

                  <label className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all ${
                    paymentMethod === 'card' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-primary"
                    />
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Credit/Debit Card</span>
                  </label>

                  <label className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all ${
                    paymentMethod === 'cash' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="cash"
                      checked={paymentMethod === 'cash'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-primary"
                    />
                    <Package className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Cash on Delivery</span>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card className="floating-card sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                <div className="space-y-3">
                  {cartItems.map((item: any) => (
                    <div key={item.id} className="flex gap-3">
                      <img
                        src={item.product?.imageUrl || 'https://via.placeholder.com/80'}
                        alt={item.product?.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.product?.name}</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Size: {item.size} {item.color && `• Color: ${item.color}`}
                        </p>
                        <p className="text-sm">
                          {item.quantity} × {formatPrice(parseFloat(item.product?.price || '0'))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <hr className="border-gray-200 dark:border-gray-700" />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery:</span>
                    <span>{deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}</span>
                  </div>
                  <hr className="border-gray-200 dark:border-gray-700" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-primary">{formatPrice(total)}</span>
                  </div>
                </div>

                <Button
                  onClick={handleSubmitOrder}
                  disabled={createOrderMutation.isPending || createPaymentIntentMutation.isPending}
                  className="w-full gradient-bg text-white text-lg py-3"
                >
                  {(createOrderMutation.isPending || createPaymentIntentMutation.isPending) ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Processing...
                    </>
                  ) : paymentMethod === 'card' ? (
                    `Continue to Payment • ${formatPrice(total)}`
                  ) : (
                    `Place Order • ${formatPrice(total)}`
                  )}
                </Button>

                <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
                  By placing this order, you agree to our terms and conditions.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}