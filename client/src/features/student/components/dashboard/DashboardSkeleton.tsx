import { Skeleton } from "@/components/shadcn/skeleton";
import { Card, CardContent, CardHeader } from "@/components/shadcn/card";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* AI Card Skeleton */}
      <Card className="border-none shadow-none">
        <CardHeader className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </CardHeader>
      </Card>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Metrics Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Schedule Widget */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 items-center">
                  <Skeleton className="h-10 w-2 shrink-0 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Insights Widget */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="flex gap-2 flex-wrap">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-32 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </CardContent>
      </Card>
    </div>
  );
}
