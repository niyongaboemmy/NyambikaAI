import { useState } from 'react';
import { 
  Users, 
  Package, 
  DollarSign, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Eye,
  UserCheck,
  Ban,
  MoreVertical,
  Search,
  Filter
} from 'lucide-react';
import RoleBasedNavigation from '@/components/RoleBasedNavigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const systemStats = [
    {
      title: 'Total Users',
      value: '1,247',
      change: '+89 this month',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      title: 'Total Products',
      value: '456',
      change: '+23 pending approval',
      icon: Package,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      title: 'Platform Revenue',
      value: '15,650,000 RWF',
      change: '+18% from last month',
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    },
    {
      title: 'Active Orders',
      value: '234',
      change: '+12 today',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20'
    }
  ];

  const pendingApprovals = [
    {
      id: '1',
      type: 'product',
      title: 'Traditional Kigali Dress',
      producer: 'Marie Uwimana',
      submittedDate: '2024-08-20',
      priority: 'medium',
      image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=400'
    },
    {
      id: '2',
      type: 'producer',
      title: 'Producer Application',
      producer: 'Jean Baptiste',
      submittedDate: '2024-08-19',
      priority: 'high',
      businessName: 'Rwanda Fashion Co.'
    },
    {
      id: '3',
      type: 'product',
      title: 'Modern Ankara Collection',
      producer: 'Grace Mukamana',
      submittedDate: '2024-08-18',
      priority: 'low',
      image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=400'
    }
  ];

  const recentActivity = [
    {
      id: '1',
      action: 'Product Approved',
      user: 'Admin John',
      target: 'Traditional Dress by Marie',
      timestamp: '2 hours ago',
      type: 'success'
    },
    {
      id: '2',
      action: 'User Registered',
      user: 'System',
      target: 'New customer: Alice Mukamana',
      timestamp: '4 hours ago',
      type: 'info'
    },
    {
      id: '3',
      action: 'Producer Verified',
      user: 'Admin Sarah',
      target: 'Rwanda Fashion Co.',
      timestamp: '6 hours ago',
      type: 'success'
    },
    {
      id: '4',
      action: 'Order Flagged',
      user: 'System',
      target: 'Order #ORD-123 - Suspicious activity',
      timestamp: '8 hours ago',
      type: 'warning'
    }
  ];

  const usersByRole = [
    { role: 'Customers', count: 1089, percentage: 87.3, color: 'bg-blue-500' },
    { role: 'Producers', count: 142, percentage: 11.4, color: 'bg-green-500' },
    { role: 'Admins', count: 16, percentage: 1.3, color: 'bg-purple-500' }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-background dark:via-slate-900 dark:to-slate-800">
      <RoleBasedNavigation userRole="admin" userName="Admin Sarah" />
      
      <main className="pt-24 pb-12 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold gradient-text">
              System Administration
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Monitor platform activity and manage users, products, and operations
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="glassmorphism rounded-2xl p-2 mb-8">
            <div className="flex space-x-2">
              {['overview', 'approvals', 'users', 'analytics'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 capitalize ${
                    activeTab === tab
                      ? 'gradient-bg text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'overview' && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {systemStats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <Card key={index} className="floating-card">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {stat.title}
                            </p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                              {stat.value}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
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
                {/* User Distribution */}
                <Card className="floating-card">
                  <CardHeader>
                    <CardTitle className="gradient-text">User Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {usersByRole.map((user) => (
                      <div key={user.role} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">{user.role}</span>
                          <span className="font-medium">{user.count} ({user.percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`${user.color} h-2 rounded-full transition-all duration-500`}
                            style={{ width: `${user.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="floating-card">
                  <CardHeader>
                    <CardTitle className="gradient-text">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="glassmorphism rounded-xl p-4">
                        <div className="flex items-start space-x-3">
                          {getActivityIcon(activity.type)}
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {activity.action}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {activity.target}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {activity.user} • {activity.timestamp}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {activeTab === 'approvals' && (
            <div className="space-y-6">
              {/* Search and Filter */}
              <Card className="floating-card p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search pending approvals..."
                      className="pl-10 glassmorphism border-0 bg-transparent"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" className="glassmorphism">
                      <Filter className="mr-2 h-4 w-4" />
                      Filter
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Pending Approvals */}
              <Card className="floating-card">
                <CardHeader>
                  <CardTitle className="gradient-text">Pending Approvals ({pendingApprovals.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pendingApprovals.map((item) => (
                    <div key={item.id} className="glassmorphism rounded-xl p-6">
                      <div className="flex items-center space-x-4">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                              {item.title}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs capitalize ${getPriorityColor(item.priority)}`}>
                              {item.priority}
                            </span>
                            <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 capitalize">
                              {item.type}
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                            Producer: {item.producer}
                          </p>
                          {item.businessName && (
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                              Business: {item.businessName}
                            </p>
                          )}
                          <p className="text-gray-500 dark:text-gray-400 text-xs">
                            Submitted: {item.submittedDate}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600">
                            <UserCheck className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600">
                            <Ban className="h-4 w-4" />
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
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}