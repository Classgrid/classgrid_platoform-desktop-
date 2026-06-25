import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/marketing_ui/card";
import { Skeleton } from "@/components/marketing_ui/skeleton";
import { Badge } from "@/components/marketing_ui/badge";
import { Button } from "@/components/marketing_ui/button";
import { useOrgDashboardActivity } from "../../queries/useOrgDashboard";

export function OrgActivityCard() {
  const { data: activityResp, isLoading: isActivityLoading } = useOrgDashboardActivity();
  const activities = activityResp?.activities || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {isActivityLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : activities.length > 0 ? (
          <>
            <div className="space-y-4">
              {activities.map((act: any) => (
                <div key={act._id} className="flex flex-col sm:flex-row sm:justify-between sm:items-start border-b border-border pb-3 last:border-0 gap-2 sm:gap-0">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5 uppercase tracking-wider">{act.type || "System"}</Badge>
                      <p className="font-medium text-sm text-foreground">{act.action || act.message}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      By: <span className="font-medium text-foreground">{typeof act.user_id === "object" ? act.user_id?.name || "System" : "System"}</span>
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(act.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-6">
              View Full Audit Logs
            </Button>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-lg">
            No recent activity logged.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
