import { useState, useEffect } from "react";
import { Loader2, Plus, Trash2, Save, ToggleLeft, ToggleRight } from "lucide-react";
import { CgPageShell, CgSectionPanel, CgAlert, CgBadge } from "@/components/classgrid";
import { useAdmissionConfig, useUpdateAdmissionConfig } from "../queries/useAdmissionConfig";

// ═══════════════════════════════════════════════════════════════
// FormBuilderPage — Admin UI for managing form_builder_config
//
// The backend stores field_toggles, document_toggles, and
// custom_fields inside Organization.admission_config.form_builder_config
//
// GET /api/admission/config returns { config, form_schema }
// PATCH /api/admission/config updates the admission_config subdoc
// ═══════════════════════════════════════════════════════════════

type CustomField = {
  field_key: string;
  field_label: string;
  field_type: "text" | "number" | "date" | "dropdown" | "boolean" | "file";
  options?: string[];
  is_required: boolean;
  section: string;
  admission: boolean;
  onboarding: boolean;
};

export function FormBuilderPage() {
  const { data: configResponse, isLoading, isError } = useAdmissionConfig();
  const update = useUpdateAdmissionConfig();

  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Initialize from backend response
  useEffect(() => {
    if (configResponse && !initialized) {
      const cfg = configResponse.config || configResponse;
      const existing = (cfg.form_builder_config?.custom_fields || []) as CustomField[];
      setCustomFields(existing);
      setInitialized(true);
    }
  }, [configResponse, initialized]);

  const handleAddField = () => {
    setCustomFields([
      ...customFields,
      {
        field_key: `custom_${Date.now()}`,
        field_label: "New Field",
        field_type: "text",
        is_required: false,
        section: "other",
        admission: true,
        onboarding: false,
      },
    ]);
  };

  const handleUpdateField = (index: number, updates: Partial<CustomField>) => {
    const newFields = [...customFields];
    newFields[index] = { ...newFields[index], ...updates } as CustomField;
    setCustomFields(newFields);
  };

  const handleRemoveField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    update.mutate({
      admission_config: {
        form_builder_config: {
          custom_fields: customFields,
        },
      },
    } as any);
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
        <Loader2 size={24} className="cg-spin" />
      </div>
    );
  }

  if (isError || !configResponse) {
    return (
      <CgPageShell title="Form Builder" breadcrumbs={[{ label: "Admissions", to: "/dept/admissions/dashboard" }, { label: "Form Builder" }]}>
        <CgAlert variant="danger" title="Error">Could not load config.</CgAlert>
      </CgPageShell>
    );
  }

  // Extract form_schema for displaying current resolved fields
  const formSchema = configResponse.form_schema;

  return (
    <CgPageShell
      title="Dynamic Form Builder"
      description="Configure the admission application form. Toggle master fields and add custom fields."
      breadcrumbs={[
        { label: "Admissions", to: "/dept/admissions/dashboard" },
        { label: "Form Builder" },
      ]}
      actions={
        <button className="cg-btn cg-btn--primary" onClick={handleSave} disabled={update.isPending}>
          {update.isPending ? <Loader2 size={16} className="cg-spin" /> : <Save size={16} />}
          Save Configuration
        </button>
      }
    >
      {update.isSuccess && (
        <CgAlert variant="success" title="Saved">
          Form configuration synced. Changes will reflect on the live candidate portal immediately.
        </CgAlert>
      )}

      {/* Active Schema Preview */}
      {formSchema && (
        <CgSectionPanel title="Current Active Schema">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div>
              <h4 style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", color: "hsl(var(--muted-foreground))" }}>
                Required Fields ({formSchema.fields.required.length})
              </h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {formSchema.fields.required.map((f) => (
                  <CgBadge key={f.id} variant="info" size="sm">{f.label}</CgBadge>
                ))}
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", color: "hsl(var(--muted-foreground))" }}>
                Optional Fields ({formSchema.fields.optional.length})
              </h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {formSchema.fields.optional.map((f) => (
                  <CgBadge key={f.id} variant="neutral" size="sm">{f.label}</CgBadge>
                ))}
              </div>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <h4 style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", color: "hsl(var(--muted-foreground))" }}>
                Required Documents ({formSchema.documents.length})
              </h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {formSchema.documents.map((d) => (
                  <CgBadge key={d.id} variant="success" size="sm">{d.label}</CgBadge>
                ))}
              </div>
            </div>
          </div>
        </CgSectionPanel>
      )}

      {/* Custom Fields Builder */}
      <CgSectionPanel
        title="Custom Fields"
        actions={
          <button className="cg-btn cg-btn--outline cg-btn--sm" onClick={handleAddField}>
            <Plus size={14} /> Add Custom Field
          </button>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {customFields.map((field, index) => (
            <div
              key={field.field_key}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr auto auto auto",
                gap: "0.75rem",
                alignItems: "end",
                padding: "1rem",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
                background: "hsl(var(--background))",
              }}
            >
              <div className="cg-form__field" style={{ marginBottom: 0 }}>
                <label className="cg-form__label" style={{ fontSize: "0.75rem" }}>Label</label>
                <input
                  type="text" className="cg-form__input cg-form__input--sm"
                  value={field.field_label}
                  onChange={(e) => handleUpdateField(index, { field_label: e.target.value })}
                />
              </div>

              <div className="cg-form__field" style={{ marginBottom: 0 }}>
                <label className="cg-form__label" style={{ fontSize: "0.75rem" }}>Type</label>
                <select
                  className="cg-form__input cg-form__input--sm"
                  value={field.field_type}
                  onChange={(e) => handleUpdateField(index, { field_type: e.target.value as any })}
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="dropdown">Dropdown</option>
                  <option value="boolean">Yes/No</option>
                  <option value="file">File Upload</option>
                </select>
              </div>

              <div className="cg-form__field" style={{ marginBottom: 0 }}>
                <label className="cg-form__label" style={{ fontSize: "0.75rem" }}>Section</label>
                <select
                  className="cg-form__input cg-form__input--sm"
                  value={field.section}
                  onChange={(e) => handleUpdateField(index, { section: e.target.value })}
                >
                  <option value="personal">Personal</option>
                  <option value="academic">Academic</option>
                  <option value="family">Family</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", cursor: "pointer", height: "32px" }}>
                <input
                  type="checkbox" checked={field.is_required}
                  onChange={(e) => handleUpdateField(index, { is_required: e.target.checked })}
                />
                Required
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", cursor: "pointer", height: "32px" }}>
                <input
                  type="checkbox" checked={field.admission}
                  onChange={(e) => handleUpdateField(index, { admission: e.target.checked })}
                />
                Admission
              </label>

              <button
                className="cg-btn cg-btn--ghost cg-btn--sm"
                style={{ color: "hsl(var(--destructive))", height: "32px", padding: "0 0.5rem" }}
                onClick={() => handleRemoveField(index)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          {customFields.length === 0 && (
            <div style={{ padding: "3rem", textAlign: "center", border: "1px dashed hsl(var(--border))", borderRadius: "var(--radius)", color: "hsl(var(--muted-foreground))" }}>
              No custom fields defined. Use "Add Custom Field" to create institution-specific fields (e.g., Bus Route, Hostel Preference).
            </div>
          )}
        </div>
      </CgSectionPanel>
    </CgPageShell>
  );
}
