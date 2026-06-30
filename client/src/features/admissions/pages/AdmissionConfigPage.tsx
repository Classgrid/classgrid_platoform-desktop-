import { Loader2, Save } from "lucide-react";

import { useAdmissionConfig, useUpdateAdmissionConfig } from "../queries/useAdmissionConfig";

export function AdmissionConfigPage() {
  const { data: configResponse, isLoading, isError } = useAdmissionConfig();
  const update = useUpdateAdmissionConfig();

  if (isLoading) return <div ><Loader2 size={24} className="animate-spin" /></div>;
  if (isError || !configResponse) return <div title="Admission Config" breadcrumbs={[{ label: "Admissions", to: "/dept/admissions/dashboard" }, { label: "Config" }]}><div variant="danger" title="Error">Could not load config.</div></div>;

  const cfg = configResponse.config || {};

  return (
    <div title="Admission Configuration" description="Portal settings, workflow execution, and admission round management." breadcrumbs={[{ label: "Admissions", to: "/dept/admissions/dashboard" }, { label: "Config" }]}>
      {update.isSuccess && <div variant="success" title="Saved">Configuration updated.</div>}

      <div >
        {/* Portal & Strategy */}
        <div title="Portal Settings">
          <div >
            <div>
              <strong>Structure Type:</strong>{" "}
              <div variant="info">{configResponse.structure_type?.replace(/_/g, " ")}</div>
            </div>
            <div>
              <strong>Portal Status:</strong>{" "}
              {cfg.is_portal_open
                ? <div variant="success">Open</div>
                : <div variant="neutral">Closed</div>}
            </div>
            <div>
              <strong>Merit List:</strong>{" "}
              {cfg.is_merit_list_published
                ? <div variant="success">Published</div>
                : <div variant="neutral">Unpublished</div>}
            </div>
            <div><strong>Registration Fee:</strong> ₹{cfg.registration_fee || 0}</div>
            <div><strong>Max Apps per Student:</strong> {cfg.max_applications_per_student || 1}</div>
          </div>
        </div>

        {/* Round Management */}
        <div title="Rounds & Deadlines">
          <div >
            <div><strong>Current Round:</strong> {cfg.admission_round?.current_round || 1} / {cfg.admission_round?.max_rounds || 3}</div>
            <div>
              <strong>Waitlist:</strong>{" "}
              {cfg.waitlist_and_deadlines?.waitlist_enabled
                ? <div variant="success">Enabled</div>
                : <div variant="neutral">Disabled</div>}
            </div>
            <div>
              <strong>Auto-Promote Waitlist:</strong>{" "}
              {cfg.waitlist_and_deadlines?.auto_promote_waitlist
                ? <div variant="success">Auto</div>
                : <div variant="neutral">Manual</div>}
            </div>
            <div><strong>Fee Deadline:</strong> {cfg.waitlist_and_deadlines?.fee_payment_deadline_hours || 48}h after selection</div>
            {cfg.cutoff_date && (
              <div><strong>Cutoff Date:</strong> {new Date(cfg.cutoff_date).toLocaleDateString("en-IN")}</div>
            )}
          </div>
        </div>

        {/* Workflow Execution */}
        <div title="Workflow Execution">
          <div >
            <div>
              <strong>Document Verification:</strong>{" "}
              {cfg.workflow_execution?.require_admin_document_verification
                ? <div variant="info">Admin Approval Required</div>
                : <div variant="neutral">Bypassed</div>}
            </div>
            <div>
              <strong>PRN Generation:</strong>{" "}
              <div variant="info">{(cfg.workflow_execution?.prn_generation || "post_fee_payment").replace(/_/g, " ")}</div>
            </div>
            <div>
              <strong>Credential Dispatch:</strong>{" "}
              <div variant="info">{(cfg.workflow_execution?.login_credential_dispatch || "post_fee_payment").replace(/_/g, " ")}</div>
            </div>
          </div>
        </div>

        {/* Seat Matrix */}
        {cfg.seat_matrix_policy?.enabled && (
          <div title="Seat Matrix Policy">
            <div >
              {(cfg.seat_matrix_policy.categories || []).map((cat) => (
                <div key={cat.category_name} >
                  <span>{cat.category_name}</span>
                  <div variant="info" size="sm">{cat.reservation_percentage}%</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      {cfg.instructions && (
        <div title="Portal Instructions">
          <p className="  ">{cfg.instructions}</p>
        </div>
      )}
    </div>
  );
}
