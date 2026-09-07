import { AskAiPanel } from "@/components/ai/components/AskAiPanel";

export function FeesDashboardPage() {
  return (
    <div className="flex flex-col w-full h-full relative bg-background">
      <AskAiPanel 
        open={true} 
        onOpenChange={() => {}} 
        variant="full-page"
        pageContext={{
          path: "/dept/fees/dashboard",
          title: "Fees Agent"
        }}
      />
    </div>
  );
}
