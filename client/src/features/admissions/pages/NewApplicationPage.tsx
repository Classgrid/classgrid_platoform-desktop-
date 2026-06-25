import { useMemo, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/marketing_ui/button";
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
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Application</h1>
          <p className="text-muted-foreground mt-1">Schema-driven application entry backed by admission strategy and services.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm">
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-bold">Track Resolution</h2>
        </div>
        <div className="p-5">
          <div className="flex flex-wrap gap-3 items-center">
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800">{structureType || "Unknown structure type"}</span>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${isCETOrg ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
              {isCETOrg ? "CET Track (Engineering/Diploma)" : "Direct Track"}
            </span>
          </div>
        </div>
      </div>

      {configQuery.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : configQuery.isError ? (
        <div className="bg-card border border-border rounded-xl shadow-sm mb-6 p-6">
          <div className="text-center p-8 text-muted-foreground">
            <h2 className="text-lg font-bold text-foreground mb-2">Failed to load form schema</h2>
            <p>Could not fetch admission config.</p>
          </div>
        </div>
      ) : !allFields.length ? (
        <div className="bg-card border border-border rounded-xl shadow-sm mb-6 p-6">
          <div className="text-center p-8 text-muted-foreground">
            <h2 className="text-lg font-bold text-foreground mb-2">No form schema configured</h2>
            <p>Enable fields in Form Builder first.</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-card border border-border rounded-xl shadow-sm">
            <div className="p-5 border-b border-border">
              <h2 className="text-lg font-bold">Hierarchy Linkage</h2>
            </div>
            <div className="p-5">
              <label className="text-sm block">
                <div className="text-muted-foreground mb-1">Hierarchy ID (Division/Program)</div>
                <input
                  value={hierarchyId}
                  onChange={(event) => setHierarchyId(event.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2"
                  placeholder="Optional hierarchy id"
                />
              </label>
            </div>
          </div>

          {visibleSections.map((section) => (
            <div key={section.id} className="bg-card border border-border rounded-xl shadow-sm">
              <div className="p-5 border-b border-border">
                <h2 className="text-lg font-bold">{section.label}</h2>
              </div>
              <div className="p-5">
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
              </div>
            </div>
          ))}

          {validationError && (
            <div className="bg-red-100 text-red-800 p-4 rounded-md border border-red-200">
              <strong>Validation Failed</strong>
              <br/>{validationError}
            </div>
          )}
          {mutation.isError && (
            <div className="bg-red-100 text-red-800 p-4 rounded-md border border-red-200">
              <strong>Submission Failed</strong>
              <br/>{(mutation.error as any)?.message || "Could not create application."}
            </div>
          )}
          {mutation.isSuccess && (
            <div className="bg-emerald-100 text-emerald-800 p-4 rounded-md border border-emerald-200">
              <strong>Application Created</strong>
              <br/>ID: {(mutation.data as any)?.application_id || "created"}
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Submit Application
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
