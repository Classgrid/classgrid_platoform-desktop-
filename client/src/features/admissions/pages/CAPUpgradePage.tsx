import { useState } from "react";
import { Loader2, Search, ArrowUpCircle, FileText } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CgPageShell, CgSectionPanel, CgAlert, CgBadge } from "@/components/classgrid";
import { getApplications, requestNOC, confirmUpgrade } from "../api";

export function CAPUpgradePage() {
  const [enSearch, setEnSearch] = useState("");
  const [queryEn, setQueryEn] = useState("");
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admission-applications", queryEn],
    queryFn: () => getApplications({ search: queryEn }),
    enabled: !!queryEn,
  });

  const nocMutation = useMutation({
    mutationFn: (en: string) => requestNOC(en),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admission-applications", queryEn] });
    },
  });

  const upgradeMutation = useMutation({
    mutationFn: (en: string) => confirmUpgrade(en),
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
      title="CAP Upgrades & NOC"
      description="Process NOC requests and confirm upgrades for candidates participating in subsequent CAP rounds."
      breadcrumbs={[
        { label: "Admissions", to: "/dept/admissions/dashboard" },
        { label: "CAP Upgrades" },
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
          No candidate found with EN Number "{queryEn}".
        </CgAlert>
      )}

      {queryEn && isError && (
        <CgAlert variant="danger" title="Error">
          Failed to fetch candidate information.
        </CgAlert>
      )}

      {candidate && (
        <div style={{ display: "grid", gap: "1.5rem" }}>
          <CgSectionPanel title="Candidate Status">
            {upgradeMutation.isSuccess && (
              <div style={{ marginBottom: "1.5rem" }}>
                <CgAlert variant="success" title="Upgrade Confirmed">
                  Candidate has been marked as upgraded and their seat has been vacated.
                </CgAlert>
              </div>
            )}

            {(upgradeMutation.isError || nocMutation.isError) && (
              <div style={{ marginBottom: "1.5rem" }}>
                <CgAlert variant="danger" title="Action Failed">
                  {((upgradeMutation.error || nocMutation.error) as any)?.response?.data?.error || "An error occurred while processing the request."}
                </CgAlert>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div><strong>Name:</strong> {candidate.full_name}</div>
                <div><strong>EN Number:</strong> {candidate.en_number}</div>
                <div><strong>Category:</strong> {candidate.category || "OPEN"}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <strong>Current Status:</strong>{" "}
                  <CgBadge variant={candidate.status === "enrolled" ? "success" : candidate.status === "upgraded" ? "info" : "neutral"}>
                    {candidate.status.replace(/_/g, " ")}
                  </CgBadge>
                </div>
                <div>
                  <strong>RLA Status:</strong>{" "}
                  {candidate.rla_status === "upgraded" ? (
                    <CgBadge variant="info">Upgraded Out</CgBadge>
                  ) : candidate.rla_status === "reported" ? (
                    <CgBadge variant="success">Reported</CgBadge>
                  ) : (
                    <CgBadge variant="neutral">{candidate.rla_status || "Pending"}</CgBadge>
                  )}
                </div>
              </div>
            </div>
          </CgSectionPanel>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <CgSectionPanel title="Step 1: NOC Request">
              <p style={{ fontSize: "0.85rem", color: "hsl(var(--muted-foreground))", marginBottom: "1rem" }}>
                Issue a No Objection Certificate if the candidate requests to participate in the next CAP round. This does not cancel their current admission.
              </p>
              <button
                className="cg-btn cg-btn--outline"
                disabled={nocMutation.isPending || candidate.status === "upgraded"}
                onClick={() => nocMutation.mutate(candidate.en_number!)}
              >
                {nocMutation.isPending ? <Loader2 size={16} className="cg-spin" /> : <FileText size={16} />}
                Generate NOC
              </button>
            </CgSectionPanel>

            <CgSectionPanel title="Step 2: Confirm Upgrade">
              <p style={{ fontSize: "0.85rem", color: "hsl(var(--muted-foreground))", marginBottom: "1rem" }}>
                If the candidate is allotted a seat elsewhere, confirm the upgrade. <strong>Warning:</strong> This will cancel their current admission and release their seat for the vacancy pool.
              </p>
              <button
                className="cg-btn cg-btn--danger"
                disabled={upgradeMutation.isPending || candidate.status === "upgraded"}
                onClick={() => {
                  if (window.confirm("Are you sure you want to mark this candidate as upgraded? Their seat will be vacated.")) {
                    upgradeMutation.mutate(candidate.en_number!);
                  }
                }}
              >
                {upgradeMutation.isPending ? <Loader2 size={16} className="cg-spin" /> : <ArrowUpCircle size={16} />}
                Confirm Upgrade
              </button>
            </CgSectionPanel>
          </div>
        </div>
      )}
    </CgPageShell>
  );
}
