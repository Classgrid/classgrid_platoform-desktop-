import { useState } from "react";
import { Loader2, Search, CheckCircle, FileText } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getApplications, reportRLA } from "../api";

import { Button } from "@/components/marketing_ui/button";
import { Input } from "@/components/marketing_ui/input";

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
    <div
      title="RLA Reporting"
      description="Record physical reporting of allotted candidates and verify reporting documents."
      breadcrumbs={[
        { label: "Admissions", to: "/dept/admissions/dashboard" },
        { label: "RLA Reporting" },
      ]}
    >
      <div title="Find Candidate">
        <form onSubmit={handleSearch} >
          <div  >
            <div >
              <Search  size={16} />
              <Input
                className=" "
                placeholder="Enter EN Number (e.g. EN23123456)"
                value={enSearch}
                onChange={(e) => setEnSearch(e.target.value)}
              />
            </div>
          </div>
          <Button type="submit" variant="default" disabled={!enSearch.trim() || isLoading}>
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Search"}
          </Button>
        </form>
      </div>

      {queryEn && !isLoading && !candidate && (
        <div variant="warning" title="Not Found">
          No candidate found with EN Number "{queryEn}". They might not be allotted to your institution.
        </div>
      )}

      {queryEn && isError && (
        <div variant="danger" title="Error">
          Failed to fetch candidate information.
        </div>
      )}

      {candidate && (
        <div title="Candidate Details">
          {reportMutation.isSuccess && (
            <div >
              <div variant="success" title="Reported Successfully">
                Candidate has been marked as reported. They can now proceed with fee payment.
              </div>
            </div>
          )}

          {reportMutation.isError && (
            <div >
              <div variant="danger" title="Failed to Report">
                {(reportMutation.error as any)?.response?.data?.error || "An error occurred while marking the candidate as reported."}
              </div>
            </div>
          )}

          <div >
            <div >
              <div><strong>Name:</strong> {candidate.full_name}</div>
              <div><strong>EN Number:</strong> {candidate.en_number}</div>
              <div><strong>Category:</strong> {candidate.category || "OPEN"}</div>
              <div><strong>Seat Type:</strong> {candidate.seat_type || "N/A"}</div>
            </div>
            <div >
              <div>
                <strong>Current Status:</strong>{" "}
                <div variant={candidate.status === "rla_pending" ? "warning" : candidate.status === "fee_pending" ? "success" : "neutral"}>
                  {candidate.status.replace(/_/g, " ")}
                </div>
              </div>
              <div>
                <strong>RLA Status:</strong>{" "}
                {candidate.rla_status === "reported" ? (
                  <div variant="success">Reported</div>
                ) : (
                  <div variant="warning">{candidate.rla_status || "Pending"}</div>
                )}
              </div>
            </div>
          </div>

          <div >
            <Button
              variant="default"
              disabled={reportMutation.isPending || candidate.rla_status === "reported" || candidate.status !== "rla_pending"}
              onClick={() => reportMutation.mutate(candidate.en_number!)}
            >
              {reportMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              Mark as Reported (RLA)
            </Button>
            <Button variant="outline" disabled>
              <FileText size={16} /> Upload Reporting Reciept
            </Button>
          </div>
          
          {candidate.status !== "rla_pending" && candidate.rla_status !== "reported" && (
            <p >
              Candidate is currently in <strong>{candidate.status.replace(/_/g, " ")}</strong> stage. They must reach the RLA Pending stage before reporting can be confirmed.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
