import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { category?: string };
}): Promise<Metadata> {
  const categoryId = searchParams?.category;
  
  if (!categoryId || categoryId === "all") {
    return buildMetadata({
      title: "Product Search — NyambikaAI",
      description: "Search and discover amazing products with AI-powered recommendations across all categories.",
      path: "/products-search",
      images: ["/nyambika_logo.png"],
      keywords: ["product search", "AI recommendations", "fashion search", "Rwanda shopping"],
    });
  }

  // For specific category, we'll fetch category details
  try {
    // In a real app, you'd fetch category details here
    // For now, we'll use a generic category-based metadata
    return buildMetadata({
      title: `${categoryId} Products — NyambikaAI`,
      description: `Explore ${categoryId} products with AI-powered virtual try-on and personalized recommendations.`,
      path: `/products-search?category=${categoryId}`,
      images: ["/nyambika_logo.png"], // Default logo, could be category-specific
      keywords: [categoryId, "AI fashion", "virtual try-on", "Rwanda shopping"],
    });
  } catch (error) {
    // Fallback to default metadata
    return buildMetadata({
      title: "Product Search — NyambikaAI",
      description: "Search and discover amazing products with AI-powered recommendations.",
      path: "/products-search",
      images: ["/nyambika_logo.png"],
    });
  }
}

export default function ProductsSearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
