'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp,
  UserCheck,
  Building,
  Package,
  AlertTriangle,
  Eye,
  BarChart3,
  Calendar,
  Filter,
  Download
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalProducers: number;
  totalAgents: number;
  totalOrders: number;
  totalRevenue: number;
  activeSubscriptions: number;
  pendingOrders: number;
  expiredSubscriptions: number;
}

interface RecentActivity {
  id: string;
  type: 'order' | 'subscription' | 'user_registration';
  description: string;
  timestamp: string;
  status: string;
}

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    // Check if user is admin
    if (isAuthenticated && user?.role !== 'admin') {
      router.push('/');
      return;
    }
    
    fetchDashboardData();
  }, [isAuthenticated, user, timeRange]);

  const fetchDashboardData = async () => {
    try {
      // Mock data for development
      const mockStats: DashboardStats = {
        totalUsers: 1247,
        totalProducers: 89,
        totalAgents: 12,
        totalOrders: 3456,
        totalRevenue: 45780000,
        activeSubscriptions: 67,
        pendingOrders: 23,
        expiredSubscriptions: 8
      };

      const mockActivity: RecentActivity[] = [
        {
          id: '1',
          type: 'order',
          description: 'New order #ORD-2024-001 from Alice Uwimana',
          timestamp: '2024-08-28T10:30:00Z',
          status: 'pending'
        },
        {
          id: '2',
          type: 'subscription',
          description: 'Fashion Forward Rwanda renewed Professional plan',
          timestamp: '2024-08-28T09:15:00Z',
          status: 'completed'
        },
        {
          id: '3',
          type: 'user_registration',
          description: 'New producer registered: Urban Style Co',
          timestamp: '2024-08-28T08:45:00Z',
          status: 'pending_verification'
        },
        {
          id: '4',
          type: 'subscription',
          description: 'Elegant Designs subscription expired',
          timestamp: '2024-08-27T23:59:00Z',
          status: 'expired'
        }
      ];

      setStats(mockStats);
      setRecentActivity(mockActivity);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingBag className="h-4 w-4 text-blue-400" />;
      case 'subscription':
        return <Package className="h-4 w-4 text-purple-400" />;
      case 'user_registration':
        return <Users className="h-4 w-4 text-green-400" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-orange-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'active':
        return 'text-green-400';
      case 'pending':
      case 'pending_verification':
        return 'text-orange-400';
      case 'expired':
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-300">Monitor and manage your platform</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Time Range Filter */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-purple-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            
            <button className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-white">{stats?.totalUsers.toLocaleString()}</p>
                <p className="text-green-400 text-sm">+12% from last month</p>
              </div>
              <Users className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Orders</p>
                <p className="text-2xl font-bold text-white">{stats?.totalOrders.toLocaleString()}</p>
                <p className="text-green-400 text-sm">+8% from last month</p>
              </div>
              <ShoppingBag className="h-8 w-8 text-purple-400" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-white">{stats?.totalRevenue.toLocaleString()} RWF</p>
                <p className="text-green-400 text-sm">+15% from last month</p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-400" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Subscriptions</p>
                <p className="text-2xl font-bold text-white">{stats?.activeSubscriptions}</p>
                <p className="text-green-400 text-sm">+5% from last month</p>
              </div>
              <Package className="h-8 w-8 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Producers</p>
                <p className="text-xl font-bold text-white">{stats?.totalProducers}</p>
              </div>
              <Building className="h-6 w-6 text-blue-400" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Agents</p>
                <p className="text-xl font-bold text-white">{stats?.totalAgents}</p>
              </div>
              <UserCheck className="h-6 w-6 text-purple-400" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending Orders</p>
                <p className="text-xl font-bold text-white">{stats?.pendingOrders}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-orange-400" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Recent Activity</h3>
              <button className="text-purple-400 hover:text-purple-300 transition-colors">
                View All
              </button>
            </div>
            
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                  <div className="p-2 bg-white/10 rounded-lg">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">{activity.description}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-gray-400 text-xs">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                      <span className={`text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <h3 className="text-xl font-semibold text-white mb-6">Quick Actions</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => router.push('/admin/users')}
                className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-xl hover:bg-blue-500/30 transition-colors text-left"
              >
                <Users className="h-6 w-6 text-blue-400 mb-2" />
                <p className="text-white font-medium">Manage Users</p>
                <p className="text-blue-300 text-sm">View and manage all users</p>
              </button>

              <button
                onClick={() => router.push('/admin/agents')}
                className="p-4 bg-purple-500/20 border border-purple-500/30 rounded-xl hover:bg-purple-500/30 transition-colors text-left"
              >
                <UserCheck className="h-6 w-6 text-purple-400 mb-2" />
                <p className="text-white font-medium">Manage Agents</p>
                <p className="text-purple-300 text-sm">View agent network</p>
              </button>

              <button
                onClick={() => router.push('/admin/orders')}
                className="p-4 bg-green-500/20 border border-green-500/30 rounded-xl hover:bg-green-500/30 transition-colors text-left"
              >
                <ShoppingBag className="h-6 w-6 text-green-400 mb-2" />
                <p className="text-white font-medium">View Orders</p>
                <p className="text-green-300 text-sm">Monitor all orders</p>
              </button>

              <button
                onClick={() => router.push('/admin/analytics')}
                className="p-4 bg-orange-500/20 border border-orange-500/30 rounded-xl hover:bg-orange-500/30 transition-colors text-left"
              >
                <BarChart3 className="h-6 w-6 text-orange-400 mb-2" />
                <p className="text-white font-medium">Analytics</p>
                <p className="text-orange-300 text-sm">View detailed reports</p>
              </button>
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        {(stats?.expiredSubscriptions || 0) > 0 && (
          <div className="mt-8 bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
            <div className="flex items-start">
              <AlertTriangle className="h-6 w-6 text-red-400 mr-4 mt-1 flex-shrink-0" />
              <div>
                <h4 className="text-red-300 font-semibold mb-2">Attention Required</h4>
                <p className="text-red-200 mb-4">
                  {stats?.expiredSubscriptions} subscription(s) have expired and need renewal.
                  {stats?.pendingOrders} order(s) are pending review.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => router.push('/admin/subscriptions?filter=expired')}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                  >
                    Review Subscriptions
                  </button>
                  <button
                    onClick={() => router.push('/admin/orders?filter=pending')}
                    className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm"
                  >
                    Review Orders
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
