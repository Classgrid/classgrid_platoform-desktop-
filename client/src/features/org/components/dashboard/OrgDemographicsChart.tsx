import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/marketing_ui/card";
import { Spinner } from "@/components/marketing_ui/spinner";
import { useOrgDashboardAnalytics } from "../../queries/useOrgDashboard";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface OrgDemographicsChartProps {
  profile: any;
}

const COLORS = ["#10b981", "#059669", "#6ee7b7"];

export function OrgDemographicsChart({ profile }: OrgDemographicsChartProps) {
  const { data, isLoading } = useOrgDashboardAnalytics();
  
  const rawDemo = data?.demographics || {};
  
  const chartData = [
    { name: "Male", value: rawDemo.male || 0 },
    { name: "Female", value: rawDemo.female || 0 },
    ...(rawDemo.other ? [{ name: "Other", value: rawDemo.other }] : [])
  ].filter(item => item.value > 0);

  const total = chartData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{`${profile?.terminology?.learner || "Student"} Demographics`}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center bg-muted/5 rounded-md">
            <Spinner size="lg" />
          </div>
        ) : total === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-md">
            No demographic data available.
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${value} ${profile?.terminology?.learner || "Student"}s`, "Count"]}
                  contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
