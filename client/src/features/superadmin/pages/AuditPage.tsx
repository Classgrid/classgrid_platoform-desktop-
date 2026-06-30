import { useState, useMemo } from "react";
import { Download, FileBarChart, Users, GraduationCap, Building2, RefreshCw } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { SectionPanel } from "@/components/marketing_ui/SectionPanel";
import { StatCard } from "@/components/marketing_ui/StatCard";
import { DataTable } from "@/components/marketing_ui/data-table";
import { useAuditData } from "../queries/useAudit";
import { apiClient } from "@/lib/apiClient";
import { format } from "date-fns";

export function AuditPage() {
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d;
  });
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [isExporting, setIsExporting] = useState(false);

  const startStr = startDate ? format(startDate, "yyyy-MM-dd") : "";
  const endStr = endDate ? format(endDate, "yyyy-MM-dd") : "";

  const { data, isLoading, isError, refetch, isFetching } = useAuditData(startStr, endStr);
  const audit = data?.data;

  // CSV Export logic
  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const response = await apiClient.get("/api/audit/export/csv", {
        params: { startDate: startStr, endDate: endStr },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data as any]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `NAAC_Audit_${startStr}_to_${endStr}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Export failed", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      const response = await apiClient.get("/api/audit/report", {
        params: { startDate: startStr, endDate: endStr },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data as any]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `NAAC_Audit_Report_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error: any) {
      console.error("Export failed", error);
      alert(error?.response?.data?.message || error?.message || "Failed to generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const perfColumns: ColumnDef<any>[] = useMemo(
    () => [
      { accessorKey: "classroomName", header: "Classroom", size: 150 },
      { accessorKey: "totalStudents", header: "Students", size: 100 },
      { accessorKey: "passedStudents", header: "Passed", size: 100 },
      {
        accessorKey: "passRate",
        header: "Pass Rate",
        size: 100,
        cell: ({ getValue }) => `${(getValue<number>() ?? 0).toFixed(1)}%`,
      },
      { accessorKey: "avgPercentage", header: "Avg %", size: 100 },
      { accessorKey: "avgCGPA", header: "Avg CGPA", size: 100, cell: ({ getValue }) => getValue() || "N/A" },
    ],
    []
  );

  const academicData = audit?.criterion2?.academicPerformance ?? [];

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Institutional Audit (NAAC / NBA)</h1>
          <p className="text-muted-foreground mt-1">
            Automated compliance and data aggregation engine for government reports.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginRight: "1rem" }}>
            <div style={{ width: "160px" }}>
              <input
                className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full"
                type="date"
                value={startStr}
                onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : undefined)}
              />
            </div>
            <span className="text-muted-foreground">to</span>
            <div style={{ width: "160px" }}>
              <input
                className="border border-border rounded-md px-3 py-2 text-sm bg-background w-full"
                type="date"
                value={endStr}
                onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : undefined)}
              />
            </div>
          </div>
          <RefreshButton onClick={() => refetch()} isFetching={isFetching} label="Refresh" />
          <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2" onClick={handleExportCSV} disabled={isExporting || isLoading}>
            <Download size={14} className="mr-2" />
            CSV Export
          </button>
          <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2" onClick={handleExportPDF} disabled={isExporting || isLoading}>
            <FileBarChart size={14} className="mr-2" />
            PDF Report
          </button>
        </div>
      </div>

      {isError ? (
        <div className="bg-red-100 text-red-800 p-4 rounded-md border border-red-200">Failed to load audit data.</div>
      ) : (
        <>
          {/* Enrollment Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Students"
              value={isLoading ? "—" : audit?.enrollment?.totalStudents ?? 0}
              icon={<Users size={16} />}
            />
            <StatCard
              title="Total Faculty"
              value={isLoading ? "—" : audit?.enrollment?.totalFaculty ?? 0}
              icon={<GraduationCap size={16} />}
            />
            <StatCard
              title="Student-Faculty Ratio"
              value={isLoading ? "—" : audit?.enrollment?.studentFacultyRatio ?? "0:1"}
            />
            <StatCard
              title="Classrooms"
              value={isLoading ? "—" : audit?.enrollment?.totalClassrooms ?? 0}
              icon={<Building2 size={16} />}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem", marginTop: "1.5rem" }}>
            {/* Criterion 2: Academic Performance Table */}
            <SectionPanel title="Criterion 2: Academic Performance" description="Aggregated pass rates and averages by classroom." noPadding>
              <DataTable
                columns={perfColumns}
                data={academicData}
                pageSize={5}
                emptyMessage={isLoading ? "Aggregating data..." : "No academic records for this period."}
              />
            </SectionPanel>
          </div>
        </>
      )}
    </div>
  );
}
