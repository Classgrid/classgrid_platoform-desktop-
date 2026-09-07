import { AskAiPanel } from "@/components/ai/components/AskAiPanel";

export function AttendanceDashboardPage() {
  return (
    <div className="flex flex-col w-full h-[calc(100vh-theme(spacing.16))] relative bg-background">
      <AskAiPanel 
        open={true} 
        onOpenChange={() => {}} 
        variant="full-page"
        pageContext={{
          title: "AttendanceDashboardPage"
        }}
      />
    </div>
  );
}
