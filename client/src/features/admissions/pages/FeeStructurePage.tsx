

import { useAdmissionConfig } from "../queries/useAdmissionConfig";
import { Spinner } from "@/components/marketing_ui/spinner";

export function FeeStructurePage() {
  const { data: configResponse, isLoading, isError } = useAdmissionConfig();

  if (isLoading) return <div ><size={24}  /></div>;
  if (isError || !configResponse) return <div title="Fee Structure" breadcrumbs={[{ label: "Admissions", to: "/dept/admissions/dashboard" }, { label: "Fee Structure" }]}><div variant="danger" title="Error">Could not load config.</div></div>;

  const cfg = configResponse.config || {};
  const feeConfig = cfg.fee_config;

  return (
    <div title="Fee Structure" description="Application fee, category-based mappings, and refund policy."
      breadcrumbs={[{ label: "Admissions", to: "/dept/admissions/dashboard" }, { label: "Fee Structure" }]}>

      <div >
        <div title="Registration Fee">
          <div >
            <div><strong>Registration Fee:</strong> ₹{cfg.registration_fee || 0}</div>
            <div>
              <strong>Portal Status:</strong>{" "}
              {cfg.is_portal_open
                ? <div variant="success">Open</div>
                : <div variant="danger">Closed</div>}
            </div>
          </div>
        </div>

        {feeConfig && (
          <div title="Fee Configuration">
            <div >
              {feeConfig.admission_fee_structure_id && (
                <div><strong>Fee Structure ID:</strong> <code >{feeConfig.admission_fee_structure_id}</code></div>
              )}
              {(feeConfig.dynamic_fee_mapping || []).length > 0 && (
                <div>
                  <strong>Category-Based Fee Mapping:</strong>
                  <div >
                    {feeConfig.dynamic_fee_mapping!.map((m, i) => (
                      <div key={i} >
                        <div variant="info" size="sm">{m.attribute_type}</div>
                        <span>{m.attribute}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {feeConfig.refund_policy?.enabled && (
                <div>
                  <strong>Refund Policy:</strong> Enabled
                  <div >
                    {(feeConfig.refund_policy.rules || []).map((rule, i) => (
                      <div key={i} >
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
          </div>
        )}
      </div>
    </div>
  );
}
