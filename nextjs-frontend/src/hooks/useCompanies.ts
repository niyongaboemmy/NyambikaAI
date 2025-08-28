import { useQuery } from "@tanstack/react-query";
import { apiClient, handleApiError, API_ENDPOINTS } from "@/config/api";
import type { Company } from "@/shared/schema";

async function fetchCompanies(producerId?: string): Promise<Company[]> {
  try {
    const params = producerId ? { producerId } : {};
    const response = await apiClient.get(API_ENDPOINTS.COMPANIES, { params });
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
}

export function useCompanies(producerId?: string) {
  return useQuery<Company[]>({
    queryKey: ["companies", producerId ?? "all"],
    queryFn: () => fetchCompanies(producerId),
    staleTime: 60_000,
  });
}
