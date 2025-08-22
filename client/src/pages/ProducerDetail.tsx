import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Card } from "@/components/ui/card";
import Footer from "@/components/Footer";
import type { Product } from "@shared/schema";

type Producer = {
  id: string;
  fullName?: string;
  fullNameRw?: string;
  businessName?: string;
  profileImage?: string;
  location?: string;
  phone?: string;
};

export default function ProducerDetail() {
  const { id } = useParams();

  const { data: producer } = useQuery<Producer>({
    queryKey: ["producer", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await fetch(`/api/producers/${id}`);
      if (!res.ok) throw new Error("Failed to fetch producer");
      return res.json();
    },
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ["producer-products", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await fetch(`/api/producers/${id}/products`);
      if (!res.ok) throw new Error("Failed to fetch producer products");
      return res.json();
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 pb-12 px-4 md:px-6 max-w-7xl mx-auto">
        {producer && (
          <div className="flex items-center gap-6 mb-8">
            <img
              src={producer.profileImage || "/placeholder-avatar.png"}
              alt={producer.businessName || producer.fullName || "Producer"}
              className="w-20 h-20 rounded-full object-cover"
            />
            <div>
              <h1 className="text-3xl font-bold">
                {producer.businessName || producer.fullName}
              </h1>
              {producer.fullNameRw && (
                <p className="text-muted-foreground">{producer.fullNameRw}</p>
              )}
              {producer.location && (
                <p className="text-muted-foreground">{producer.location}</p>
              )}
            </div>
          </div>
        )}

        <h2 className="text-2xl font-semibold mb-4">Products</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products?.map((prod) => (
            <Link key={prod.id} href={`/product/${prod.id}`}>
              <a>
                <Card className="p-4 hover:shadow-lg transition">
                  <img
                    src={prod.imageUrl}
                    alt={prod.name}
                    className="w-full h-40 object-cover rounded-lg mb-3"
                  />
                  <div className="font-semibold">{prod.name}</div>
                </Card>
              </a>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
