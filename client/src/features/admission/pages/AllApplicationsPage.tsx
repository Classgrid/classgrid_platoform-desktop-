import { useState, useMemo, type ChangeEvent } from "react";
import { motion } from "framer-motion";
import { useApplications } from "../../admissions/queries/useApplications";
import { type ColumnDef } from "@tanstack/react-table";
import { Search, Loader2, FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";
import {
  CgPageShell,
  CgSectionPanel,
  CgDataTable,
  CgInput,
  CgSelect,
  CgBadge,
  CgAvatar,
  CgButton,
  CgTabs,
  CgTabList,
  CgTabTrigger,
  ExportMenu,
} from "@/components/classgrid";
import { useQuery } from "@tanstack/react-query";
import { getAdmissionConfig } from "../../admissions/api";

type DivisionTab = {
  id: string;
  label: string;
  division?: string;
  hierarchyId?: string;
};

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "applied", label: "Applied" },
  { value: "under_verification", label: "Under Verification" },
  { value: "verified", label: "Verified" },
  { value: "fee_pending", label: "Fee Pending" },
  { value: "enrolled", label: "Enrolled" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
];

export function AllApplicationsPage() {
  const [activeDivision, setActiveDivision] = useState<string>("root");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  const configQuery = useQuery({
    queryKey: ["admission-config-all-applications"],
    queryFn: getAdmissionConfig,
  });

  const divisions = useMemo<DivisionTab[]>(() => {
    const structureType = (configQuery.data as any)?.structure_type as string | undefined;
    const config = (configQuery.data as any)?.config || {};
    const enabledDivisions = Array.isArray(config.enabled_divisions) ? config.enabled_divisions : [];

    if (enabledDivisions.length > 0) {
      return enabledDivisions.map((division: any, index: number) => {
        if (typeof division === "string") {
          return { id: division, label: division.replace(/_/g, " "), division };
        }
        return {
          id: division.id || division.key || `division-${index}`,
          label: division.label || division.name || `Division ${index + 1}`,
          division: division.code || division.name || division.label,
          hierarchyId: division.hierarchy_id || division.hierarchyId,
        };
      });
    }

    return [
      {
        id: "root",
        label: (structureType || "admissions").replace(/_/g, " "),
      },
    ];
  }, [configQuery.data]);

  const activeDivisionMeta = useMemo(
    () => divisions.find((division) => division.id === activeDivision) || divisions[0],
    [divisions, activeDivision]
  );
  const hierarchyParam = activeDivisionMeta?.hierarchyId;
  const divisionParam = activeDivisionMeta?.division;
  const statusParam = status === "all" ? undefined : status;

  // Step 8 → CONNECT to backend via React Query hook
  const { data, isLoading, isError } = useApplications({
    hierarchy_id: hierarchyParam,
    division: divisionParam,
    status: statusParam,
    search: search.trim() || undefined,
    page,
    limit,
  });

  const applications = data?.applications || [];
  const total = data?.total || 0;

  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: "full_name",
      header: "Applicant",
      cell: ({ row }) => (
        <div className="cg-table__cell-identity">
          <CgAvatar name={row.original.full_name} size="sm" />
          <div>
            <div className="cg-table__cell-primary font-semibold">{row.original.full_name}</div>
            <small className="cg-table__cell-secondary font-mono text-muted-foreground">
              {row.original.en_number ? `EN: ${row.original.en_number}` : (row.original.phone || "—")}
            </small>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">
            {new Date(row.original.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit", month: "short", year: "numeric"
            })}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(row.original.createdAt).toLocaleTimeString("en-IN", {
              hour: "2-digit", minute: "2-digit"
            })}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "hierarchy_id",
      header: "Program",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.hierarchy_id?.name || "N/A"}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.original.status;
        const variant = 
          s === "enrolled" ? "success" : 
          s === "verified" ? "info" : 
          s === "rejected" ? "danger" : 
          s === "withdrawn" ? "danger" : 
          s === "under_verification" ? "warning" : 
          "neutral";
        
        return <CgBadge variant={variant}>{s.replace("_", " ")}</CgBadge>;
      },
    },
    {
      accessorKey: "documents",
      header: "Documents",
      cell: ({ row }) => {
        const docs = row.original.documents;
        if (!docs) {
            // Fallback since the merit-list endpoint doesn't return documents array
            if (row.original.status === "verified") {
                return (
                    <div className="flex items-center gap-1.5 text-emerald-500 text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />
                      <span>Verified</span>
                    </div>
                );
            }
            if (row.original.status === "under_verification") {
                return (
                    <div className="flex items-center gap-1.5 text-amber-500 text-sm font-medium">
                      <Clock className="w-4 h-4" />
                      <span>Pending</span>
                    </div>
                );
            }
            return <span className="text-muted-foreground text-sm">—</span>;
        }

        const total = docs.length;
        if (total === 0) return <span className="text-muted-foreground text-sm">No docs</span>;

        const verified = docs.filter((d: any) => d.status === "verified").length;
        const rejected = docs.filter((d: any) => d.status === "rejected").length;
        const pending = total - verified - rejected;

        if (rejected > 0) {
          return (
            <div className="flex items-center gap-1.5 text-destructive text-sm font-medium">
              <AlertCircle className="w-4 h-4" />
              <span>{rejected} rejected</span>
            </div>
          );
        }
        if (pending > 0) {
          return (
            <div className="flex items-center gap-1.5 text-amber-500 text-sm font-medium">
              <Clock className="w-4 h-4" />
              <span>{pending} pending</span>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-1.5 text-emerald-500 text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            <span>{verified}/{total} verified</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => (
        <a
          href={`/dept/admissions/applications/${row.original._id}`}
          className="text-primary hover:text-primary/80 font-medium text-sm transition-colors"
        >
          View &rarr;
        </a>
      ),
    },
  ], []);

  const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

  return (
    <CgPageShell
      title="All Applications"
      description="View, search, and filter all admission applications across the institution."
      breadcrumbs={[{ label: "Admissions" }, { label: "Applications" }]}
      actions={<ExportMenu />}
    >
      {/* ── Hierarchy Tabs ── */}
      <CgTabs
        value={activeDivision}
        onValueChange={(value) => {
          setActiveDivision(value);
          setPage(1);
        }}
      >
        <CgTabList className="cg-hierarchy-tabs">
          {divisions.map((division) => (
            <CgTabTrigger key={division.id} value={division.id} className="cg-hierarchy-tab">
              {division.label}
            </CgTabTrigger>
          ))}
        </CgTabList>
      </CgTabs>

      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <CgSectionPanel noPadding>
          {/* Controls Bar */}
          <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 items-center justify-between bg-card rounded-t-lg">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <CgInput
                placeholder="Search by name, EN number, phone, email..."
                value={search}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <CgSelect
                value={status}
                onValueChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
                options={STATUS_OPTIONS}
                placeholder="Filter by status"
                className="w-full sm:w-48"
              />
            </div>
          </div>

          {/* Table Area */}
          <div className="min-h-[400px]">
            {isError ? (
              <div className="p-8 text-center text-destructive flex flex-col items-center justify-center h-full">
                <AlertCircle className="w-10 h-10 mb-3 opacity-50" />
                <h3 className="font-semibold text-lg">Failed to load applications</h3>
                <p className="text-sm opacity-80 mt-1">Please ensure the backend server has been restarted.</p>
              </div>
            ) : isLoading ? (
              <div className="p-12 flex flex-col items-center justify-center h-full text-muted-foreground">
                <Loader2 className="w-8 h-8 cg-spin mb-4 text-primary" />
                <p>Fetching applications...</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">No applications found</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  {search ? "Try adjusting your search or filters to find what you're looking for." : "There are currently no applications matching this criteria."}
                </p>
              </div>
            ) : (
              <CgDataTable
                columns={columns}
                data={applications}
                pageSize={limit}
                // Optional: implement manual pagination controls below if needed, 
                // but CgDataTable handles basic rendering. 
                // Since we fetch paginated data from server, we would need external pagination controls.
              />
            )}
          </div>
          
          {/* Server-side Pagination Controls */}
          {total > 0 && Math.ceil(total / limit) > 1 && (
            <div className="p-4 border-t border-border flex items-center justify-between bg-muted/20">
              <span className="text-sm text-muted-foreground">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} applications
              </span>
              <div className="flex gap-2">
                <CgButton
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </CgButton>
                <CgButton
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(Math.ceil(total / limit), p + 1))}
                  disabled={page >= Math.ceil(total / limit)}
                >
                  Next
                </CgButton>
              </div>
            </div>
          )}
        </CgSectionPanel>
      </motion.div>
    </CgPageShell>
  );
}
