'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  DollarSign,
  Search,
  Filter,
  Eye,
  CreditCard,
  Plus,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

interface Producer {
  id: string;
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  location: string;
  subscription: {
    id: string;
    planName: string;
    status: string;
    endDate: string;
    amount: string;
  } | null;
  totalPaid: number;
  subscriptionCount: number;
}

export default function AgentDashboard() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [producers, setProducers] = useState<Producer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired' | 'pending'>('all');

  useEffect(() => {
    // Check if user is agent
    if (isAuthenticated && user?.role !== 'agent') {
      router.push('/');
      return;
    }
    
    fetchProducers();
  }, [isAuthenticated, user]);

  const fetchProducers = async () => {
    try {
      // Mock data for development
      const mockProducers: Producer[] = [
        {
          id: '1',
          fullName: 'Alice Uwimana',
          businessName: 'Fashion Forward Rwanda',
          email: 'alice@fashionforward.rw',
          phone: '+250788111222',
          location: 'Kigali, Rwanda',
          subscription: {
            id: 'sub1',
            planName: 'Professional',
            status: 'active',
            endDate: '2024-12-31T23:59:59Z',
            amount: '35000'
          },
          totalPaid: 105000,
          subscriptionCount: 3
        },
        {
          id: '2',
          fullName: 'Bob Nkurunziza',
          businessName: 'Urban Style Co',
          email: 'bob@urbanstyle.rw',
          phone: '+250788333444',
          location: 'Butare, Rwanda',
          subscription: {
            id: 'sub2',
            planName: 'Starter',
            status: 'expired',
            endDate: '2024-08-15T23:59:59Z',
            amount: '15000'
          },
          totalPaid: 45000,
          subscriptionCount: 2
        },
        {
          id: '3',
          fullName: 'Claire Mukamana',
          businessName: 'Elegant Designs',
          email: 'claire@elegant.rw',
          phone: '+250788555666',
          location: 'Musanze, Rwanda',
          subscription: null,
          totalPaid: 0,
          subscriptionCount: 0
        }
      ];
      
      setProducers(mockProducers);
    } catch (error) {
      console.error('Error fetching producers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducers = producers.filter(producer => {
    const matchesSearch = producer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         producer.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         producer.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && producer.subscription?.status === 'active') ||
                         (filterStatus === 'expired' && producer.subscription?.status === 'expired') ||
                         (filterStatus === 'pending' && !producer.subscription);
    
    return matchesSearch && matchesFilter;
  });

  const stats = {
    totalProducers: producers.length,
    activeSubscriptions: producers.filter(p => p.subscription?.status === 'active').length,
    totalEarnings: producers.reduce((sum, p) => sum + (p.totalPaid * 0.4), 0), // 40% commission
    expiringSoon: producers.filter(p => {
      if (!p.subscription) return false;
      const endDate = new Date(p.subscription.endDate);
      const now = new Date();
      const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysLeft <= 7 && daysLeft > 0;
    }).length
  };

  const getStatusIcon = (status: string | undefined) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'expired':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-orange-400" />;
    }
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'expired':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-white">Loading dashboard...</p>
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
            <h1 className="text-4xl font-bold text-white mb-2">Agent Dashboard</h1>
            <p className="text-gray-300">Manage your producer network and subscriptions</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/agent/referrals")}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 flex items-center"
            >
              <Users className="h-5 w-5 mr-2" />
              View Referrals
            </button>
            <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Add Producer
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Producers</p>
                <p className="text-2xl font-bold text-white">{stats.totalProducers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Subscriptions</p>
                <p className="text-2xl font-bold text-white">{stats.activeSubscriptions}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Earnings</p>
                <p className="text-2xl font-bold text-white">{stats.totalEarnings.toLocaleString()} RWF</p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-400" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Expiring Soon</p>
                <p className="text-2xl font-bold text-white">{stats.expiringSoon}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-400" />
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search producers by name, business, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="pl-10 pr-8 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-purple-500 appearance-none"
            >
              <option value="all">All Producers</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="pending">No Subscription</option>
            </select>
          </div>
        </div>

        {/* Producers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducers.map((producer) => (
            <div
              key={producer.id}
              className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300"
            >
              {/* Producer Info */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">{producer.fullName}</h3>
                  <p className="text-purple-300 text-sm font-medium mb-2">{producer.businessName}</p>
                  <p className="text-gray-400 text-sm">{producer.email}</p>
                  <p className="text-gray-400 text-sm">{producer.location}</p>
                </div>
                <button
                  onClick={() => router.push(`/agent/producers/${producer.id}`)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>

              {/* Subscription Status */}
              <div className="mb-4">
                {producer.subscription ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300 text-sm">Current Plan</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${getStatusColor(producer.subscription.status)}`}>
                        {getStatusIcon(producer.subscription.status)}
                        {producer.subscription.status}
                      </span>
                    </div>
                    <p className="text-white font-medium">{producer.subscription.planName}</p>
                    <p className="text-gray-400 text-sm">
                      Expires: {new Date(producer.subscription.endDate).toLocaleDateString()}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <AlertCircle className="h-8 w-8 text-orange-400 mx-auto mb-2" />
                    <p className="text-orange-300 text-sm">No active subscription</p>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{producer.subscriptionCount}</p>
                  <p className="text-gray-400 text-xs">Subscriptions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{(producer.totalPaid * 0.4).toLocaleString()}</p>
                  <p className="text-gray-400 text-xs">Commission (RWF)</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {producer.subscription?.status === 'expired' || !producer.subscription ? (
                  <button
                    onClick={() => router.push(`/agent/producers/${producer.id}/renew`)}
                    className="flex-1 py-2 px-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 flex items-center justify-center text-sm"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    {producer.subscription ? 'Renew' : 'Subscribe'}
                  </button>
                ) : (
                  <button
                    onClick={() => router.push(`/agent/producers/${producer.id}`)}
                    className="flex-1 py-2 px-4 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-300 flex items-center justify-center text-sm"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredProducers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No producers found</h3>
            <p className="text-gray-400">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
