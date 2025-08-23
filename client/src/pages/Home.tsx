import CategoryCards from "@/components/CategoryCards";
import HeroSection from "@/components/HeroSection";
import HomeProducts from "@/components/HomeProducts";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Refactor the hero to display better background animated and:
      tryon button and explore button to scroll down in the products section */}
      {/* <HeroSection /> */}
      <div className="pt-14"></div>
      <HomeProducts />
    </div>
  );
}
