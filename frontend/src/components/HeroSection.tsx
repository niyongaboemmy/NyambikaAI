import { Camera, ChevronsDown } from "lucide-react";
import { Button } from "@/components/custom-ui/button";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { apiClient, handleApiError } from "@/config/api";

type Category = {
  id: string;
  name: string;
  nameRw?: string;
  imageUrl?: string | null;
};

export default function HeroSection() {
  const handleExplore = () => {
    const el = document.getElementById("home-products");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      id="home"
      className="min-h-screen flex items-center justify-center pt-20 px-4 md:px-6 relative overflow-hidden"
    >
      {/* Animated background: layered gradient + soft blobs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-blue-500/10 to-purple-500/10" />
        {/* Blobs */}
        <div className="absolute -top-24 -left-24 h-80 w-80 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute top-20 -right-24 h-72 w-72 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="text-center max-w-4xl mx-auto">
        <div className="animate-float">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 gradient-text">
            Imyenda nziza
            <br />
            <span className="text-4xl md:text-6xl">n'ubwiza bw'AI</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            Gukoresha tekinoloji ya AI kugira ngo ubona imyenda ikwiriye
            <br />
            <span className="text-lg md:text-xl opacity-75">
              AI-powered fashion platform for Rwanda
            </span>
          </p>
        </div>

        {/* CTAs: Try-On and Explore Products */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/try-on">
            <Button
              className="gradient-bg text-white px-8 py-4 rounded-2xl hover:scale-105 transition-all duration-300 font-semibold text-lg neumorphism"
              size="lg"
            >
              <Camera className="mr-3 h-5 w-5" />
              Gerageza AI Try-On
            </Button>
          </Link>
          <Button
            variant="secondary"
            className="px-8 py-4 rounded-2xl hover:scale-105 transition-all duration-300 font-semibold text-lg"
            size="lg"
            onClick={handleExplore}
          >
            <ChevronsDown className="mr-3 h-5 w-5" />
            Explore Products
          </Button>
        </div>

        {/* Categories - horizontally scrolling */}
        <CategoriesStrip />
      </div>
    </section>
  );
}

function CategoriesStrip() {
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/api/categories");
        return response.data;
      } catch (error) {
        throw new Error(handleApiError(error));
      }
    },
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="mt-10 text-sm text-muted-foreground">
        Loading categories...
      </div>
    );
  }

  if (!categories.length) return null;

  return (
    <div className="mt-10 px-1">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-lg font-semibold">Browse by Category</h3>
        <Link href="/products">
          <span className="text-sm text-primary hover:underline cursor-pointer">
            View all
          </span>
        </Link>
      </div>
      <div className="relative">
        {/* Edge fade */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent" />
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 pb-3 pr-6 snap-x snap-mandatory">
            {categories.map((c) => (
              <Link key={c.id} href={`/products?category=${c.id}`}>
                <div className="snap-start min-w-[180px] max-w-[200px] cursor-pointer group">
                  <div className="rounded-2xl overflow-hidden border bg-card hover:shadow-md transition-all">
                    <div className="h-28 w-full overflow-hidden">
                      <img
                        src={
                          c.imageUrl ||
                          "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&h=600"
                        }
                        alt={c.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-3">
                      <div className="text-sm font-semibold truncate">
                        {c.nameRw || c.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Tap to explore
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
