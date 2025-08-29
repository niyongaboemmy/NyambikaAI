import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { apiClient, handleApiError } from "@/config/api";

type Category = {
  id: string;
  name: string;
  nameRw: string;
  description?: string | null;
  imageUrl?: string | null;
};

export default function CategoryCards() {
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/api/categories');
        return response.data;
      } catch (error) {
        throw new Error(handleApiError(error));
      }
    },
  });

  return (
    <section className="py-20 px-4 md:px-6">
      <div className=" ">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 gradient-text">
          Hitamo Icyakunze
          <span className="block text-2xl md:text-3xl mt-2 text-gray-600 dark:text-gray-300">
            Choose Your Style
          </span>
        </h2>

        {isLoading ? (
          <div className="text-center text-muted-foreground py-10">
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center text-muted-foreground py-10">
            No categories available yet
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.id}`}
              >
                <div className="group floating-card p-8 cursor-pointer neumorphism">
                  <img
                    src={
                      category.imageUrl ||
                      "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&h=600"
                    }
                    alt={category.name}
                    className="w-full h-64 object-cover rounded-2xl mb-6 group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="text-center">
                    <h3 className="text-2xl font-bold mb-3 text-gray-800 dark:text-gray-200">
                      {category.nameRw}
                    </h3>
                    {category.description && (
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {category.description}
                      </p>
                    )}
                    <div className="flex justify-center items-center space-x-2 text-[rgb(var(--electric-blue-rgb))]">
                      <span className="font-semibold">Reba Byinshi</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
