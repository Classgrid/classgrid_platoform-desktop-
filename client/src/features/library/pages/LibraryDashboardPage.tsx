import { AskAiPanel } from "@/components/ai/components/AskAiPanel";

export function LibraryDashboardPage() {
  return (
    <div className="flex flex-col w-full h-full relative bg-background">
      <AskAiPanel 
        open={true} 
        onOpenChange={() => {}} 
        variant="full-page"
        pageContext={{
          path: "/dept/library/dashboard",
          title: "Library Agent"
        }}
      />
    </div>
  );
}
