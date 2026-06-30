import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/marketing_ui/card";
import { Skeleton } from "@/components/marketing_ui/skeleton";
import { useOrgDashboardAnalytics } from "../../queries/useOrgDashboard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface OrgEnrollmentChartProps {
  profile?: any;
}

export function OrgEnrollmentChart({ profile }: OrgEnrollmentChartProps) {
  const { data, isLoading } = useOrgDashboardAnalytics();
  
  const chartData = data?.enrollmentTrends || data?.analytics?.enrollmentTrends || [];

  // Map the data gracefully just in case the backend uses 'count' instead of 'newUsers'
  const normalizedData = chartData.map((d: any) => ({
    month: d.month,
    value: d.count !== undefined ? d.count : (d.newUsers || 0)
  }));

  const hasData = normalizedData.length > 0 && normalizedData.some(d => d.value > 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Enrollment Trends</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center bg-muted/5 rounded-md">
            <div className="flex space-x-2 items-end h-32 w-full max-w-sm justify-center">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="w-8 rounded-t-sm"  />
              ))}
            </div>
          </div>
        ) : !hasData ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-md">
            No enrollment trend data available.
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={normalizedData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  allowDecimals={false}
                />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted)/0.4)' }}
                  formatter={(value: number) => [value, profile?.terminology?.learner ? `${profile.terminology.learner}s` : "Students"]}
                  contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}
                />
                <Bar 
                  dataKey="value" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
