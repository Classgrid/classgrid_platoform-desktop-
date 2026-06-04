import { Loader2 } from "lucide-react";
import { CgPageShell, CgSectionPanel, CgAlert, CgBadge } from "@/components/classgrid";
import { useAdmissionConfig } from "../queries/useAdmissionConfig";

export function FeeStructurePage() {
  const { data: configResponse, isLoading, isError } = useAdmissionConfig();

  if (isLoading) return <div className="cg-loading"><Loader2 size={24} className="cg-spin" /></div>;
  if (isError || !configResponse) return <CgPageShell title="Fee Structure" breadcrumbs={[{ label: "Admissions", to: "/dept/admissions/dashboard" }, { label: "Fee Structure" }]}><CgAlert variant="danger" title="Error">Could not load config.</CgAlert></CgPageShell>;

  const cfg = configResponse.config || {};
  const feeConfig = cfg.fee_config;

  return (
    <CgPageShell title="Fee Structure" description="Application fee, category-based mappings, and refund policy."
      breadcrumbs={[{ label: "Admissions", to: "/dept/admissions/dashboard" }, { label: "Fee Structure" }]}>

      <div className="cg-grid-2col">
        <CgSectionPanel title="Registration Fee">
          <div className="cg-flex-col">
            <div><strong>Registration Fee:</strong> ₹{cfg.registration_fee || 0}</div>
            <div>
              <strong>Portal Status:</strong>{" "}
              {cfg.is_portal_open
                ? <CgBadge variant="success">Open</CgBadge>
                : <CgBadge variant="danger">Closed</CgBadge>}
            </div>
          </div>
        </CgSectionPanel>

        {feeConfig && (
          <CgSectionPanel title="Fee Configuration">
            <div className="cg-flex-col">
              {feeConfig.admission_fee_structure_id && (
                <div><strong>Fee Structure ID:</strong> <code className="cg-text-micro">{feeConfig.admission_fee_structure_id}</code></div>
              )}
              {(feeConfig.dynamic_fee_mapping || []).length > 0 && (
                <div>
                  <strong>Category-Based Fee Mapping:</strong>
                  <div className="cg-mt-2 cg-flex-col-sm">
                    {feeConfig.dynamic_fee_mapping!.map((m, i) => (
                      <div key={i} className="cg-flex-row cg-text-caption">
                        <CgBadge variant="info" size="sm">{m.attribute_type}</CgBadge>
                        <span>{m.attribute}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {feeConfig.refund_policy?.enabled && (
                <div>
                  <strong>Refund Policy:</strong> Enabled
                  <div className="cg-mt-2">
                    {(feeConfig.refund_policy.rules || []).map((rule, i) => (
                      <div key={i} className="cg-text-caption">
                        {rule.days_before_start} days before session → {rule.refund_percentage}% refund
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {feeConfig.session_start_date && (
                <div><strong>Session Start:</strong> {new Date(feeConfig.session_start_date).toLocaleDateString("en-IN")}</div>
              )}
            </div>
          </CgSectionPanel>
        )}
      </div>
    </CgPageShell>
  );
}
