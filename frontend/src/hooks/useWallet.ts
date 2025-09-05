import { useQuery } from "@tanstack/react-query";
import { apiClient, API_ENDPOINTS } from "@/config/api";

export type Wallet = {
  id: string;
  balance: string; // stored as string by backend
  status: "active" | "inactive" | string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

async function fetchWallet(): Promise<Wallet> {
  const { data } = await apiClient.get<Wallet>(API_ENDPOINTS.WALLET);
  return data;
}

export function useWallet(options?: { enabled?: boolean }) {
  const query = useQuery({
    queryKey: [API_ENDPOINTS.WALLET],
    queryFn: fetchWallet,
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
    retry: 1,
  });

  const balanceNumber = Number(query.data?.balance || 0);

  const formatRWF = (value: number) =>
    new Intl.NumberFormat("rw-RW", {
      style: "currency",
      currency: "RWF",
      maximumFractionDigits: 0,
    }).format(Math.round(value));

  return {
    ...query,
    balance: balanceNumber,
    formattedBalance: formatRWF(balanceNumber),
  } as const;
}
