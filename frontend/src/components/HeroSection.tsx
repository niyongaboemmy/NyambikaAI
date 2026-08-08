import { Camera, ChevronsDown } from "lucide-react";
import { Button } from "@/components/custom-ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";

export default function HeroSection() {
  const { t } = useLanguage();

  const handleExplore = () => {
    const el = document.getElementById("home-products");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      id="home-hero"
      className="flex items-center justify-center pt-8 pb-4 px-4 md:px-6 relative overflow-hidden"
    >
      {/* Layered gradient + soft blobs, on current gold token palette */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-muted/40" />
        <div className="absolute -top-24 -left-24 h-80 w-80 bg-gold-500/20 rounded-full blur-3xl" />
        <div className="absolute top-20 -right-24 h-72 w-72 bg-gold-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 bg-gold-500/10 rounded-full blur-3xl" />
      </div>

      <div className="text-center max-w-3xl mx-auto py-8">
        <div className="animate-float">
          <h1 className="text-3xl md:text-5xl font-serif font-semibold mb-4 text-foreground">
            {t("home.hero.title")}
          </h1>
          <p className="text-base md:text-lg text-muted-foreground mb-8 leading-relaxed max-w-xl mx-auto">
            {t("home.hero.subtitle")}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/try-on">
            <Button
              className="bg-primary text-primary-foreground px-8 py-4 rounded-2xl hover:scale-105 transition-all duration-300 font-semibold text-lg"
              size="lg"
            >
              <Camera className="mr-3 h-5 w-5" />
              {t("home.hero.ctaTryOn")}
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="px-6 py-4 rounded-2xl hover:scale-105 transition-all duration-300 font-medium text-base text-muted-foreground"
            size="lg"
            onClick={handleExplore}
          >
            {t("home.hero.ctaExplore")}
            <ChevronsDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
