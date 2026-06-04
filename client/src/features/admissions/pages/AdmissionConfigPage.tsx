import { Loader2, Save } from "lucide-react";
import { CgPageShell, CgSectionPanel, CgSelect, CgBadge, CgAlert } from "@/components/classgrid";
import { useAdmissionConfig, useUpdateAdmissionConfig } from "../queries/useAdmissionConfig";

export function AdmissionConfigPage() {
  const { data: configResponse, isLoading, isError } = useAdmissionConfig();
  const update = useUpdateAdmissionConfig();

  if (isLoading) return <div className="cg-loading"><Loader2 size={24} className="cg-spin" /></div>;
  if (isError || !configResponse) return <CgPageShell title="Admission Config" breadcrumbs={[{ label: "Admissions", to: "/dept/admissions/dashboard" }, { label: "Config" }]}><CgAlert variant="danger" title="Error">Could not load config.</CgAlert></CgPageShell>;

  const cfg = configResponse.config || {};

  return (
    <CgPageShell title="Admission Configuration" description="Portal settings, workflow execution, and admission round management." breadcrumbs={[{ label: "Admissions", to: "/dept/admissions/dashboard" }, { label: "Config" }]}>
      {update.isSuccess && <CgAlert variant="success" title="Saved">Configuration updated.</CgAlert>}

      <div className="cg-grid-2col">
        {/* Portal & Strategy */}
        <CgSectionPanel title="Portal Settings">
          <div className="cg-flex-col">
            <div>
              <strong>Structure Type:</strong>{" "}
              <CgBadge variant="info">{configResponse.structure_type?.replace(/_/g, " ")}</CgBadge>
            </div>
            <div>
              <strong>Portal Status:</strong>{" "}
              {cfg.is_portal_open
                ? <CgBadge variant="success">Open</CgBadge>
                : <CgBadge variant="neutral">Closed</CgBadge>}
            </div>
            <div>
              <strong>Merit List:</strong>{" "}
              {cfg.is_merit_list_published
                ? <CgBadge variant="success">Published</CgBadge>
                : <CgBadge variant="neutral">Unpublished</CgBadge>}
            </div>
            <div><strong>Registration Fee:</strong> ₹{cfg.registration_fee || 0}</div>
            <div><strong>Max Apps per Student:</strong> {cfg.max_applications_per_student || 1}</div>
          </div>
        </CgSectionPanel>

        {/* Round Management */}
        <CgSectionPanel title="Rounds & Deadlines">
          <div className="cg-flex-col">
            <div><strong>Current Round:</strong> {cfg.admission_round?.current_round || 1} / {cfg.admission_round?.max_rounds || 3}</div>
            <div>
              <strong>Waitlist:</strong>{" "}
              {cfg.waitlist_and_deadlines?.waitlist_enabled
                ? <CgBadge variant="success">Enabled</CgBadge>
                : <CgBadge variant="neutral">Disabled</CgBadge>}
            </div>
            <div>
              <strong>Auto-Promote Waitlist:</strong>{" "}
              {cfg.waitlist_and_deadlines?.auto_promote_waitlist
                ? <CgBadge variant="success">Auto</CgBadge>
                : <CgBadge variant="neutral">Manual</CgBadge>}
            </div>
            <div><strong>Fee Deadline:</strong> {cfg.waitlist_and_deadlines?.fee_payment_deadline_hours || 48}h after selection</div>
            {cfg.cutoff_date && (
              <div><strong>Cutoff Date:</strong> {new Date(cfg.cutoff_date).toLocaleDateString("en-IN")}</div>
            )}
          </div>
        </CgSectionPanel>

        {/* Workflow Execution */}
        <CgSectionPanel title="Workflow Execution">
          <div className="cg-flex-col">
            <div>
              <strong>Document Verification:</strong>{" "}
              {cfg.workflow_execution?.require_admin_document_verification
                ? <CgBadge variant="info">Admin Approval Required</CgBadge>
                : <CgBadge variant="neutral">Bypassed</CgBadge>}
            </div>
            <div>
              <strong>PRN Generation:</strong>{" "}
              <CgBadge variant="info">{(cfg.workflow_execution?.prn_generation || "post_fee_payment").replace(/_/g, " ")}</CgBadge>
            </div>
            <div>
              <strong>Credential Dispatch:</strong>{" "}
              <CgBadge variant="info">{(cfg.workflow_execution?.login_credential_dispatch || "post_fee_payment").replace(/_/g, " ")}</CgBadge>
            </div>
          </div>
        </CgSectionPanel>

        {/* Seat Matrix */}
        {cfg.seat_matrix_policy?.enabled && (
          <CgSectionPanel title="Seat Matrix Policy">
            <div className="cg-flex-col-sm">
              {(cfg.seat_matrix_policy.categories || []).map((cat) => (
                <div key={cat.category_name} className="cg-config-row">
                  <span>{cat.category_name}</span>
                  <CgBadge variant="info" size="sm">{cat.reservation_percentage}%</CgBadge>
                </div>
              ))}
            </div>
          </CgSectionPanel>
        )}
      </div>

      {/* Instructions */}
      {cfg.instructions && (
        <CgSectionPanel title="Portal Instructions">
          <p className="cg-whitespace-pre cg-text-muted cg-text-body">{cfg.instructions}</p>
        </CgSectionPanel>
      )}
    </CgPageShell>
  );
}
