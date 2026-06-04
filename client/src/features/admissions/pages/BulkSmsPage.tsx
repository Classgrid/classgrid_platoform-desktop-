import { useQuery } from "@tanstack/react-query";
import { Loader2, MessageSquare } from "lucide-react";
import { CgPageShell, CgSectionPanel, CgAlert, CgMetricCard } from "@/components/classgrid";
import { getSmsBudget } from "../api";

export function BulkSmsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["sms-budget"],
    queryFn: getSmsBudget
  });

  return (
    <CgPageShell
      title="Bulk SMS / WhatsApp"
      description="Manage SMS credits and broadcast messages."
      breadcrumbs={[
        { label: "Admissions", to: "/dept/admissions/dashboard" },
        { label: "Bulk SMS / WhatsApp" }
      ]}
    >
      {isError && <CgAlert variant="danger" title="Error">Could not fetch SMS budget.</CgAlert>}
      
      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}><Loader2 size={24} className="cg-spin" /></div>
      ) : (
        <>
          <div className="cg-stats-grid">
            <CgMetricCard title="Daily Limit" value={(data?.daily_limit ?? 0).toLocaleString()} icon={<MessageSquare size={20} />} />
            <CgMetricCard title="Sent Today" value={(data?.sent_today ?? 0).toLocaleString()} icon={<MessageSquare size={20} />} />
            <CgMetricCard title="Remaining" value={(data?.remaining ?? 0).toLocaleString()} icon={<MessageSquare size={20} />} />
            <CgMetricCard title="Monthly Total" value={(data?.total_sent_this_month ?? 0).toLocaleString()} icon={<MessageSquare size={20} />} />
          </div>

          <CgSectionPanel title="Send Custom Broadcast" description="Coming soon. For automated reminders, use the Communication tab.">
            <button className="cg-btn cg-btn--outline" disabled>Compose Broadcast</button>
          </CgSectionPanel>
        </>
      )}
    </CgPageShell>
  );
}
