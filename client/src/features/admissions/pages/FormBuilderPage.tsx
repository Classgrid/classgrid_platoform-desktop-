import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import { CgPageShell, CgSectionPanel, CgAlert, CgBadge } from "@/components/classgrid";
import { useMasterFieldPool, useAdmissionConfig, useUpdateAdmissionConfig } from "../queries/useAdmissionConfig";

// ═══════════════════════════════════════════════════════════════
// FormBuilderPage — Phase 2: Real UI for Field Toggles
// ═══════════════════════════════════════════════════════════════

type FieldToggle = {
  key: string;
  admission: boolean;
  onboarding: boolean;
  is_required?: boolean;
};

export function FormBuilderPage() {
  const { data: poolData, isLoading: poolLoading, isError: poolError } = useMasterFieldPool();
  const { data: configResponse, isLoading: configLoading, isError: configError } = useAdmissionConfig();
  const updateConfig = useUpdateAdmissionConfig();

  // Local state for the toggles before saving
  const [toggles, setToggles] = useState<Record<string, FieldToggle>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize state from backend data
  useEffect(() => {
    if (configResponse && poolData && !isInitialized) {
      const existingToggles = configResponse.config?.form_builder_config?.field_toggles || [];
      const toggleMap: Record<string, FieldToggle> = {};
      
      // Convert array to map for easy O(1) lookups and updates
      existingToggles.forEach((t: FieldToggle) => {
        toggleMap[t.key] = t;
      });

      setToggles(toggleMap);
      setIsInitialized(true);
    }
  }, [configResponse, poolData, isInitialized]);

  const handleToggleChange = (fieldKey: string, prop: keyof FieldToggle, value: boolean) => {
    setToggles(prev => {
      const current = prev[fieldKey] || { key: fieldKey, admission: false, onboarding: false, is_required: false };
      return {
        ...prev,
        [fieldKey]: { ...current, [prop]: value }
      };
    });
  };

  const handleSave = () => {
    // Convert map back to array for backend
    const fieldTogglesArray = Object.values(toggles).filter(t => t.admission || t.onboarding);

    updateConfig.mutate({
      admission_config: {
        form_builder_config: {
          ...configResponse?.config?.form_builder_config,
          field_toggles: fieldTogglesArray
        }
      }
    });
  };

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
        <CgAlert variant="danger" title="API Error">Could not connect to backend services.</CgAlert>
      </CgPageShell>
    );
  }

  return (
    <CgPageShell
      title="Dynamic Form Builder"
      description="Select which fields candidates see during Admission and Onboarding. Connected directly to your master strategy engine."
      breadcrumbs={[
        { label: "Admissions", to: "/dept/admissions/dashboard" },
        { label: "Form Builder" },
      ]}
      actions={
        <button 
          className="cg-btn cg-btn--primary" 
          onClick={handleSave} 
          disabled={updateConfig.isPending}
        >
          {updateConfig.isPending ? <Loader2 size={16} className="cg-spin" /> : <Save size={16} />}
          Save Form Configuration
        </button>
      }
    >
      {updateConfig.isSuccess && (
        <CgAlert variant="success" title="Successfully Saved!">
          Your admission form fields have been updated across the entire portal.
        </CgAlert>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {Object.entries(poolData || {}).map(([sectionKey, section]: [string, any]) => (
          <CgSectionPanel key={sectionKey} title={section.label}>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "2fr 1fr 1fr 1fr", 
              gap: "1rem", 
              paddingBottom: "0.5rem",
              borderBottom: "1px solid hsl(var(--border))",
              fontWeight: 600,
              fontSize: "0.85rem",
              color: "hsl(var(--muted-foreground))"
            }}>
              <div>Field Name</div>
              <div style={{ textAlign: "center" }}>Admission Form</div>
              <div style={{ textAlign: "center" }}>Onboarding Form</div>
              <div style={{ textAlign: "center" }}>Required</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}>
              {section.fields.map((field: any) => {
                const currentToggle = toggles[field.key] || { admission: false, onboarding: false, is_required: false };
                const isLocked = field.locked_by_cet; // Engineering locked fields

                return (
                  <div key={field.key} style={{ 
                    display: "grid", 
                    gridTemplateColumns: "2fr 1fr 1fr 1fr", 
                    gap: "1rem",
                    alignItems: "center",
                    padding: "0.75rem",
                    background: currentToggle.admission || currentToggle.onboarding ? "hsl(var(--primary) / 0.05)" : "transparent",
                    border: "1px solid",
                    borderColor: currentToggle.admission || currentToggle.onboarding ? "hsl(var(--primary) / 0.2)" : "hsl(var(--border))",
                    borderRadius: "var(--radius)"
                  }}>
                    <div>
                      <div style={{ fontWeight: 500, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {field.label}
                        {isLocked && <CgBadge variant="warning" size="sm">Locked by CET</CgBadge>}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>
                        Type: {field.type}
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <input 
                        type="checkbox" 
                        disabled={isLocked}
                        checked={currentToggle.admission || isLocked} 
                        onChange={(e) => handleToggleChange(field.key, "admission", e.target.checked)}
                        style={{ width: "18px", height: "18px", cursor: isLocked ? "not-allowed" : "pointer" }}
                      />
                    </div>

                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <input 
                        type="checkbox" 
                        disabled={isLocked}
                        checked={currentToggle.onboarding || isLocked} 
                        onChange={(e) => handleToggleChange(field.key, "onboarding", e.target.checked)}
                        style={{ width: "18px", height: "18px", cursor: isLocked ? "not-allowed" : "pointer" }}
                      />
                    </div>

                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <input 
                        type="checkbox" 
                        disabled={isLocked || (!currentToggle.admission && !currentToggle.onboarding)}
                        checked={currentToggle.is_required || isLocked} 
                        onChange={(e) => handleToggleChange(field.key, "is_required", e.target.checked)}
                        style={{ width: "18px", height: "18px", cursor: "pointer" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CgSectionPanel>
        ))}
      </div>
    </CgPageShell>
  );
}
