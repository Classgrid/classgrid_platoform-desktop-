import { Card, CardContent, CardHeader, CardTitle } from "@/components/marketing_ui/card";
import { StudentAnalytics } from "../../queries/useStudentDashboard";
import { Lightbulb, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/marketing_ui/badge";

export function InsightsWidget({ data }: { data?: StudentAnalytics }) {
  if (!data) return null;

  const hasStrong = data.insights.strongAreas && data.insights.strongAreas.length > 0;
  const hasWeak = data.insights.weakAreas && data.insights.weakAreas.length > 0;

  if (!hasStrong && !hasWeak) return null;

  return (
    <Card className="bg-gradient-to-r from-card to-secondary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
          <Lightbulb className="w-4 h-4" />
          Focus Areas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-6">
          {hasStrong && (
            <div className="flex-1 space-y-3">
              <h4 className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 uppercase">
                <TrendingUp className="w-3.5 h-3.5" />
                Strong Areas
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.insights.strongAreas.map((area, i) => (
                  <Badge key={i} variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20">
                    {area.area}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {hasWeak && (
            <div className="flex-1 space-y-3">
              <h4 className="text-xs font-medium text-orange-600 dark:text-orange-400 flex items-center gap-1.5 uppercase">
                <TrendingDown className="w-3.5 h-3.5" />
                Needs Attention
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.insights.weakAreas.map((area, i) => (
                  <Badge key={i} variant="outline" className="bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 border-orange-500/20">
                    {area.area}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
