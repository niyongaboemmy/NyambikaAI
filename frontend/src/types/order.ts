export interface ProducerOrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: string;
  product?: {
    id: string;
    name: string;
    imageUrl?: string;
  };
}

export interface ProducerOrder {
  id: string;
  total: string;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentMethod: string;
  shippingAddress: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  createdAt: string;
  updatedAt: string;
  items: ProducerOrderItem[];
}
