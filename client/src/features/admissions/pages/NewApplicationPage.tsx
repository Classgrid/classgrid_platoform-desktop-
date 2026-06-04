import { useMemo, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CgAlert,
  CgBadge,
  CgButton,
  CgEmptyState,
  CgPageShell,
  CgSectionPanel,
} from "@/components/classgrid";
import { deskEnroll, getAdmissionConfigFull } from "../api";

type SchemaField = {
  id: string;
  label: string;
  type: string;
  options?: string[];
};

type SchemaSection = {
  id: string;
  label: string;
  fields: SchemaField[];
};

const CET_STRUCTURE_TYPES = new Set([
  "engineering",
  "engineering_with_div",
  "engineering_no_div",
  "diploma",
  "diploma_with_div",
  "diploma_no_div",
]);

function normalizeFieldType(type = "text") {
  return type === "dropdown" ? "select" : type;
}

function toInputType(type: string) {
  switch (type) {
    case "number":
      return "number";
    case "date":
      return "date";
    case "email":
      return "email";
    case "tel":
    case "phone":
      return "tel";
    default:
      return "text";
  }
}

export function NewApplicationPage() {
  const qc = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});
  const [hierarchyId, setHierarchyId] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const configQuery = useQuery({
    queryKey: ["admission-config-full"],
    queryFn: getAdmissionConfigFull,
  });

  const mutation = useMutation({
    mutationFn: async (payload: any) => deskEnroll(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admission-applications"] });
      qc.invalidateQueries({ queryKey: ["admission-analytics"] });
    },
  });

  const structureType = (configQuery.data as any)?.structure_type as string | undefined;
  const isCETOrg = CET_STRUCTURE_TYPES.has(structureType || "");
  const schemaSections = ((configQuery.data as any)?.form_schema?.sections || []) as SchemaSection[];
  const requiredFields = (((configQuery.data as any)?.form_schema?.fields?.required || []) as SchemaField[]);
  const optionalFields = (((configQuery.data as any)?.form_schema?.fields?.optional || []) as SchemaField[]);
  const allFields = useMemo(() => [...requiredFields, ...optionalFields], [requiredFields, optionalFields]);
  const requiredFieldIds = useMemo(() => new Set(requiredFields.map((field) => field.id)), [requiredFields]);
  const allFieldMap = useMemo(() => new Map(allFields.map((field) => [field.id, field])), [allFields]);

  const visibleSections = useMemo(() => {
    if (schemaSections.length > 0) return schemaSections;
    return [{ id: "dynamic", label: "Application Form", fields: allFields }].filter(
      (section) => section.fields.length > 0
    );
  }, [schemaSections, allFields]);

  const onFieldChange = (fieldId: string, value: string) => {
    setValidationError(null);
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const missingRequired = [...requiredFieldIds].filter((fieldId) => {
      const value = values[fieldId];
      return !value || value.trim() === "";
    });
    if (missingRequired.length > 0) {
      const firstMissing = missingRequired[0] || "";
      setValidationError(`Missing required field: ${allFieldMap.get(firstMissing)?.label || firstMissing}`);
      return;
    }

    const payload = {
      full_name:
        values.full_name ||
        values.student_name ||
        `${values.first_name || ""} ${values.last_name || ""}`.trim(),
      phone: values.phone || values.mobile_number || undefined,
      email: values.email || values.primary_email || undefined,
      hierarchy_id: hierarchyId || undefined,
      form_data: Object.fromEntries(
        Object.entries(values).map(([key, value]) => [key, value.trim()])
      ),
    };

    await mutation.mutateAsync(payload);
  };

  return (
    <CgPageShell
      title="New Application"
      description="Schema-driven application entry backed by admission strategy and services."
      breadcrumbs={[{ label: "Admissions", to: "/dept/admissions/dashboard" }, { label: "New Application" }]}
    >
      <CgSectionPanel title="Track Resolution">
        <div className="flex flex-wrap gap-3 items-center">
          <CgBadge variant="info">{structureType || "Unknown structure type"}</CgBadge>
          <CgBadge variant={isCETOrg ? "warning" : "success"}>
            {isCETOrg ? "CET Track (Engineering/Diploma)" : "Direct Track"}
          </CgBadge>
        </div>
      </CgSectionPanel>

      {configQuery.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 cg-spin text-primary" />
        </div>
      ) : configQuery.isError ? (
        <CgSectionPanel>
          <CgEmptyState title="Failed to load form schema" description="Could not fetch admission config." />
        </CgSectionPanel>
      ) : !allFields.length ? (
        <CgSectionPanel>
          <CgEmptyState title="No form schema configured" description="Enable fields in Form Builder first." />
        </CgSectionPanel>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <CgSectionPanel title="Hierarchy Linkage">
            <label className="text-sm block">
              <div className="text-muted-foreground mb-1">Hierarchy ID (Division/Program)</div>
              <input
                value={hierarchyId}
                onChange={(event) => setHierarchyId(event.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
                placeholder="Optional hierarchy id"
              />
            </label>
          </CgSectionPanel>

          {visibleSections.map((section) => (
            <CgSectionPanel key={section.id} title={section.label}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.fields.map((field) => {
                  const normalizedType = normalizeFieldType(field.type);
                  const required = requiredFieldIds.has(field.id);
                  const value = values[field.id] || "";

                  if (normalizedType === "select") {
                    return (
                      <label key={field.id} className="text-sm">
                        <div className="mb-1 text-muted-foreground">
                          {field.label} {required ? "*" : ""}
                        </div>
                        <select
                          value={value}
                          required={required}
                          onChange={(event) => onFieldChange(field.id, event.target.value)}
                          className="w-full rounded-md border border-border bg-background px-3 py-2"
                        >
                          <option value="">Select</option>
                          {(field.options || []).map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                    );
                  }

                  if (normalizedType === "boolean") {
                    return (
                      <label key={field.id} className="text-sm flex items-center gap-2 mt-7">
                        <input
                          type="checkbox"
                          checked={value === "true"}
                          onChange={(event) => onFieldChange(field.id, String(event.target.checked))}
                        />
                        <span>{field.label}</span>
                      </label>
                    );
                  }

                  return (
                    <label key={field.id} className="text-sm">
                      <div className="mb-1 text-muted-foreground">
                        {field.label} {required ? "*" : ""}
                      </div>
                      <input
                        type={toInputType(normalizedType)}
                        value={value}
                        required={required}
                        onChange={(event) => onFieldChange(field.id, event.target.value)}
                        className="w-full rounded-md border border-border bg-background px-3 py-2"
                      />
                    </label>
                  );
                })}
              </div>
            </CgSectionPanel>
          ))}

          {validationError && (
            <CgAlert variant="danger" title="Validation Failed">
              {validationError}
            </CgAlert>
          )}
          {mutation.isError && (
            <CgAlert variant="danger" title="Submission Failed">
              {(mutation.error as any)?.message || "Could not create application."}
            </CgAlert>
          )}
          {mutation.isSuccess && (
            <CgAlert variant="success" title="Application Created">
              ID: {(mutation.data as any)?.application_id || "created"}
            </CgAlert>
          )}

          <div className="flex justify-end">
            <CgButton type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 cg-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Submit Application
            </CgButton>
          </div>
        </form>
      )}
    </CgPageShell>
  );
}
