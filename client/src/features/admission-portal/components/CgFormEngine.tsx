import { useState, useEffect, useRef } from "react";
import type { FormSchema, FormSchemaField, EngineConfigResponse } from "../types";
import { CgSeatDisplay } from "./CgSeatDisplay";

// ═══════════════════════════════════════════════════════════════
// CgFormEngine — Dynamic form renderer driven by backend form_schema
//
// The backend's admission-form-builder.service.js returns:
//   { fields: { required: [...], optional: [...] }, documents: [...] }
//
// Each field has: id, label, type, options?, placeholder?, pattern?
// This engine maps those to real HTML inputs. Zero hardcoding.
// ═══════════════════════════════════════════════════════════════

type CgFormEngineProps = {
  formSchema: FormSchema;
  config: EngineConfigResponse["config"];
  seatData?: any;
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => void;
  onDraftSave?: (data: Record<string, any>) => void;
  isReadOnly?: boolean;
};

function normalizeType(type: string): string {
  // Backend uses "dropdown" for selects, normalize for HTML
  if (type === "dropdown") return "select";
  if (type === "boolean") return "checkbox";
  return type;
}

function FieldRenderer({
  field,
  value,
  onChange,
  disabled,
}: {
  field: FormSchemaField;
  value: any;
  onChange: (val: any) => void;
  disabled: boolean;
}) {
  const htmlType = normalizeType(field.type);

  if (htmlType === "select") {
    return (
      <select
        className="cg-form__input"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">Select {field.label}</option>
        {field.options?.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  if (htmlType === "checkbox") {
    return (
      <label className="cg-field-row__checkbox" style={{ cursor: disabled ? "default" : "pointer" }}>
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        {field.label}
      </label>
    );
  }

  return (
    <input
      type={htmlType}
      className="cg-form__input"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={field.placeholder}
      pattern={field.pattern}
      min={field.min}
      max={field.max}
      step={field.step}
    />
  );
}

export function CgFormEngine({
  formSchema,
  config,
  seatData,
  initialData = {},
  onSubmit,
  onDraftSave,
  isReadOnly = false,
}: CgFormEngineProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const lastSavedDataRef = useRef<Record<string, any>>(initialData);
  
  // Pagination State
  const sections = formSchema.sections || [];
  const hasSections = sections.length > 0;
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const currentSection = sections[currentSectionIndex];

  // Auto-save effect
  useEffect(() => {
    if (isReadOnly || !onDraftSave || !isDirty) return;

    const interval = setInterval(() => {
      const currentData = JSON.stringify(formData);
      const lastSavedData = JSON.stringify(lastSavedDataRef.current);
      
      if (currentData !== lastSavedData) {
        onDraftSave(formData);
        lastSavedDataRef.current = formData;
        setIsDirty(false);
      }
    }, 30000); // 30 seconds auto-save

    return () => clearInterval(interval);
  }, [formData, isDirty, isReadOnly, onDraftSave]);

  const handleChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    setIsDirty(true);
    if (errors[fieldId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  // Validates ONLY the current section (or whole form if no sections)
  const validateCurrentSection = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    
    const fieldsToValidate = hasSections 
      ? currentSection?.fields ?? []
      : [...formSchema.fields.required, ...formSchema.fields.optional];

    fieldsToValidate.forEach((field: any) => {
      const val = formData[field.id];
      if (field.is_required && (val === undefined || val === null || val === "")) {
        newErrors[field.id] = `${field.label} is required`;
        isValid = false;
      } else if (val && field.pattern) {
        const regex = new RegExp(field.pattern);
        if (!regex.test(val)) {
          newErrors[field.id] = `Invalid format for ${field.label}`;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    
    if (!isValid) {
      const firstErrorId = Object.keys(newErrors)[0];
      const errorElement = document.getElementById(`field-${firstErrorId}`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    return isValid;
  };

  const handleNext = () => {
    if (validateCurrentSection()) {
      // Auto-save on next
      if (isDirty && onDraftSave) {
        onDraftSave(formData);
        lastSavedDataRef.current = formData;
        setIsDirty(false);
      }
      setCurrentSectionIndex(i => i + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    setCurrentSectionIndex(i => i - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderFieldGroup = (title: string, fields: FormSchemaField[]) => {
    if (!fields || fields.length === 0) return null;

    return (
      <div className="cg-form__section">
        <h3 className="cg-form__section-title">{title}</h3>
        <div className="cg-form__grid">
          {fields.map((field: any) => {
            const htmlType = normalizeType(field.type);
            if (htmlType === "checkbox") {
              return (
                <div key={field.id} className="cg-form__field cg-form__field--checkbox">
                  <FieldRenderer
                    field={field}
                    value={formData[field.id]}
                    onChange={(val) => handleChange(field.id, val)}
                    disabled={isReadOnly || !!field.locked_by_cet}
                  />
                </div>
              );
            }

            return (
              <div key={field.id} id={`field-${field.id}`} className="cg-form__field">
                <label className="cg-form__label">
                  {field.label}
                  {field.is_required && <span className="cg-color-destructive ml-1">*</span>}
                  {field.locked_by_cet && (
                    <span className="cg-form__locked-info"> (CET locked)</span>
                  )}
                </label>
                <FieldRenderer
                  field={field}
                  value={formData[field.id]}
                  onChange={(val) => handleChange(field.id, val)}
                  disabled={isReadOnly || !!field.locked_by_cet}
                />
                {errors[field.id] && (
                  <div className="cg-form__error">{errors[field.id]}</div>
                )}
                
                {seatData && (field.id === "preferred_stream" || field.id === "selected_course" || field.id === "applying_for_standard") && formData[field.id] && (
                  <div className="cg-form__field-addon">
                    <CgSeatDisplay seats={seatData.filter((s: any) => s.stream_or_course === formData[field.id])} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <form
      className="cg-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (validateCurrentSection()) {
          onSubmit(formData);
          setIsDirty(false);
          lastSavedDataRef.current = formData;
        }
      }}
    >
      {Object.keys(errors).length > 0 && (
        <div className="cg-form__error-summary">
          Please correct the error(s) before proceeding.
        </div>
      )}
      
      {/* ── SECTIONS RENDERER (Multi-Step) ── */}
      {hasSections ? (
        <>
          <div style={{ marginBottom: "1.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {sections.map((sec: any, idx: number) => (
              <div 
                key={sec.id} 
                style={{ 
                  padding: "0.25rem 0.75rem", 
                  borderRadius: "99px", 
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  background: idx === currentSectionIndex ? "hsl(var(--primary))" : "hsl(var(--muted))",
                  color: idx === currentSectionIndex ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))"
                }}
              >
                {idx + 1}. {sec.label}
              </div>
            ))}
          </div>

          {currentSection ? renderFieldGroup(currentSection.label, currentSection.fields) : null}

          {!isReadOnly && (
            <div className="cg-form__actions" style={{ display: "flex", justifyContent: "space-between", marginTop: "2rem" }}>
              {currentSectionIndex > 0 ? (
                <button type="button" className="cg-btn cg-btn--outline" onClick={handlePrev}>
                  &larr; Previous
                </button>
              ) : <div></div>}

              {currentSectionIndex < sections.length - 1 ? (
                <button type="button" className="cg-btn cg-btn--primary" onClick={handleNext}>
                  Next Section &rarr;
                </button>
              ) : (
                <button type="submit" className="cg-btn cg-btn--primary">
                  Submit Form
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        /* Fallback for legacy schemas without sections */
        <>
          {renderFieldGroup("Required Information", formSchema.fields.required.map(f => ({...f, is_required: true})))}
          {renderFieldGroup("Additional Information", formSchema.fields.optional)}
          {!isReadOnly && (
            <div className="cg-form__actions">
              <button type="submit" className="cg-btn cg-btn--primary">Save & Continue</button>
            </div>
          )}
        </>
      )}

      {isDirty && !isReadOnly && (
        <div style={{ textAlign: "right", marginTop: "0.5rem", fontSize: "0.8rem", color: "hsl(var(--muted-foreground))" }}>
          Unsaved changes...
        </div>
      )}
    </form>
  );
}
