import { Card, CardContent } from "@/components/shadcn/card";
import { Sparkles, Activity } from "lucide-react";
import { AiSummary } from "../../queries/useStudentDashboard";

export function AiCounselorCard({ data }: { data?: AiSummary }) {
  if (!data) return null;

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5 shadow-sm">
      {/* Decorative background blur */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          {/* Health Score Dial */}
          <div className="shrink-0 flex flex-col items-center justify-center p-4 bg-background/50 rounded-2xl border shadow-inner backdrop-blur-sm min-w-[140px]">
            <div className="relative flex items-center justify-center w-20 h-20">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="40" cy="40" r="36" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={226}
                  strokeDashoffset={226 - (226 * data.healthScore) / 100}
                  className="text-primary transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{data.healthScore}</span>
              </div>
            </div>
            <span className="text-xs font-medium text-muted-foreground mt-2 uppercase tracking-wider flex items-center gap-1">
              <Activity className="w-3 h-3" />
              Health Score
            </span>
          </div>

          {/* AI Summary Text */}
          <div className="flex-1 space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Counselor Insights
            </h3>
            <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
              {data.summary}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
