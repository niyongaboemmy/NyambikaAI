import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function OrdersSkeleton() {
  return (
    <div className="pt-10">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 rounded-2xl">
        <div className="max-w-6xl mx-auto px-2 sm:px-3 md:px-3 py-2 md:pl-3 sm:py-3">
          <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-0">
            <Skeleton className="h-8 w-16 rounded-lg" />
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl" />
              <div>
                <Skeleton className="h-5 w-24 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      </div>

      {/* Orders Grid Skeleton */}
      <div className="w-full py-2 pt-3">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {[...Array(4)].map((_, index) => (
            <Card
              key={index}
              className="group relative rounded-2xl overflow-hidden bg-white/70 dark:bg-slate-800/40 backdrop-blur-xl border border-white/20 dark:border-none"
              style={{
                animationDelay: `${index * 100}ms`,
                animation: "fadeInUp 0.6s ease-out forwards",
              }}
            >
              {/* Progress bar skeleton */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
                <Skeleton className="h-full w-3/4" />
              </div>

              <CardContent className="relative z-10 p-4 sm:p-5">
                {/* Order Header Skeleton */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3">
                    <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                        <Skeleton className="h-6 w-24" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-36" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items Preview Skeleton */}
                <div className="mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {[...Array(3)].map((_, idx) => (
                        <Skeleton
                          key={idx}
                          className="w-10 h-10 rounded-full"
                          style={{ zIndex: 3 - idx }}
                        />
                      ))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Skeleton className="h-4 w-48 mb-1" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                </div>

                {/* Shipping Info Skeleton */}
                <div className="mb-4">
                  <Skeleton className="h-4 w-56" />
                </div>

                {/* Action Buttons Skeleton */}
                <div className="flex gap-1 sm:gap-2 md:gap-3 w-max">
                  <Skeleton className="h-10 w-32 rounded-full" />
                  <Skeleton className="h-10 w-24 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
