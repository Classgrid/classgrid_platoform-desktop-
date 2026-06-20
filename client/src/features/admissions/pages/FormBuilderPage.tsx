import { CgPageShell, CgSectionPanel, CgAlert } from "@/components/classgrid";
import { useMasterFieldPool, useAdmissionConfig } from "../queries/useAdmissionConfig";
import { Loader2 } from "lucide-react";

export function FormBuilderPage() {
  // 1. Fetch the master field pool (~111 fields)
  const { data: poolData, isLoading: poolLoading, isError: poolError } = useMasterFieldPool();
  
  // 2. Fetch the current organization's config (toggles)
  const { data: configData, isLoading: configLoading, isError: configError } = useAdmissionConfig();

  if (poolLoading || configLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
        <Loader2 size={24} className="cg-spin" />
      </div>
    );
  }

  if (poolError || configError) {
    return (
      <CgPageShell title="Form Builder">
        <CgAlert variant="danger" title="API Error">
          Could not connect to backend services.
        </CgAlert>
      </CgPageShell>
    );
  }

  return (
    <CgPageShell
      title="[10% TEST] Form Builder Raw Data"
      description="If you see JSON here, the frontend is successfully talking to admission-form-builder.service.js"
      breadcrumbs={[
        { label: "Admissions", to: "/dept/admissions/dashboard" },
        { label: "Form Builder Test" },
      ]}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
        
        {/* Left Side: Master Field Pool from backend */}
        <CgSectionPanel title="1. MASTER FIELD POOL (Raw)">
          <div style={{ background: "#1e1e1e", color: "#00ff00", padding: "1rem", borderRadius: "8px", overflow: "auto", maxHeight: "600px", fontFamily: "monospace", fontSize: "12px" }}>
            <pre>{JSON.stringify(poolData, null, 2)}</pre>
          </div>
        </CgSectionPanel>

        {/* Right Side: Current Org Config from backend */}
        <CgSectionPanel title="2. CURRENT ORG CONFIG (Raw)">
          <div style={{ background: "#1e1e1e", color: "#00ffff", padding: "1rem", borderRadius: "8px", overflow: "auto", maxHeight: "600px", fontFamily: "monospace", fontSize: "12px" }}>
            <pre>{JSON.stringify(configData, null, 2)}</pre>
          </div>
        </CgSectionPanel>

      </div>
    </CgPageShell>
  );
}
