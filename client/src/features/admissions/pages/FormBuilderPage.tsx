import { useState, useEffect } from "react";
import { Loader2, Save, FileText, LayoutList } from "lucide-react";
import { CgPageShell, CgSectionPanel, CgAlert, CgBadge } from "@/components/classgrid";
import { useMasterFieldPool, useMasterDocumentPool, useAdmissionConfig, useUpdateAdmissionConfig } from "../queries/useAdmissionConfig";

// ═══════════════════════════════════════════════════════════════
// FormBuilderPage — Phase 2.5: UI for Fields AND Documents
// ═══════════════════════════════════════════════════════════════

type FieldToggle = {
  key: string;
  admission: boolean;
  onboarding: boolean;
  is_required?: boolean;
};

type DocToggle = {
  key: string;
  admission: boolean;
  onboarding: boolean;
};

export function FormBuilderPage() {
  const { data: poolData, isLoading: poolLoading, isError: poolError } = useMasterFieldPool();
  const { data: docPoolData, isLoading: docLoading, isError: docError } = useMasterDocumentPool();
  const { data: configResponse, isLoading: configLoading, isError: configError } = useAdmissionConfig();
  const updateConfig = useUpdateAdmissionConfig();

  const [activeTab, setActiveTab] = useState<"fields" | "documents">("fields");
  const [searchQuery, setSearchQuery] = useState("");

  // Local state for the toggles before saving
  const [toggles, setToggles] = useState<Record<string, FieldToggle>>({});
  const [docToggles, setDocToggles] = useState<Record<string, DocToggle>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize state from backend data
  useEffect(() => {
    if (configResponse && poolData && docPoolData && !isInitialized) {
      const existingToggles = configResponse.config?.form_builder_config?.field_toggles || [];
      const toggleMap: Record<string, FieldToggle> = {};
      existingToggles.forEach((t: FieldToggle) => toggleMap[t.key] = t);

      const existingDocToggles = configResponse.config?.form_builder_config?.document_toggles || [];
      const docToggleMap: Record<string, DocToggle> = {};
      existingDocToggles.forEach((t: DocToggle) => docToggleMap[t.key] = t);

      setToggles(toggleMap);
      setDocToggles(docToggleMap);
      setIsInitialized(true);
    }
  }, [configResponse, poolData, docPoolData, isInitialized]);

  const handleToggleChange = (fieldKey: string, prop: keyof FieldToggle, value: boolean) => {
    setToggles(prev => {
      const current = prev[fieldKey] || { key: fieldKey, admission: false, onboarding: false, is_required: false };
      return { ...prev, [fieldKey]: { ...current, [prop]: value } };
    });
  };

  const handleDocToggleChange = (docKey: string, prop: keyof DocToggle, value: boolean) => {
    setDocToggles(prev => {
      const current = prev[docKey] || { key: docKey, admission: false, onboarding: false };
      return { ...prev, [docKey]: { ...current, [prop]: value } };
    });
  };

  const handleSave = () => {
    const fieldTogglesArray = Object.values(toggles).filter(t => t.admission || t.onboarding);
    const docTogglesArray = Object.values(docToggles).filter(t => t.admission || t.onboarding);

    updateConfig.mutate({
      admission_config: {
        form_builder_config: {
          ...configResponse?.config?.form_builder_config,
          field_toggles: fieldTogglesArray,
          document_toggles: docTogglesArray
        }
      }
    });
  };

  if (poolLoading || configLoading || docLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
        <Loader2 size={24} className="cg-spin" />
      </div>
    );
  }

  if (poolError || configError || docError) {
    return (
      <CgPageShell title="Form Builder">
        <CgAlert variant="danger" title="API Error">Could not connect to backend services.</CgAlert>
      </CgPageShell>
    );
  }

  return (
    <CgPageShell
      title="Dynamic Form Builder"
      description="Configure both the textual fields and the required document uploads for your admission pipeline."
      breadcrumbs={[
        { label: "Admissions", to: "/dept/admissions/dashboard" },
        { label: "Form Builder" },
      ]}
    >
      {updateConfig.isSuccess && (
        <CgAlert variant="success" title="Successfully Saved!">
          Your form fields and required documents have been updated across the entire portal.
        </CgAlert>
      )}

      {/* Floating Save Bar */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1rem 1.5rem",
        background: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
        borderRadius: "var(--radius)",
        marginBottom: "2rem",
        position: "sticky",
        top: "1rem",
        zIndex: 10,
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>Configure Form & Documents</h3>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "hsl(var(--muted-foreground))" }}>
            Select fields and document uploads below, then click save.
          </p>
        </div>
        <button 
          className="cg-btn cg-btn--primary" 
          onClick={handleSave} 
          disabled={updateConfig.isPending}
          style={{ padding: "0.75rem 1.5rem", fontSize: "1rem" }}
        >
          {updateConfig.isPending ? <Loader2 size={18} className="cg-spin" /> : <Save size={18} />}
          Save Form Configuration
        </button>
      </div>

      {/* TABS & SEARCH BAR */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", borderBottom: "1px solid hsl(var(--border))" }}>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            onClick={() => setActiveTab("fields")}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.75rem 1.5rem",
              background: activeTab === "fields" ? "hsl(var(--primary) / 0.1)" : "transparent",
              border: "none",
              borderBottom: activeTab === "fields" ? "2px solid hsl(var(--primary))" : "2px solid transparent",
              color: activeTab === "fields" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            <LayoutList size={18} /> Basic Fields
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.75rem 1.5rem",
              background: activeTab === "documents" ? "hsl(var(--primary) / 0.1)" : "transparent",
              border: "none",
              borderBottom: activeTab === "documents" ? "2px solid hsl(var(--primary))" : "2px solid transparent",
              color: activeTab === "documents" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            <FileText size={18} /> Document Uploads
          </button>
        </div>

        {/* SEARCH BAR */}
        <div style={{ paddingBottom: "0.5rem" }}>
          <input
            type="search"
            placeholder={activeTab === "fields" ? "Search 111+ fields..." : "Search documents..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "var(--radius)",
              border: "1px solid hsl(var(--border))",
              background: "hsl(var(--background))",
              width: "250px",
              fontSize: "0.9rem"
            }}
          />
        </div>
      </div>

      {/* ── FIELDS TAB ── */}
      {activeTab === "fields" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {Object.entries(poolData || {}).map(([sectionKey, section]: [string, any]) => {
            // Filter fields in this section
            const filteredFields = section.fields.filter((field: any) => 
              (field?.label || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
              (field?.key || "").toLowerCase().includes(searchQuery.toLowerCase())
            );

            // If a search query exists and no fields match, hide the section
            if (searchQuery && filteredFields.length === 0) return null;

            return (
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
                {filteredFields.map((field: any) => {
                  const currentToggle = toggles[field.key] || { admission: false, onboarding: false, is_required: false };
                  const isLocked = field.locked_by_cet;

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
                        <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", marginTop: "0.25rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                          <span style={{ background: "hsl(var(--muted))", padding: "0.1rem 0.4rem", borderRadius: "4px" }}>
                            {field.type}
                          </span>
                          {field.options && (
                            <span style={{ opacity: 0.8 }}>Options: {field.options.join(", ")}</span>
                          )}
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
          )})}
        </div>
      )}

      {/* ── DOCUMENTS TAB ── */}
      {activeTab === "documents" && (
        <CgSectionPanel title="Required Documents">
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "2fr 1fr 1fr", 
            gap: "1rem", 
            paddingBottom: "0.5rem",
            borderBottom: "1px solid hsl(var(--border))",
            fontWeight: 600,
            fontSize: "0.85rem",
            color: "hsl(var(--muted-foreground))"
          }}>
            <div>Document Name</div>
            <div style={{ textAlign: "center" }}>Upload in Admission Form</div>
            <div style={{ textAlign: "center" }}>Upload in Onboarding Form</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}>
            {docPoolData
              ?.filter((doc: any) => doc.label.toLowerCase().includes(searchQuery.toLowerCase()) || doc.key.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((doc: any) => {
              const currentToggle = docToggles[doc.key] || { admission: false, onboarding: false };

              return (
                <div key={doc.key} style={{ 
                  display: "grid", 
                  gridTemplateColumns: "2fr 1fr 1fr", 
                  gap: "1rem",
                  alignItems: "center",
                  padding: "0.75rem",
                  background: currentToggle.admission || currentToggle.onboarding ? "hsl(var(--primary) / 0.05)" : "transparent",
                  border: "1px solid",
                  borderColor: currentToggle.admission || currentToggle.onboarding ? "hsl(var(--primary) / 0.2)" : "hsl(var(--border))",
                  borderRadius: "var(--radius)"
                }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{doc.label}</div>
                    <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", marginTop: "0.25rem" }}>
                      <span style={{ background: "hsl(var(--muted))", padding: "0.1rem 0.4rem", borderRadius: "4px" }}>
                        file_upload
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <input 
                      type="checkbox" 
                      checked={currentToggle.admission} 
                      onChange={(e) => handleDocToggleChange(doc.key, "admission", e.target.checked)}
                      style={{ width: "18px", height: "18px", cursor: "pointer" }}
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <input 
                      type="checkbox" 
                      checked={currentToggle.onboarding} 
                      onChange={(e) => handleDocToggleChange(doc.key, "onboarding", e.target.checked)}
                      style={{ width: "18px", height: "18px", cursor: "pointer" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CgSectionPanel>
      )}

    </CgPageShell>
  );
}
