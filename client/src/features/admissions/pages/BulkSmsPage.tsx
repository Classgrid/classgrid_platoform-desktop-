import { useQuery } from "@tanstack/react-query";
import { Loader2, MessageSquare } from "lucide-react";
import { StatCard } from "@/components/marketing_ui/StatCard";
import { getSmsBudget } from "../api";

export function BulkSmsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["sms-budget"],
    queryFn: getSmsBudget
  });

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bulk SMS / WhatsApp</h1>
          <p className="text-muted-foreground mt-1">Manage SMS credits and broadcast messages.</p>
        </div>
      </div>

      {isError && (
        <div className="bg-red-100 text-red-800 p-4 rounded-md border border-red-200">
          <strong>Error</strong>
          <br/>Could not fetch SMS budget.
        </div>
      )}
      
      {isLoading ? (
        <div style={{ display: "flex", justifyCenter: "center", padding: "4rem" }}><Loader2 size={24} className="animate-spin text-primary" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Daily Limit" value={(data?.daily_limit ?? 0).toLocaleString()} icon={<MessageSquare size={20} />} />
            <StatCard title="Sent Today" value={(data?.sent_today ?? 0).toLocaleString()} icon={<MessageSquare size={20} />} />
            <StatCard title="Remaining" value={(data?.remaining ?? 0).toLocaleString()} icon={<MessageSquare size={20} />} />
            <StatCard title="Monthly Total" value={(data?.total_sent_this_month ?? 0).toLocaleString()} icon={<MessageSquare size={20} />} />
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm">
            <div className="p-5 border-b border-border">
              <h2 className="text-lg font-bold">Send Custom Broadcast</h2>
              <p className="text-sm text-muted-foreground mt-1">Coming soon. For automated reminders, use the Communication tab.</p>
            </div>
            <div className="p-5">
              <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 opacity-50 cursor-not-allowed" disabled>Compose Broadcast</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
