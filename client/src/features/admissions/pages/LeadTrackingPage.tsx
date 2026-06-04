import { CgPageShell, CgEmptyState } from "@/components/classgrid";

export function LeadTrackingPage() {
  return (
    <CgPageShell
      title="Lead Tracking (CRM)"
      description="Track potential leads, inquiries, and follow-ups."
      breadcrumbs={[
        { label: "Admissions", to: "/dept/admissions/dashboard" },
        { label: "Lead Tracking" }
      ]}
    >
      <CgEmptyState
        title="CRM Module Upcoming"
        description="Lead tracking and pre-admission inquiry management is coming soon."
      />
    </CgPageShell>
  );
}
