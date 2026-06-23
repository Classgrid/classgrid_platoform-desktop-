import { useState, useMemo } from "react";
import { Download, FileBarChart, Users, GraduationCap, Building2, RefreshCw } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { SectionPanel } from "@/components/marketing_ui/SectionPanel";
import { StatCard } from "@/components/marketing_ui/StatCard";
import { DataTable } from "@/components/marketing_ui/data-table";
import { CgDatePicker } from "@/components/classgrid/DatePicker";
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
    <div className="cg-page">
      {/* Header */}
      <div className="cg-page__header">
        <div className="cg-page__header-content">
          <h1 className="cg-page__title">Institutional Audit (NAAC / NBA)</h1>
          <p className="cg-page__description">
            Automated compliance and data aggregation engine for government reports.
          </p>
        </div>
        <div className="cg-page__header-actions">
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginRight: "1rem" }}>
            <div style={{ width: "160px" }}>
              <CgDatePicker
                value={startDate}
                onChange={setStartDate}
                placeholder="Start Date"
              />
            </div>
            <span style={{ color: "var(--text-muted)" }}>to</span>
            <div style={{ width: "160px" }}>
              <CgDatePicker
                value={endDate}
                onChange={setEndDate}
                placeholder="End Date"
              />
            </div>
          </div>
          <button className="cg-btn cg-btn--outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw size={14} className={isFetching ? "cg-spin" : ""} />
            Refresh
          </button>
          <button className="cg-btn cg-btn--outline" onClick={handleExportCSV} disabled={isExporting || isLoading}>
            <Download size={14} />
            CSV Export
          </button>
          <button className="cg-btn cg-btn--primary" onClick={handleExportPDF} disabled={isExporting || isLoading}>
            <FileBarChart size={14} />
            PDF Report
          </button>
        </div>
      </div>

      {isError ? (
        <div className="cg-alert cg-alert--danger">Failed to load audit data.</div>
      ) : (
        <>
          {/* Enrollment Metrics */}
          <div className="cg-stats-grid">
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
