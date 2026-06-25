import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  GraduationCap,
  Loader2,
  Search,
  ShieldCheck,
  UserMinus,
  UsersRound,
} from "lucide-react";
import {
  getProfileTerm,
  getProfileTermPlural,
  lowerLabel,
} from "../components/dashboardProfileUtils";
import type {
  InstitutionLearnerRecordField,
  InstitutionProfile,
} from "../queries/useInstitutionProfile";
import { useInstitutionProfile } from "../queries/useInstitutionProfile";
import {
  type OrgLearnerRecord,
  useOrgStudents,
  useRemoveOrgStudent,
} from "../queries/useOrgStudents";

export function OrgStudentsPage() {
  const { data: profile, isLoading: isProfileLoading } = useInstitutionProfile();
  const learnersQuery = useOrgStudents();
  const removeLearner = useRemoveOrgStudent();
  const [search, setSearch] = useState("");
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);

  const learners = learnersQuery.data ?? [];
  const filteredLearners = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return learners;

    return learners.filter((learner) =>
      [
        learner.name,
        learner.email,
        learner.prn,
        learner.abc_id,
        learner.branch,
        learner.department,
        learner.batch,
        learner.classroomName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [learners, search]);

  if (isProfileLoading || !profile) {
    return <div className="h-96 animate-pulse rounded-lg border border-border bg-muted/40" />;
  }

  const learnerLabel = getProfileTerm(profile, "learner");
  const learnerPluralLabel = getProfileTermPlural(profile, "learner");
  const educatorLabel = getProfileTerm(profile, "educator");
  const groupPluralLabel = getProfileTermPlural(profile, "group");
  const organizationName = profile.organization.name;
  const visibleFields = getVisibleRecordFields(profile);
  const verifiedCount = learners.filter((learner) => learner.verification_status === "verified").length;
  const placedCount = learners.filter((learner) => (learner.classroomCount ?? 0) > 0).length;
  const completedCount = learners.filter((learner) => learner.profile_completed).length;

  function handleRemoveLearner(learner: OrgLearnerRecord) {
    const confirmed = window.confirm(`Remove ${learner.name} from ${organizationName}?`);
    if (!confirmed) return;

    setPendingRemoveId(learner._id);
    removeLearner.mutate(learner._id, {
      onSettled: () => setPendingRemoveId(null),
    });
  }

  return (
    <main className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6 flex justify-between items-center">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Org Admin Academics</p>
          <h1 className="text-2xl font-bold tracking-tight">{learnerPluralLabel}</h1>
          <p className="text-muted-foreground">
            {organizationName} - {groupPluralLabel} - {educatorLabel} ownership
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric label={`Total ${learnerPluralLabel}`} value={String(learners.length)} icon={<UsersRound className="h-4 w-4" />} />
        <Metric label="Verified" value={String(verifiedCount)} icon={<ShieldCheck className="h-4 w-4" />} />
        <Metric label={`Assigned ${groupPluralLabel}`} value={String(placedCount)} icon={<GraduationCap className="h-4 w-4" />} />
        <Metric label="Profiles Complete" value={String(completedCount)} icon={<CheckCircle2 className="h-4 w-4" />} />
      </section>

      <section className="rounded-lg border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">{learnerPluralLabel} Directory</h2>
            <p className="text-sm text-muted-foreground">
              {profile.learnerRecordProfile.requiredFieldKeys.length} required record fields in this profile
            </p>
          </div>
          <label className="relative w-full md:w-80">
            <span className="sr-only">Search {lowerLabel(learnerPluralLabel)}</span>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search ${lowerLabel(learnerPluralLabel)}...`}
            />
          </label>
        </div>

        {learnersQuery.isLoading ? (
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading {lowerLabel(learnerPluralLabel)}
          </div>
        ) : filteredLearners.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-center">
            <UsersRound className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium text-foreground">No {lowerLabel(learnerPluralLabel)} found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">{learnerLabel}</th>
                  {visibleFields.map((field) => (
                    <th key={field.key} className="px-4 py-3 font-medium">
                      {field.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 font-medium">{groupPluralLabel}</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLearners.map((learner) => (
                  <tr key={learner._id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-foreground">{learner.name}</p>
                        <p className="text-xs text-muted-foreground">{learner.email}</p>
                      </div>
                    </td>
                    {visibleFields.map((field) => (
                      <td key={`${learner._id}-${field.key}`} className="px-4 py-3 text-muted-foreground">
                        {getLearnerFieldValue(learner, field)}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-muted-foreground">{learner.classroomName || "-"}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium capitalize text-foreground">
                        {learner.status ?? "active"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={() => handleRemoveLearner(learner)}
                        disabled={pendingRemoveId === learner._id || removeLearner.isPending}
                      >
                        {pendingRemoveId === learner._id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <UserMinus className="h-3.5 w-3.5" />
                        )}
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className="rounded-md bg-primary/10 p-2 text-primary">{icon}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-foreground">{value}</p>
    </article>
  );
}

function getVisibleRecordFields(profile: InstitutionProfile) {
  const profileFields = [
    ...profile.learnerRecordProfile.identityFields,
    ...profile.learnerRecordProfile.academicPlacementFields,
    ...profile.learnerRecordProfile.optionalComplianceFields,
  ];

  return profileFields
    .filter((field) => !["name", "email", "student_id"].includes(field.key))
    .slice(0, 5);
}

function getLearnerFieldValue(learner: OrgLearnerRecord, field: InstitutionLearnerRecordField) {
  const aliases: Record<string, keyof OrgLearnerRecord> = {
    student_id: "_id",
    roll_no: "prn",
    enrollment_no: "prn",
    standard: "branch",
    stream: "branch",
    course: "branch",
    division: "batch",
    sub_batch: "batch",
    year: "batch",
    semester: "batch",
    academic_year: "batch",
  };
  const directValue = learner[field.key];
  const aliasKey = aliases[field.key];
  const value = directValue ?? (aliasKey ? learner[aliasKey] : undefined);

  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";

  return "-";
}
