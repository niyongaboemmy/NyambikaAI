import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import ProductCard from "@/components/ProductCard";

export default function ProductShowcase() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [, setLocation] = useLocation();

  const products = [
    {
      id: "1",
      name: "Elegant Dress",
      description: "Premium cotton blend",
      price: 45000,
      image:
        "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=500",
    },
    {
      id: "2",
      name: "Casual Shirt",
      description: "100% organic cotton",
      price: 25000,
      image:
        "https://images.unsplash.com/photo-1551028719-00167b16eac5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=500",
    },
    {
      id: "3",
      name: "Designer Bag",
      description: "Genuine leather",
      price: 65000,
      image:
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=500",
    },
    {
      id: "4",
      name: "Sneakers",
      description: "Limited edition",
      price: 55000,
      image:
        "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=500",
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
    <section id="products" className="py-20 px-4 md:px-6">
      <div className=" ">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
            Imyenda Nziza Cyane
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Featured Fashion Collections
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={
                {
                  id: p.id,
                  name: p.name,
                  nameRw: p.description,
                  imageUrl: p.image,
                  price: Number(p.price), // Change demo prices to numeric values
                } as any
              }
              isFavorited={favorites.includes(p.id)}
              onToggleFavorite={toggleFavorite}
              onViewDetails={(pid) => setLocation(`/product/${pid}`)}
              containerClassName="p-6"
            />
          ))}
        </div>

        <div className="text-center mt-12">
          <Button className="gradient-bg text-white px-8 py-4 rounded-2xl hover:scale-105 transition-all duration-300 font-semibold text-lg">
            Reba Byose / View All
          </Button>
        </div>
      </div>
    </section>
  );
}
