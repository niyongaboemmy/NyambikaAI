import { useQuery } from '@tanstack/react-query';
import { apiClient, API_ENDPOINTS } from '@/config/api';

type DashboardStats = {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
};

type Product = {
  id: string;
  name: string;
  nameRw: string;
  status: string;
  price: number;
  stock: number;
  orders: number;
  image: string;
};

type Order = {
  id: string;
  customerName: string;
  product: string;
  amount: number;
  status: string;
  date: string;
};

export function useProducerDashboard() {
  // Fetch dashboard stats
  const statsQuery = useQuery<DashboardStats>({
    queryKey: ['producer-stats'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/producer/stats');
      return data as DashboardStats;
    },
    // Keep data reasonably fresh and live
    refetchInterval: 10000, // 10s
    staleTime: 5000,
    gcTime: 5 * 60 * 1000,
  });

  // Fetch recent products
  const productsQuery = useQuery<Product[]>({
    queryKey: ['producer-products'],
    queryFn: async () => {
      // Get current user (producer) then fetch products filtered by producerId
      const me = await apiClient.get(API_ENDPOINTS.ME);
      const producerId = me.data?.id || me.data?.user?.id;
      if (!producerId) throw new Error('Missing authenticated user');
      const { data } = await apiClient.get(API_ENDPOINTS.PRODUCTS, {
        params: { producerId, limit: 10 },
      });
      return data as Product[];
    },
    refetchInterval: 10000,
    staleTime: 5000,
    gcTime: 5 * 60 * 1000,
  });

  // Fetch recent orders
  const ordersQuery = useQuery<Order[]>({
    queryKey: ['producer-orders'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/producer/orders', {
        params: { limit: 10 },
      });
      return data as Order[];
    },
    refetchInterval: 10000,
    staleTime: 5000,
    gcTime: 5 * 60 * 1000,
  });

  // Format price to RWF
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('rw-RW', {
      style: 'currency',
      currency: 'RWF',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate changes (mock data - in real app, this would come from the API)
  const getChanges = (key: keyof DashboardStats) => {
    // This is mock data - in a real app, you'd calculate this from historical data
    const changes = {
      totalProducts: { value: '+2 this week', isPositive: true },
      totalOrders: { value: '+8 today', isPositive: true },
      totalRevenue: { value: '+12% from last month', isPositive: true },
    };
    return changes[key] || { value: '', isPositive: true };
  };

  return {
    stats: {
      data: statsQuery.data,
      isLoading: statsQuery.isLoading,
      error: statsQuery.error,
      formatPrice,
      getChanges,
    },
    products: {
      data: productsQuery.data,
      isLoading: productsQuery.isLoading,
      error: productsQuery.error,
    },
    orders: {
      data: ordersQuery.data,
      isLoading: ordersQuery.isLoading,
      error: ordersQuery.error,
    },
  };
}
