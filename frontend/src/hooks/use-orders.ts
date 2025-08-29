import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, API_ENDPOINTS } from "@/config/api";

export type OrderItem = {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  name?: string;
};

export type Order = {
  id: string;
  customerId: string;
  createdAt?: string;
  status?: string;
  validationStatus?: "pending" | "in_progress" | "done" | "confirmed_by_customer" | string;
  total?: number;
  items?: OrderItem[];
};

// Fetch producer orders (current authenticated producer)
export function useProducerOrders(limit?: number) {
  return useQuery<Order[]>({
    queryKey: ["producer-orders", { limit }],
    queryFn: async () => {
      const { data } = await apiClient.get("/api/producer/orders", {
        params: { limit },
      });
      return data as Order[];
    },
    refetchInterval: 10000,
    staleTime: 5000,
    gcTime: 5 * 60 * 1000,
  });
}

export type OrdersByValidation = {
  pending: Order[];
  in_progress: Order[];
  done: Order[];
  confirmed_by_customer: Order[];
  unknown: Order[];
};

export function useGroupedProducerOrders(limit?: number) {
  const query = useProducerOrders(limit);
  const grouped = useMemo<OrdersByValidation>(() => {
    const base: OrdersByValidation = {
      pending: [],
      in_progress: [],
      done: [],
      confirmed_by_customer: [],
      unknown: [],
    };
    (query.data || []).forEach((o) => {
      const key = (o.validationStatus || "unknown") as keyof OrdersByValidation;
      if (key in base) {
        // @ts-ignore
        base[key].push(o);
      } else {
        base.unknown.push(o);
      }
    });
    return base;
  }, [query.data]);
  return { ...query, grouped };
}

// Mutation to update order.validationStatus
export function useUpdateOrderValidationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, validationStatus }: { id: string; validationStatus: string }) => {
      const { data } = await apiClient.put(
        API_ENDPOINTS.ORDER_VALIDATION_STATUS(id),
        { validationStatus }
      );
      return data as Order;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["producer-orders"] });
      qc.invalidateQueries({ queryKey: ["producer-stats"] });
      // Also refresh customer orders views
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
