import { useMemo, useState } from "react";
import { Loader2, Search, UsersRound, BookOpen, DoorOpen } from "lucide-react";
import { useOrgClassrooms } from "../queries/useOrgClassrooms";
import { useInstitutionProfile } from "../queries/useInstitutionProfile";
import { getProfileTermPlural, lowerLabel } from "../components/dashboardProfileUtils";

export function OrgClassroomsPage() {
  const { data: profile, isLoading: isProfileLoading } = useInstitutionProfile();
  const classroomsQuery = useOrgClassrooms();
  const [search, setSearch] = useState("");

  const classrooms = classroomsQuery.data?.classrooms ?? [];

  const filteredClassrooms = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return classrooms;

    return classrooms.filter((c) =>
      [
        c.name,
        c.classCode,
        c.subject,
        c.teacher?.name,
        c.teacher?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [classrooms, search]);

  if (isProfileLoading || !profile) {
    return <div className="h-96 animate-pulse rounded-lg border border-border bg-muted/40" />;
  }

  const groupPluralLabel = getProfileTermPlural(profile, "group");
  const educatorPluralLabel = getProfileTermPlural(profile, "educator");
  const organizationName = profile.organization.name;

  return (
    <main className="cg-page">
      <header className="cg-page__header cg-page__header--split">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Org Admin Academics</p>
          <h1 className="text-2xl font-bold tracking-tight">{groupPluralLabel}</h1>
          <p className="text-muted-foreground">
            {organizationName} - Manage all active {lowerLabel(groupPluralLabel)}
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Metric 
          label={`Total ${groupPluralLabel}`} 
          value={String(classrooms.length)} 
          icon={<DoorOpen className="h-4 w-4" />} 
        />
        <Metric 
          label={`Assigned ${educatorPluralLabel}`} 
          value={String(new Set(classrooms.map(c => c.teacher?._id).filter(Boolean)).size)} 
          icon={<UsersRound className="h-4 w-4" />} 
        />
        <Metric 
          label="Total Enrollments" 
          value={String(classrooms.reduce((acc, c) => acc + (c.memberCount || 0), 0))} 
          icon={<BookOpen className="h-4 w-4" />} 
        />
      </section>

      <section className="rounded-lg border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">{groupPluralLabel} Directory</h2>
            <p className="text-sm text-muted-foreground">
              Overview of all active academic groups.
            </p>
          </div>
          <label className="relative w-full md:w-80">
            <span className="sr-only">Search {lowerLabel(groupPluralLabel)}</span>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search ${lowerLabel(groupPluralLabel)}...`}
            />
          </label>
        </div>

        {classroomsQuery.isLoading ? (
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading {lowerLabel(groupPluralLabel)}
          </div>
        ) : filteredClassrooms.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-center">
            <DoorOpen className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium text-foreground">No {lowerLabel(groupPluralLabel)} found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Subject</th>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Teacher</th>
                  <th className="px-4 py-3 font-medium text-right">Members</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredClassrooms.map((classroom) => (
                  <tr key={classroom._id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {classroom.name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {classroom.subject || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md border border-border bg-muted/50 px-2 py-1 font-mono text-xs">
                        {classroom.classCode}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {classroom.teacher ? (
                        <div>
                          <p className="font-medium text-foreground">{classroom.teacher.name}</p>
                          <p className="text-xs text-muted-foreground">{classroom.teacher.email}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {classroom.memberCount || 0}
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
  icon: React.ReactNode;
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
