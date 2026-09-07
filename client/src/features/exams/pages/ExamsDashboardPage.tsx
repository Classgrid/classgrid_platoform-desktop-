import { AskAiPanel } from "@/components/ai/components/AskAiPanel";

export function ExamsDashboardPage() {
  return (
    <div className="flex flex-col w-full h-full relative bg-background">
      <AskAiPanel 
        open={true} 
        onOpenChange={() => {}} 
        variant="full-page"
        pageContext={{
          path: "/dept/exams/dashboard",
          title: "Exams Agent"
        }}
      />
    </div>
  );
}
