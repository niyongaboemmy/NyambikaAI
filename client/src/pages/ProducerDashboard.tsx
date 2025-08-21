import { useState } from 'react';
import { 
  Package, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Plus, 
  Eye, 
  Edit, 
  MoreVertical,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProducerDashboard() {
  const [timeRange, setTimeRange] = useState('week');

  const stats = [
    {
      title: 'Total Products',
      value: '24',
      change: '+2 this week',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      title: 'Revenue',
      value: '2,450,000 RWF',
      change: '+12% from last month',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      title: 'Orders',
      value: '156',
      change: '+8 today',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    },
    {
      title: 'Customers',
      value: '89',
      change: '+5 new this week',
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20'
    }
  ];

  const recentProducts = [
    {
      id: '1',
      name: 'Traditional Rwandan Dress',
      nameRw: 'Ikoti Gakondo',
      status: 'approved',
      price: '45,000 RWF',
      stock: 12,
      orders: 8,
      image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=400'
    },
    {
      id: '2',
      name: 'Modern Ankara Blazer',
      nameRw: 'Ikoti ya Ankara',
      status: 'pending',
      price: '65,000 RWF',
      stock: 8,
      orders: 3,
      image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=400'
    },
    {
      id: '3',
      name: 'Casual Cotton Shirt',
      nameRw: 'Ishati ya Ipamba',
      status: 'approved',
      price: '25,000 RWF',
      stock: 20,
      orders: 15,
      image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=400'
    }
  ];

  const recentOrders = [
    {
      id: 'ORD-001',
      customerName: 'Marie Uwimana',
      product: 'Traditional Dress',
      amount: '45,000 RWF',
      status: 'processing',
      date: '2024-08-21'
    },
    {
      id: 'ORD-002',
      customerName: 'Jean Baptiste',
      product: 'Ankara Blazer',
      amount: '65,000 RWF',
      status: 'shipped',
      date: '2024-08-20'
    },
    {
      id: 'ORD-003',
      customerName: 'Grace Mukamana',
      product: 'Cotton Shirt',
      amount: '25,000 RWF',
      status: 'delivered',
      date: '2024-08-19'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'processing':
        return 'info-badge';
      case 'shipped':
        return 'warning-badge';
      case 'delivered':
        return 'success-badge';
      case 'cancelled':
        return 'error-badge';
      default:
        return 'status-badge bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 pb-12 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold gradient-text">
                Producer Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage your products and track your business performance
              </p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="clean-input"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
              <Button className="gradient-bg text-white hover:opacity-90 transition-opacity">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="floating-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {stat.title}
                        </p>
                        <p className="text-2xl font-bold text-foreground mt-1">
                          {stat.value}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {stat.change}
                        </p>
                      </div>
                      <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                        <Icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Products */}
            <Card className="floating-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="gradient-text">Recent Products</CardTitle>
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentProducts.map((product) => (
                  <div key={product.id} className="glassmorphism rounded-xl p-4">
                    <div className="flex items-center space-x-4">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-foreground">
                            {product.name}
                          </h3>
                          {getStatusIcon(product.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {product.nameRw}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                          <span>{product.price}</span>
                          <span>Stock: {product.stock}</span>
                          <span>Orders: {product.orders}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Orders */}
            <Card className="floating-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="gradient-text">Recent Orders</CardTitle>
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="glassmorphism rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-foreground">
                            {order.id}
                          </h3>
                          <span className={`${getOrderStatusBadge(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {order.customerName} • {order.product}
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="font-bold text-primary">
                            {order.amount}
                          </span>
                          <span className="text-sm text-muted-foreground flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {order.date}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}