import { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Package, Clock, CheckCircle, Truck, MapPin, Phone, Calendar, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: string;
  total: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: string;
  shippingAddress: string;
  createdAt: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    price: string;
    size?: string;
    color?: string;
    product?: {
      id: string;
      name: string;
      imageUrl?: string;
    };
  }>;
}

const statusConfig = {
  pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock, label: 'Pending' },
  confirmed: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: CheckCircle, label: 'Confirmed' },
  preparing: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', icon: Package, label: 'Preparing' },
  shipped: { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', icon: Truck, label: 'Shipped' },
  delivered: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle, label: 'Delivered' },
  cancelled: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: Clock, label: 'Cancelled' }
};

export default function Orders() {
  const [, setLocation] = useLocation();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { toast } = useToast();

  // Fetch orders
  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['/api/orders'],
    queryFn: async (): Promise<Order[]> => {
      const response = await fetch('/api/orders', {
        headers: { 'x-user-id': 'demo-user-1' }
      });
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    }
  });

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(numPrice);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-RW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusProgress = (status: Order['status']) => {
    const steps = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered'];
    const currentIndex = steps.indexOf(status);
    return ((currentIndex + 1) / steps.length) * 100;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-background dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-background dark:via-slate-900 dark:to-slate-800">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <Card className="floating-card p-8">
            <Package className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Failed to load orders</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              There was an error loading your orders. Please try again.
            </p>
            <Button onClick={() => window.location.reload()} className="gradient-bg text-white">
              Retry
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Order detail view
  if (selectedOrder) {
    const StatusIcon = statusConfig[selectedOrder.status].icon;
    const progress = getStatusProgress(selectedOrder.status);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-background dark:via-slate-900 dark:to-slate-800">
        {/* Header */}
        <div className="sticky top-0 z-50 glassmorphism border-b border-white/20">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => setSelectedOrder(null)}
              className="glassmorphism"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
            <h1 className="text-xl font-bold gradient-text">
              Order #{selectedOrder.id.slice(0, 8)}
            </h1>
            <div className="w-20" />
          </div>
        </div>

        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Order Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Status Card */}
              <Card className="floating-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <StatusIcon className="h-5 w-5" />
                    Order Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className={statusConfig[selectedOrder.status].color}>
                      {statusConfig[selectedOrder.status].label}
                    </Badge>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(selectedOrder.createdAt)}
                    </span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-primary to-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Status timeline */}
                  <div className="space-y-3 pt-4">
                    {['pending', 'confirmed', 'preparing', 'shipped', 'delivered'].map((step, index) => {
                      const isCompleted = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered'].indexOf(selectedOrder.status) >= index;
                      const isCurrent = selectedOrder.status === step;
                      const StepIcon = statusConfig[step as keyof typeof statusConfig].icon;
                      
                      return (
                        <div key={step} className={`flex items-center gap-3 ${isCompleted ? 'text-primary' : 'text-gray-400'}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isCompleted ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700'
                          } ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                            <StepIcon className="h-4 w-4" />
                          </div>
                          <span className="font-medium capitalize">{step}</span>
                        </div>
                      );
                    })}
                  </div>

                  {selectedOrder.trackingNumber && (
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-400">
                        Tracking Number: {selectedOrder.trackingNumber}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Delivery Info */}
              <Card className="floating-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Delivery Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-medium mb-1">Shipping Address:</p>
                    <p className="text-gray-600 dark:text-gray-400">{selectedOrder.shippingAddress}</p>
                  </div>
                  
                  {selectedOrder.estimatedDelivery && (
                    <div>
                      <p className="font-medium mb-1">Estimated Delivery:</p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {formatDate(selectedOrder.estimatedDelivery)}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="font-medium mb-1">Payment Method:</p>
                    <p className="text-gray-600 dark:text-gray-400 capitalize">
                      {selectedOrder.paymentMethod.replace('_', ' ')}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card className="floating-card">
                <CardHeader>
                  <CardTitle>Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <img
                          src={item.product?.imageUrl || 'https://via.placeholder.com/80'}
                          alt={item.product?.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium">{item.product?.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {item.size && `Size: ${item.size}`}
                            {item.color && ` • Color: ${item.color}`}
                          </p>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-sm">Quantity: {item.quantity}</span>
                            <span className="font-medium">{formatPrice(item.price)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary Sidebar */}
            <div className="space-y-6">
              <Card className="floating-card sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Order Total:</span>
                      <span className="font-bold text-lg text-primary">
                        {formatPrice(selectedOrder.total)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>Items:</span>
                      <span>{selectedOrder.items.length}</span>
                    </div>
                  </div>

                  <hr className="border-gray-200 dark:border-gray-700" />

                  <div className="space-y-2">
                    <Button
                      onClick={() => {
                        toast({
                          title: "Support contacted",
                          description: "Our team will contact you shortly."
                        });
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Contact Support
                    </Button>
                    
                    {selectedOrder.status === 'delivered' && (
                      <Button
                        onClick={() => setLocation(`/products/${selectedOrder.items[0]?.productId}`)}
                        className="w-full gradient-bg text-white"
                      >
                        Reorder Items
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Orders list view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-background dark:via-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="sticky top-0 z-50 glassmorphism border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/profile')}
            className="glassmorphism"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-bold gradient-text">
            Amateka / My Orders
          </h1>
          <div className="w-20" />
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {orders.length === 0 ? (
          <Card className="floating-card p-8 text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">No orders yet</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You haven't placed any orders yet. Start shopping to see your orders here.
            </p>
            <Button onClick={() => setLocation('/products')} className="gradient-bg text-white">
              Start Shopping
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const StatusIcon = statusConfig[order.status].icon;
              
              return (
                <Card key={order.id} className="floating-card hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <StatusIcon className="h-5 w-5 text-primary" />
                        <div>
                          <h3 className="font-bold">Order #{order.id.slice(0, 8)}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={statusConfig[order.status].color}>
                          {statusConfig[order.status].label}
                        </Badge>
                        <p className="text-lg font-bold text-primary mt-1">
                          {formatPrice(order.total)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex -space-x-2">
                        {order.items.slice(0, 3).map((item, index) => (
                          <img
                            key={item.id}
                            src={item.product?.imageUrl || 'https://via.placeholder.com/40'}
                            alt={item.product?.name}
                            className="w-10 h-10 object-cover rounded-full border-2 border-white dark:border-gray-800"
                            style={{ zIndex: 3 - index }}
                          />
                        ))}
                        {order.items.length > 3 && (
                          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-medium">
                            +{order.items.length - 3}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {order.paymentMethod.replace('_', ' ')}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => setSelectedOrder(order)}
                        className="flex-1 gradient-bg text-white"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      {order.status === 'delivered' && (
                        <Button
                          onClick={() => setLocation(`/products/${order.items[0]?.productId}`)}
                          variant="outline"
                          className="flex-1"
                        >
                          Reorder
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
