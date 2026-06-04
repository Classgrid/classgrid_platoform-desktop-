import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  Mail,
  Phone,
  Shield,
} from "lucide-react";
import { useApplication, useUpdateStage } from "../../admissions/queries/useApplications";
import {
  CgAvatar,
  CgBadge,
  CgButton,
  CgPageShell,
  CgSectionPanel,
} from "@/components/classgrid";

type SchemaField = {
  id: string;
  label: string;
  type: string;
  options?: string[];
  is_required?: boolean;
  locked_by_cet?: boolean;
};

type SchemaSection = {
  id: string;
  label: string;
  fields: SchemaField[];
};

type DisplayField = {
  id: string;
  label: string;
  value: unknown;
  type: string;
  required?: boolean;
  locked?: boolean;
};

const EMPTY_VALUE = "—";

const statusVariant = (status: string): "success" | "info" | "danger" | "warning" | "neutral" => {
  switch (status) {
    case "enrolled":
    case "confirmed":
      return "success";
    case "verified":
    case "allotted":
      return "info";
    case "rejected":
    case "withdrawn":
    case "cancelled":
      return "danger";
    case "under_verification":
    case "fee_pending":
    case "waitlisted":
      return "warning";
    default:
      return "neutral";
  }
};

function getPath(source: unknown, path: string) {
  if (!source || typeof source !== "object") return undefined;
  return path.split(".").reduce<unknown>((acc, key) => {
    if (!acc || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[key];
  }, source);
}

function firstFilled(values: unknown[]) {
  return values.find((value) => {
    if (value === undefined || value === null) return false;
    if (typeof value === "string") return value.trim() !== "";
    if (Array.isArray(value)) return value.length > 0;
    return true;
  });
}

function educationValue(formData: Record<string, unknown>, level: string, key: string) {
  const entries = Array.isArray(formData.previous_education)
    ? formData.previous_education as Array<Record<string, unknown>>
    : [];
  const match = entries.find((entry) => String(entry.level).toLowerCase() === level);
  if (!match) return undefined;
  return match[key];
}

function fieldValue(fieldId: string, printData: any) {
  const formData = (printData.form_data || {}) as Record<string, unknown>;
  const applicant = printData.applicant || {};
  const cet = printData.cet_allotment_details || {};

  const directValues: Record<string, unknown> = {
    full_name: applicant.full_name,
    student_name: applicant.full_name,
    dob: applicant.dob,
    phone: applicant.phone,
    mobile_number: applicant.phone,
    email: applicant.email,
    primary_email: applicant.email,
    en_number: applicant.en_number,
    category: applicant.category,
    admission_main_category: applicant.category,
    seat_type: applicant.seat_type,
    cap_round: cet.cap_round,
    cet_score: cet.mht_cet_score,
  };

  if (directValues[fieldId] !== undefined && directValues[fieldId] !== null && directValues[fieldId] !== "") {
    return directValues[fieldId];
  }

  if (fieldId === "10th_board") return firstFilled([formData["10th_board"], educationValue(formData, "10th", "board_name")]);
  if (fieldId === "10th_percentage") return firstFilled([formData["10th_percentage"], educationValue(formData, "10th", "percentage_or_cgpa")]);
  if (fieldId === "12th_board") return firstFilled([formData["12th_board"], educationValue(formData, "12th", "board_name")]);
  if (fieldId === "12th_percentage") return firstFilled([formData["12th_percentage"], educationValue(formData, "12th", "percentage_or_cgpa")]);
  if (fieldId === "diploma_percentage") return firstFilled([formData.diploma_percentage, educationValue(formData, "diploma", "percentage_or_cgpa")]);

  const candidates = [
    fieldId,
    `custom_fields.${fieldId}`,
    `personal_details.${fieldId}`,
    `academic_ids.${fieldId}`,
    `bank_details.${fieldId}`,
    `passport_details.${fieldId}`,
    `entrance_exam.${fieldId}`,
    `institutional_goals.${fieldId}`,
    `experience_activities.${fieldId}`,
  ];

  if (fieldId.startsWith("permanent_")) {
    candidates.push(`address.permanent.${fieldId.replace("permanent_", "")}`);
  }
  if (fieldId.startsWith("current_")) {
    candidates.push(`address.current.${fieldId.replace("current_", "")}`);
  }
  if (fieldId.startsWith("father_")) {
    candidates.push(`family.father.${fieldId.replace("father_", "")}`);
  }
  if (fieldId.startsWith("mother_")) {
    candidates.push(`family.mother.${fieldId.replace("mother_", "")}`);
  }
  if (fieldId.startsWith("emergency_contact_")) {
    candidates.push(`guardians.emergency_contact.${fieldId.replace("emergency_contact_", "")}`);
  }
  if (fieldId.startsWith("local_guardian_")) {
    candidates.push(`guardians.local_guardian.${fieldId.replace("local_guardian_", "")}`);
  }
  if (fieldId.startsWith("hostel_")) {
    candidates.push(`guardians.hostel.${fieldId.replace("hostel_", "")}`);
  }

  return firstFilled(candidates.map((path) => getPath(formData, path)));
}

function flattenPrimitiveValues(source: unknown, prefix = "", output: Array<{ label: string; value: unknown }> = []) {
  if (!source || typeof source !== "object") return output;

  for (const [key, value] of Object.entries(source as Record<string, unknown>)) {
    const label = prefix ? `${prefix}.${key}` : key;
    if (value === undefined || value === null || value === "") continue;

    if (Array.isArray(value)) {
      if (value.every((item) => typeof item !== "object" || item === null)) {
        output.push({ label, value });
      } else {
        value.forEach((item, index) => flattenPrimitiveValues(item, `${label} ${index + 1}`, output));
      }
      continue;
    }

    if (typeof value === "object") {
      flattenPrimitiveValues(value, label, output);
      continue;
    }

    output.push({ label, value });
  }

  return output;
}

function labelFromKey(key: string) {
  return key
    .replace(/\./g, " / ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isDateLike(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value);
}

function formatValue(value: unknown, type?: string): string {
  if (value === undefined || value === null || value === "") return EMPTY_VALUE;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    return value.length ? value.map((item: unknown) => formatValue(item)).join(", ") : EMPTY_VALUE;
  }
  if (typeof value === "object") {
    return flattenPrimitiveValues(value)
      .map((entry: { label: string; value: unknown }) => `${labelFromKey(entry.label)}: ${formatValue(entry.value)}`)
      .join("; ") || EMPTY_VALUE;
  }
  if ((type === "date" || isDateLike(value)) && value) {
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? String(value) : format(date, "PPP");
  }
  return String(value);
}

function buildSchemaSections(formSchema: any): SchemaSection[] {
  if (Array.isArray(formSchema?.sections) && formSchema.sections.length > 0) {
    return formSchema.sections;
  }

  const required = (formSchema?.fields?.required || []).map((field: SchemaField) => ({
    ...field,
    is_required: true,
  }));
  const optional = formSchema?.fields?.optional || [];

  return [
    { id: "required", label: "Required Information", fields: required },
    { id: "optional", label: "Additional Information", fields: optional },
  ].filter((section) => section.fields.length > 0);
}

function EmptyApplicationState({ title, message }: { title: string; message: string }) {
  return (
    <CgPageShell title={title} breadcrumbs={[{ label: "Admissions", to: "/dept/admissions/dashboard" }, { label: "Application" }]}>
      <CgSectionPanel>
        <div className="text-center p-8 text-muted-foreground">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{message}</p>
        </div>
      </CgSectionPanel>
    </CgPageShell>
  );
}

export function ApplicationDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useApplication(id || "");
  const { mutate: updateStage, isPending: isUpdating } = useUpdateStage();

  const printData = data?.print_data;
  const applicant = printData?.applicant || {};
  const status = printData?.status || "applied";
  const schemaSections = useMemo(() => buildSchemaSections(printData?.form_schema), [printData?.form_schema]);

  const renderedSections = useMemo(() => {
    if (!printData) return [];

    return schemaSections
      .map((section) => ({
        ...section,
        fields: section.fields.map<DisplayField>((field) => ({
          id: field.id,
          label: field.label,
          value: fieldValue(field.id, printData),
          type: field.type,
          required: field.is_required,
          locked: field.locked_by_cet,
        })),
      }))
      .filter((section) => section.fields.length > 0);
  }, [printData, schemaSections]);

  const displayedFieldIds = useMemo(
    () => new Set(schemaSections.flatMap((section) => section.fields.map((field) => field.id))),
    [schemaSections]
  );

  const extraFields = useMemo(() => {
    const formData = printData?.form_data || {};
    return flattenPrimitiveValues(formData)
      .filter((entry) => {
        const parts = entry.label.split(".");
        return !displayedFieldIds.has(parts[parts.length - 1] || entry.label);
      })
      .slice(0, 24);
  }, [displayedFieldIds, printData?.form_data]);

  if (!id) {
    return <EmptyApplicationState title="Invalid Application" message="Invalid Application ID." />;
  }

  if (isLoading) {
    return (
      <CgPageShell title="Loading Application" breadcrumbs={[{ label: "Admissions", to: "/dept/admissions/dashboard" }, { label: "Application" }]}>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 cg-spin text-primary" />
        </div>
      </CgPageShell>
    );
  }

  if (isError || !printData) {
    return <EmptyApplicationState title="Application Not Found" message="Could not load this admission application." />;
  }

  const hierarchyPath = printData.hierarchy_path || [];
  const program = printData.program || {};
  const fallbackProgramName =
    hierarchyPath.length > 0 ? hierarchyPath[hierarchyPath.length - 1]?.name : undefined;
  const fallbackProgramCode =
    hierarchyPath.length > 0 ? hierarchyPath[hierarchyPath.length - 1]?.code : undefined;
  const documents = printData.documents || [];
  const schemaDocuments = printData.form_schema?.documents || [];
  const documentByName = new Map<string, any>(documents.map((doc: any) => [doc.name, doc]));
  const strategy = printData.admission_strategy || {};

  const handleStageChange = (newStatus: string) => {
    updateStage({ id, status: newStatus });
  };

  return (
    <CgPageShell
      title={`Application: ${applicant.full_name || "Unknown"}`}
      description={`${printData.structure_type?.replace(/_/g, " ") || "Admission"} application rendered from Form Builder schema.`}
      breadcrumbs={[
        { label: "Admissions", to: "/dept/admissions/dashboard" },
        { label: "Applications", to: "/dept/admissions/applications" },
        { label: applicant.en_number || String(printData.application_id).slice(0, 8) },
      ]}
      actions={
        <div className="flex gap-2 flex-wrap">
          {status === "applied" && (
            <CgButton onClick={() => handleStageChange("under_verification")} disabled={isUpdating}>
              {isUpdating ? <Loader2 className="w-4 h-4 mr-2 cg-spin" /> : null}
              Start Verification
            </CgButton>
          )}
          {status === "under_verification" && (
            <CgButton onClick={() => handleStageChange("verified")} variant="success" disabled={isUpdating}>
              {isUpdating ? <Loader2 className="w-4 h-4 mr-2 cg-spin" /> : null}
              Mark Verified
            </CgButton>
          )}
          {status === "verified" && (
            <CgButton onClick={() => handleStageChange("fee_pending")} variant="primary" disabled={isUpdating}>
              {isUpdating ? <Loader2 className="w-4 h-4 mr-2 cg-spin" /> : null}
              Request Fees
            </CgButton>
          )}
          {status === "fee_pending" && (
            <CgButton onClick={() => handleStageChange("enrolled")} variant="success" disabled={isUpdating}>
              {isUpdating ? <Loader2 className="w-4 h-4 mr-2 cg-spin" /> : null}
              Enroll Student
            </CgButton>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 flex flex-col items-center text-center bg-card border border-border rounded-lg shadow-sm">
            <CgAvatar name={applicant.full_name || "?"} size="lg" className="mb-4" />
            <h2 className="text-xl font-bold">{applicant.full_name || EMPTY_VALUE}</h2>
            <p className="text-muted-foreground mb-4">
              {applicant.en_number ? `EN: ${applicant.en_number}` : `ID: ${String(printData.application_id).slice(0, 8)}`}
            </p>
            <CgBadge variant={statusVariant(status)} className="mb-6 uppercase text-xs px-3 py-1">
              {status.replace(/_/g, " ")}
            </CgBadge>

            <div className="w-full space-y-3 text-sm text-left">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span className="text-foreground">{applicant.email || EMPTY_VALUE}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span className="text-foreground">{applicant.phone || EMPTY_VALUE}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span className="text-foreground">{formatValue(applicant.dob, "date")}</span>
              </div>
            </div>
          </div>

          <CgSectionPanel title="Division And Program">
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Hierarchy Path</p>
                <p className="font-medium">
                  {hierarchyPath.length
                    ? hierarchyPath.map((node: any) => node.name).join(" / ")
                    : "Not linked to a Division or Program"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Program</p>
                <p className="font-medium">{program.name || fallbackProgramName || EMPTY_VALUE}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Program Code</p>
                <p className="font-medium">{program.code || fallbackProgramCode || EMPTY_VALUE}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Applied Date</p>
                <p className="font-medium">{formatValue(printData.applied_at, "date")}</p>
              </div>
            </div>
          </CgSectionPanel>

          <CgSectionPanel title="Admission Strategy">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Structure</span>
                <CgBadge variant="info">{printData.structure_type?.replace(/_/g, " ") || EMPTY_VALUE}</CgBadge>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Auth</span>
                <span className="font-medium">{strategy.auth_method?.replace(/_/g, " ") || EMPTY_VALUE}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Ranking</span>
                <span className="font-medium">{strategy.ranking_type?.replace(/_/g, " ") || EMPTY_VALUE}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Workflow</span>
                <span className="font-medium">{strategy.workflow_variant?.replace(/_/g, " ") || EMPTY_VALUE}</span>
              </div>
            </div>
          </CgSectionPanel>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {renderedSections.length > 0 ? (
            renderedSections.map((section) => (
              <CgSectionPanel key={section.id} title={section.label}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
                  {section.fields.map((field) => (
                    <div key={field.id} className="border-b border-border pb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs text-muted-foreground">{field.label}</p>
                        {field.required ? <CgBadge variant="outline" size="sm">Required</CgBadge> : null}
                        {field.locked ? <CgBadge variant="info" size="sm">CET locked</CgBadge> : null}
                      </div>
                      <p className="font-medium text-sm break-words">{formatValue(field.value, field.type)}</p>
                    </div>
                  ))}
                </div>
              </CgSectionPanel>
            ))
          ) : (
            <CgSectionPanel title="Application Form">
              <div className="py-8 text-center text-muted-foreground">
                <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No Form Builder schema was returned for this application.</p>
              </div>
            </CgSectionPanel>
          )}

          {extraFields.length > 0 && (
            <CgSectionPanel title="Additional Stored Data">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
                {extraFields.map((entry) => (
                  <div key={entry.label} className="border-b border-border pb-2">
                    <p className="text-xs text-muted-foreground mb-1">{labelFromKey(entry.label)}</p>
                    <p className="font-medium text-sm break-words">{formatValue(entry.value)}</p>
                  </div>
                ))}
              </div>
            </CgSectionPanel>
          )}

          <CgSectionPanel title="Documents">
            {schemaDocuments.length > 0 || documents.length > 0 ? (
              <div className="space-y-3">
                {(schemaDocuments.length ? schemaDocuments : documents.map((doc: any) => ({ id: doc.name, label: labelFromKey(doc.name), required: false }))).map((schemaDoc: any) => {
                  const doc = documentByName.get(schemaDoc.id) || {};
                  const docStatus = doc.status || "pending";
                  return (
                    <div key={schemaDoc.id} className="flex items-center justify-between gap-4 p-3 border border-border rounded-lg bg-card/50">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-sm break-words">{schemaDoc.label || labelFromKey(schemaDoc.id)}</p>
                          <p className="text-xs text-muted-foreground">
                            {schemaDoc.required ? "Required document" : "Optional document"}
                          </p>
                        </div>
                      </div>
                      {docStatus === "verified" ? (
                        <CgBadge variant="success" icon={<CheckCircle className="w-3 h-3" />}>Verified</CgBadge>
                      ) : docStatus === "rejected" ? (
                        <CgBadge variant="danger" icon={<AlertCircle className="w-3 h-3" />}>Rejected</CgBadge>
                      ) : (
                        <CgBadge variant="warning" icon={<Clock className="w-3 h-3" />}>Pending</CgBadge>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No documents are configured for this admission strategy.</p>
              </div>
            )}
          </CgSectionPanel>

          <CgSectionPanel title="Printable Declaration">
            <p className="text-sm text-muted-foreground mb-6">{printData.print_declaration}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(printData.signature_lines || []).map((line: any) => (
                <div key={line.label} className="border border-border rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-8">{line.label}</p>
                  <p className="font-medium text-sm border-t border-border pt-2">{line.signer || EMPTY_VALUE}</p>
                </div>
              ))}
            </div>
          </CgSectionPanel>
        </div>
      </div>
    </CgPageShell>
  );
}
