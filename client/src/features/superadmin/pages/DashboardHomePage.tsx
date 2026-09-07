import { AskAiPanel } from "@/components/ai/components/AskAiPanel";

export function DashboardHomePage() {
  return (
    <div className="flex flex-col w-full h-full relative bg-background">
      <AskAiPanel 
        open={true} 
        onOpenChange={() => {}} 
        variant="full-page"
        pageContext={{
          path: "/superadmin/dashboard",
          title: "Super Admin Agent"
        }}
      />
    </div>
  );
}
