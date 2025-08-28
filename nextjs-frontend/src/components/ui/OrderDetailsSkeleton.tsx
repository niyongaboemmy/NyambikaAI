import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function OrderDetailsSkeleton() {
  return (
    <div className="min-h-screen pt-10 relative overflow-hidden px-1">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-900 rounded-2xl">
        <div className="max-w-6xl mx-auto px-2 sm:px-3 md:px-4 py-1.5 sm:py-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Skeleton className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg" />
              <div>
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      </div>

      <div className="py-2">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-2">
          {/* Main Content Skeleton */}
          <div className="lg:col-span-2 space-y-2">
            {/* Order Status Card Skeleton */}
            <Card className="relative overflow-hidden bg-gray-50 dark:bg-gray-900/50 dark:border-none">
              {/* Progress bar skeleton */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-800/50">
                <Skeleton className="h-full w-3/4" />
              </div>

              <CardHeader className="relative z-10">
                <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-0">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg" />
                    <div>
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-6 w-12 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative z-10 p-3 sm:p-4">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2 p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Skeleton className="h-4 w-4 rounded" />
                    <div className="flex-1">
                      <Skeleton className="h-3 w-16 mb-1" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-6 w-6 rounded" />
                  </div>
                  <Skeleton className="h-4 w-48" />
                </div>
              </CardContent>
            </Card>

            {/* Order Items Card Skeleton */}
            <Card className="relative overflow-hidden bg-gray-50 dark:bg-gray-900/50 dark:border-none">
              <CardHeader className="relative z-10 pb-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg" />
                  <div>
                    <Skeleton className="h-4 w-20 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative z-10 p-3">
                <div className="space-y-2 sm:space-y-3">
                  {[...Array(2)].map((_, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg"
                    >
                      <div className="relative flex-shrink-0 mx-auto sm:mx-0">
                        <Skeleton className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg" />
                        <Skeleton className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full" />
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <Skeleton className="h-4 w-32 mb-2" />
                        <div className="space-y-1">
                          <Skeleton className="h-3 w-20" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <div className="text-center sm:text-right space-y-1">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address Card Skeleton */}
            <Card className="relative overflow-hidden bg-gray-50 dark:bg-gray-900/50 dark:border-none">
              <CardHeader className="relative z-10 p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg" />
                  <div>
                    <Skeleton className="h-4 w-28 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative z-10 p-3 sm:p-4">
                <div className="p-2 sm:p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                    <Skeleton className="h-3 w-36" />
                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-3 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Skeleton */}
          <div className="space-y-2">
            {/* Order Summary Card Skeleton */}
            <Card className="relative overflow-hidden bg-gray-50 dark:bg-gray-900/50 dark:border-none">
              <CardHeader className="relative z-10 p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg" />
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative z-10 p-3 sm:p-4">
                <div className="p-2 sm:p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <div className="h-px bg-gray-200 dark:bg-gray-700" />
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Info Card Skeleton */}
            <Card className="relative overflow-hidden bg-gray-50 dark:bg-gray-900/50 dark:border-none">
              <CardHeader className="relative z-10 p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10 p-3 sm:p-4 space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-10" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>

            {/* Actions Card Skeleton */}
            <Card className="relative overflow-hidden bg-gray-50 dark:bg-gray-900/50 dark:border-none">
              <CardContent className="p-3 sm:p-4 space-y-2">
                <Skeleton className="h-8 w-full rounded-lg" />
                <Skeleton className="h-8 w-full rounded-lg" />
                <Skeleton className="h-8 w-full rounded-lg" />
                <Skeleton className="h-8 w-full rounded-lg" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
