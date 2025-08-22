import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import Footer from "@/components/Footer";

type Producer = {
  id: string;
  fullName?: string;
  fullNameRw?: string;
  businessName?: string;
  profileImage?: string;
  location?: string;
};

export default function Producers() {
  const { data, isLoading, error } = useQuery<Producer[]>({
    queryKey: ["producers"],
    queryFn: async () => {
      const res = await fetch("/api/producers");
      if (!res.ok) throw new Error("Failed to fetch producers");
      return res.json();
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 pb-12 px-4 md:px-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Producers</h1>
        {isLoading && <p>Loading producers...</p>}
        {error && <p>Failed to load producers</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {data?.map((p) => (
            <Link key={p.id} href={`/producer/${p.id}`}>
              <a>
                <Card className="p-6 hover:shadow-lg transition">
                  <div className="flex items-center gap-4">
                    <img
                      src={p.profileImage || "/placeholder-avatar.png"}
                      alt={p.businessName || p.fullName || "Producer"}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="text-lg font-semibold">
                        {p.businessName || p.fullName}
                      </h3>
                      {p.fullNameRw && (
                        <p className="text-sm text-muted-foreground">{p.fullNameRw}</p>
                      )}
                      {p.location && (
                        <p className="text-sm text-muted-foreground">{p.location}</p>
                      )}
                    </div>
                  </div>
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
