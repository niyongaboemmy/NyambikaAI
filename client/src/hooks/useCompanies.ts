import { useQuery } from "@tanstack/react-query";

export type Company = {
  id: string;
  producerId: string;
  tin?: string | null;
  name: string;
  email: string;
  phone: string;
  location: string;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  createdAt?: string;
};

async function fetchCompanies(producerId?: string): Promise<Company[]> {
  const url = new URL("/api/companies", window.location.origin);
  if (producerId) url.searchParams.set("producerId", producerId);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch companies");
  return res.json();
}

export function useCompanies(producerId?: string) {
  return useQuery<Company[]>({
    queryKey: ["companies", producerId ?? "all"],
    queryFn: () => fetchCompanies(producerId),
    staleTime: 60_000,
  });
}
