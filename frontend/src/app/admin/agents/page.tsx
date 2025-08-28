'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Search, 
  Filter, 
  Eye, 
  DollarSign, 
  TrendingUp, 
  UserCheck,
  MoreVertical,
  Plus
} from 'lucide-react';

interface Agent {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  isVerified: boolean;
  createdAt: string;
  totalCommissions: number;
  activeProducers: number;
  totalSubscriptions: number;
}

export default function AgentsManagementPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'unverified'>('all');

  useEffect(() => {
    // Check if user is admin
    if (isAuthenticated && user?.role !== 'admin') {
      router.push('/');
      return;
    }
    
    fetchAgents();
  }, [isAuthenticated, user]);

  const fetchAgents = async () => {
    try {
      // Mock data for development
      const mockAgents: Agent[] = [
        {
          id: '1',
          fullName: 'Jean Baptiste Uwimana',
          email: 'jean.uwimana@gmail.com',
          phone: '+250788123456',
          location: 'Kigali, Rwanda',
          isVerified: true,
          createdAt: '2024-01-15T10:00:00Z',
          totalCommissions: 450000,
          activeProducers: 12,
          totalSubscriptions: 28
        },
        {
          id: '2',
          fullName: 'Marie Claire Mukamana',
          email: 'marie.mukamana@gmail.com',
          phone: '+250789234567',
          location: 'Butare, Rwanda',
          isVerified: true,
          createdAt: '2024-02-10T14:30:00Z',
          totalCommissions: 320000,
          activeProducers: 8,
          totalSubscriptions: 19
        },
        {
          id: '3',
          fullName: 'David Nkurunziza',
          email: 'david.nkurunziza@gmail.com',
          phone: '+250787345678',
          location: 'Musanze, Rwanda',
          isVerified: false,
          createdAt: '2024-03-05T09:15:00Z',
          totalCommissions: 180000,
          activeProducers: 5,
          totalSubscriptions: 11
        }
      ];
      
      setAgents(mockAgents);
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'verified' && agent.isVerified) ||
                         (filterStatus === 'unverified' && !agent.isVerified);
    
    return matchesSearch && matchesFilter;
  });

  const totalStats = {
    totalAgents: agents.length,
    verifiedAgents: agents.filter(a => a.isVerified).length,
    totalCommissions: agents.reduce((sum, a) => sum + a.totalCommissions, 0),
    totalProducers: agents.reduce((sum, a) => sum + a.activeProducers, 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white">Loading agents...</p>
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
            <h1 className="text-4xl font-bold text-white mb-2">Agents Management</h1>
            <p className="text-gray-300">Manage and monitor your agent network</p>
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Add Agent
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Agents</p>
                <p className="text-2xl font-bold text-white">{totalStats.totalAgents}</p>
              </div>
              <Users className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Verified Agents</p>
                <p className="text-2xl font-bold text-white">{totalStats.verifiedAgents}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-400" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Commissions</p>
                <p className="text-2xl font-bold text-white">{totalStats.totalCommissions.toLocaleString()} RWF</p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-400" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Managed Producers</p>
                <p className="text-2xl font-bold text-white">{totalStats.totalProducers}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search agents by name, email, or location..."
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
              <option value="all">All Agents</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>
        </div>

        {/* Agents Table */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="text-left p-4 text-gray-300 font-semibold">Agent</th>
                  <th className="text-left p-4 text-gray-300 font-semibold">Contact</th>
                  <th className="text-left p-4 text-gray-300 font-semibold">Status</th>
                  <th className="text-left p-4 text-gray-300 font-semibold">Performance</th>
                  <th className="text-left p-4 text-gray-300 font-semibold">Commissions</th>
                  <th className="text-left p-4 text-gray-300 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAgents.map((agent) => (
                  <tr key={agent.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div>
                        <div className="font-semibold text-white">{agent.fullName}</div>
                        <div className="text-sm text-gray-400">{agent.location}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="text-white">{agent.email}</div>
                        <div className="text-sm text-gray-400">{agent.phone}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        agent.isVerified 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      }`}>
                        {agent.isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="text-white">{agent.activeProducers} Producers</div>
                        <div className="text-sm text-gray-400">{agent.totalSubscriptions} Subscriptions</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-white font-semibold">
                        {agent.totalCommissions.toLocaleString()} RWF
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => router.push(`/admin/agents/${agent.id}`)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredAgents.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No agents found</h3>
            <p className="text-gray-400">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
