import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn/card";
import { CheckCircle, FileText, BookOpen, Mic } from "lucide-react";
import { StudentAnalytics } from "../../queries/useStudentDashboard";
import { Progress } from "@/components/shadcn/progress";

export function PerformanceMetricsGrid({ data }: { data?: StudentAnalytics }) {
  if (!data) return null;

  const { overview } = data;

  const metrics = [
    {
      title: "Attendance",
      value: overview.attendance,
      icon: CheckCircle,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      progressColor: "bg-blue-500",
      desc: `${data.counts.attendedSessions} / ${data.counts.totalSessions} Sessions`
    },
    {
      title: "Assignments",
      value: overview.assignmentCompletion,
      icon: FileText,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
      progressColor: "bg-indigo-500",
      desc: `${data.counts.assignmentsSubmitted} / ${data.counts.totalAssignments} Submitted`
    },
    {
      title: "Exams & Quizzes",
      value: overview.academicPerformance,
      icon: BookOpen,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      progressColor: "bg-emerald-500",
      desc: `${data.counts.examsTaken} Exams, ${data.counts.quizzesTaken} Quizzes`
    },
    {
      title: "AI Viva Score",
      value: (overview.vivaScore / 5) * 100, // Normalized to 100% for progress bar
      displayValue: overview.vivaScore,
      icon: Mic,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      progressColor: "bg-purple-500",
      desc: `${data.counts.vivaSessions} Sessions completed`,
      isScore: true
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {metrics.map((m, i) => (
        <Card key={i} className="transition-all hover:shadow-md hover:border-primary/50 group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              {m.title}
            </CardTitle>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${m.bgColor} ${m.color}`}>
              <m.icon className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {m.isScore ? `${m.displayValue} / 5` : `${m.value}%`}
            </div>
            <Progress 
              value={m.value} 
              className="h-1.5 mb-2" 
              indicatorClassName={m.progressColor} 
            />
            <p className="text-xs text-muted-foreground">
              {m.desc}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
