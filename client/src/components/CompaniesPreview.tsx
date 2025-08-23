import { useCompanies } from "@/hooks/useCompanies";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function CompaniesPreview() {
  const { data: companies = [], isLoading } = useCompanies();
  const [, setLocation] = useLocation();

  return (
    <section id="companies-preview" className="py-14 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold gradient-text">Featured Companies</h2>
            <p className="text-sm text-muted-foreground mt-1">Discover local Rwandan brands</p>
          </div>
          <Button
            variant="ghost"
            className="rounded-full hover:scale-[1.02] transition"
            onClick={() => setLocation("/companies")}
          >
            View All
          </Button>
        </div>

        <div className="relative">
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {(isLoading ? new Array(8).fill(null) : companies.slice(0, 12)).map((c, idx) => (
              <div
                key={c ? c.id : idx}
                className="min-w-[96px] max-w-[96px] shrink-0 rounded-2xl p-3 bg-background/60 backdrop-blur border border-border/60 shadow-sm hover:shadow-md transition-all"
              >
                <div className="aspect-square rounded-xl overflow-hidden border border-border/60 flex items-center justify-center bg-muted/40">
                  {c?.logoUrl ? (
                    <img
                      src={c.logoUrl}
                      alt={c.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="text-xs text-muted-foreground">{c ? c.name[0] : ""}</div>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p className="text-xs font-medium truncate" title={c?.name}>{c ? c.name : "\u00A0"}</p>
                  {c && (
                    <button
                      className="mt-1 text-[10px] text-primary hover:underline"
                      onClick={() => setLocation(`/products?companyId=${c.id}`)}
                    >
                      View
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
