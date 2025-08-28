import { useState } from "react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import { useRouter } from "next/navigation";

export default function BestProducts() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const router = useRouter();

  const products = [
    {
      id: "bp1",
      name: "Elegant Dress",
      description: "Premium cotton blend",
      price: 45000,
      image:
        "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=600&q=60",
    },
    {
      id: "bp2",
      name: "Casual Shirt",
      description: "100% organic cotton",
      price: 25000,
      image:
        "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=60",
    },
    {
      id: "bp3",
      name: "Designer Bag",
      description: "Genuine leather",
      price: 65000,
      image:
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=60",
    },
    {
      id: "bp4",
      name: "Sneakers",
      description: "Limited edition",
      price: 55000,
      image:
        "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=600&q=60",
    },
    {
      id: "bp5",
      name: "Classic Suit",
      description: "Tailored fit",
      price: 120000,
      image:
        "https://images.unsplash.com/photo-1520975661595-6453be3f7070?auto=format&fit=crop&w=600&q=60",
    },
    {
      id: "bp6",
      name: "Summer Dress",
      description: "Light and breezy",
      price: 38000,
      image:
        "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=600&q=60",
    },
  ];

  const toggleFavorite = (productId: string) => {
    setFavorites((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  return (
    <section id="best-products" className="py-16 px-4 md:px-6">
      <div className=" ">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold gradient-text">
              Best Products
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Top picks loved by our community
            </p>
          </div>
          <Button
            className="rounded-full gradient-bg text-white px-5"
            onClick={() => router.push("/products")}
          >
            View All
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6">
          {products.slice(0, 6).map((p) => (
            <ProductCard
              key={p.id}
              product={
                {
                  id: p.id,
                  name: p.name,
                  nameRw: p.description,
                  imageUrl: p.image,
                  price: Number(p.price),
                } as any
              }
              isFavorited={favorites.includes(p.id)}
              onToggleFavorite={toggleFavorite}
              onViewDetails={(pid) => router.push(`/product/${pid}`)}
              containerClassName="p-3 md:p-4"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
