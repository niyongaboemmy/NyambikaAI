import { useEffect, useState } from 'react';
import { apiClient } from '@/config/api';

export default function TestProductsApi() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testApi = async () => {
      try {
        console.log('Testing products API...');
        const response = await apiClient.get('/api/products', {
          params: {
            limit: 5,
            offset: 0
          }
        });
        console.log('API Response:', response);
        setData(response.data);
      } catch (err) {
        console.error('API Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    testApi();
  }, []);

  if (loading) return <div>Testing API connection...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <h2 className="text-lg font-bold mb-2">API Test Results</h2>
      <pre className="text-xs bg-black text-green-400 p-2 rounded overflow-auto max-h-96">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
