import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Progress } from "@/components/shadcn/progress";
import { Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { OnboardingProgress } from "../../queries/useStudentDashboard";

export function OnboardingBanner({ data }: { data?: OnboardingProgress }) {
  if (!data || data.percentage === 100) return null;

  return (
    <Card className="bg-orange-500/10 border-orange-500/20 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-orange-700 dark:text-orange-400 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Complete Your Profile
        </CardTitle>
        <CardDescription className="text-orange-600/80 dark:text-orange-300/80">
          You have completed {data.completed} out of {data.total} steps.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Progress 
            value={data.percentage} 
            className="h-2 flex-1 bg-orange-200 dark:bg-orange-900/50" 
            indicatorClassName="bg-orange-500" 
          />
          <span className="text-sm font-medium text-orange-700 dark:text-orange-400">
            {data.percentage}%
          </span>
        </div>
        <div className="mt-4">
          <Link to="/student/profile" className="text-sm font-semibold text-orange-600 dark:text-orange-400 hover:underline">
            Resume Onboarding &rarr;
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
