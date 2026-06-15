import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  BookOpen,
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
import { useInstitutionProfile } from "../queries/useInstitutionProfile";
import {
  type OrgEducatorRecord,
  useOrgFaculty,
  useRemoveOrgFaculty,
} from "../queries/useOrgFaculty";

export function OrgFacultyPage() {
  const { data: profile, isLoading: isProfileLoading } = useInstitutionProfile();
  const facultyQuery = useOrgFaculty();
  const removeFaculty = useRemoveOrgFaculty();
  const [search, setSearch] = useState("");
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);

  const faculties = facultyQuery.data ?? [];
  const filteredFaculties = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return faculties;

    return faculties.filter((faculty) =>
      [
        faculty.name,
        faculty.email,
        faculty.employee_id,
        faculty.department,
        faculty.designation,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [faculties, search]);

  if (isProfileLoading || !profile) {
    return <div className="h-96 animate-pulse rounded-lg border border-border bg-muted/40" />;
  }

  const educatorLabel = getProfileTerm(profile, "educator");
  const educatorPluralLabel = getProfileTermPlural(profile, "educator");
  const groupPluralLabel = getProfileTermPlural(profile, "group");
  const organizationName = profile.organization.name;

  const activeCount = faculties.filter((faculty) => faculty.status === "active").length;
  const assignedCount = faculties.filter((faculty) => (faculty.assignedClassroomsCount ?? 0) > 0).length;
  const completedCount = faculties.filter((faculty) => faculty.profile_completed).length;

  function handleRemoveFaculty(faculty: OrgEducatorRecord) {
    const confirmed = window.confirm(`Remove ${faculty.name} from ${organizationName}?`);
    if (!confirmed) return;

    setPendingRemoveId(faculty._id);
    removeFaculty.mutate(faculty._id, {
      onSettled: () => setPendingRemoveId(null),
    });
  }

  return (
    <main className="cg-page">
      <header className="cg-page__header cg-page__header--split">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Org Admin Academics</p>
          <h1 className="text-2xl font-bold tracking-tight">{educatorPluralLabel}</h1>
          <p className="text-muted-foreground">
            {organizationName} - Manage all {lowerLabel(educatorPluralLabel)}
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric label={`Total ${educatorPluralLabel}`} value={String(faculties.length)} icon={<UsersRound className="h-4 w-4" />} />
        <Metric label="Active" value={String(activeCount)} icon={<ShieldCheck className="h-4 w-4" />} />
        <Metric label={`Assigned to ${groupPluralLabel}`} value={String(assignedCount)} icon={<BookOpen className="h-4 w-4" />} />
        <Metric label="Profiles Complete" value={String(completedCount)} icon={<CheckCircle2 className="h-4 w-4" />} />
      </section>

      <section className="rounded-lg border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">{educatorPluralLabel} Directory</h2>
            <p className="text-sm text-muted-foreground">
              Manage roles, assignments, and access for your {lowerLabel(educatorPluralLabel)}
            </p>
          </div>
          <label className="relative w-full md:w-80">
            <span className="sr-only">Search {lowerLabel(educatorPluralLabel)}</span>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search ${lowerLabel(educatorPluralLabel)}...`}
            />
          </label>
        </div>

        {facultyQuery.isLoading ? (
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading {lowerLabel(educatorPluralLabel)}
          </div>
        ) : filteredFaculties.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-center">
            <UsersRound className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium text-foreground">No {lowerLabel(educatorPluralLabel)} found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">{educatorLabel}</th>
                  <th className="px-4 py-3 font-medium">Employee ID</th>
                  <th className="px-4 py-3 font-medium">Department</th>
                  <th className="px-4 py-3 font-medium">Designation</th>
                  <th className="px-4 py-3 font-medium">Assignments</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredFaculties.map((faculty) => (
                  <tr key={faculty._id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-foreground">{faculty.name}</p>
                        <p className="text-xs text-muted-foreground">{faculty.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {faculty.employee_id || "-"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {faculty.department || "-"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {faculty.designation || "-"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {faculty.assignedClassroomsCount ? `${faculty.assignedClassroomsCount} ${groupPluralLabel}` : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium capitalize text-foreground">
                        {faculty.status ?? "active"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={() => handleRemoveFaculty(faculty)}
                        disabled={pendingRemoveId === faculty._id || removeFaculty.isPending}
                      >
                        {pendingRemoveId === faculty._id ? (
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
