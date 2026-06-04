import { useState } from "react";
import { Loader2, Search, CheckCircle, FileText } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CgPageShell, CgSectionPanel, CgAlert, CgBadge } from "@/components/classgrid";
import { getApplications, reportRLA } from "../api";

export function RLAReportingPage() {
  const [enSearch, setEnSearch] = useState("");
  const [queryEn, setQueryEn] = useState("");
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admission-applications", queryEn],
    queryFn: () => getApplications({ search: queryEn }),
    enabled: !!queryEn,
  });

  const reportMutation = useMutation({
    mutationFn: (en: string) => reportRLA(en),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admission-applications", queryEn] });
      qc.invalidateQueries({ queryKey: ["admission-analytics"] });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (enSearch.trim()) {
      setQueryEn(enSearch.trim());
    }
  };

  const candidate = data?.applications?.find((a: any) => a.en_number?.toLowerCase() === queryEn.toLowerCase());

  return (
    <CgPageShell
      title="RLA Reporting"
      description="Record physical reporting of allotted candidates and verify reporting documents."
      breadcrumbs={[
        { label: "Admissions", to: "/dept/admissions/dashboard" },
        { label: "RLA Reporting" },
      ]}
    >
      <CgSectionPanel title="Find Candidate">
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "1rem" }}>
          <div className="cg-form__field" style={{ flex: 1, marginBottom: 0 }}>
            <div className="cg-form__input-wrapper">
              <Search className="cg-form__input-icon" size={16} />
              <input
                className="cg-form__input cg-form__input--with-icon"
                placeholder="Enter EN Number (e.g. EN23123456)"
                value={enSearch}
                onChange={(e) => setEnSearch(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="cg-btn cg-btn--primary" disabled={!enSearch.trim() || isLoading}>
            {isLoading ? <Loader2 size={16} className="cg-spin" /> : "Search"}
          </button>
        </form>
      </CgSectionPanel>

      {queryEn && !isLoading && !candidate && (
        <CgAlert variant="warning" title="Not Found">
          No candidate found with EN Number "{queryEn}". They might not be allotted to your institution.
        </CgAlert>
      )}

      {queryEn && isError && (
        <CgAlert variant="danger" title="Error">
          Failed to fetch candidate information.
        </CgAlert>
      )}

      {candidate && (
        <CgSectionPanel title="Candidate Details">
          {reportMutation.isSuccess && (
            <div style={{ marginBottom: "1.5rem" }}>
              <CgAlert variant="success" title="Reported Successfully">
                Candidate has been marked as reported. They can now proceed with fee payment.
              </CgAlert>
            </div>
          )}

          {reportMutation.isError && (
            <div style={{ marginBottom: "1.5rem" }}>
              <CgAlert variant="danger" title="Failed to Report">
                {(reportMutation.error as any)?.response?.data?.error || "An error occurred while marking the candidate as reported."}
              </CgAlert>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div><strong>Name:</strong> {candidate.full_name}</div>
              <div><strong>EN Number:</strong> {candidate.en_number}</div>
              <div><strong>Category:</strong> {candidate.category || "OPEN"}</div>
              <div><strong>Seat Type:</strong> {candidate.seat_type || "N/A"}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <strong>Current Status:</strong>{" "}
                <CgBadge variant={candidate.status === "rla_pending" ? "warning" : candidate.status === "fee_pending" ? "success" : "neutral"}>
                  {candidate.status.replace(/_/g, " ")}
                </CgBadge>
              </div>
              <div>
                <strong>RLA Status:</strong>{" "}
                {candidate.rla_status === "reported" ? (
                  <CgBadge variant="success">Reported</CgBadge>
                ) : (
                  <CgBadge variant="warning">{candidate.rla_status || "Pending"}</CgBadge>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem", paddingTop: "1.5rem", borderTop: "1px solid hsl(var(--border))" }}>
            <button
              className="cg-btn cg-btn--primary"
              disabled={reportMutation.isPending || candidate.rla_status === "reported" || candidate.status !== "rla_pending"}
              onClick={() => reportMutation.mutate(candidate.en_number!)}
            >
              {reportMutation.isPending ? <Loader2 size={16} className="cg-spin" /> : <CheckCircle size={16} />}
              Mark as Reported (RLA)
            </button>
            <button className="cg-btn cg-btn--outline" disabled>
              <FileText size={16} /> Upload Reporting Reciept
            </button>
          </div>
          
          {candidate.status !== "rla_pending" && candidate.rla_status !== "reported" && (
            <p style={{ marginTop: "1rem", fontSize: "0.85rem", color: "hsl(var(--muted-foreground))" }}>
              Candidate is currently in <strong>{candidate.status.replace(/_/g, " ")}</strong> stage. They must reach the RLA Pending stage before reporting can be confirmed.
            </p>
          )}
        </CgSectionPanel>
      )}
    </CgPageShell>
  );
}
