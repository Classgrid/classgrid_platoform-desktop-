import { Loader2 } from "lucide-react";

import { useAdmissionConfig, useUpdateAdmissionConfig } from "../queries/useAdmissionConfig";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { advanceRound } from "../api";

export function AdmissionSchedulePage() {
  const { data: configResponse, isLoading, isError } = useAdmissionConfig();
  const update = useUpdateAdmissionConfig();
  const qc = useQueryClient();
  const advance = useMutation({ mutationFn: advanceRound, onSuccess: () => qc.invalidateQueries({ queryKey: ["admission-config"] }) });

  if (isLoading) return <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}><Loader2 size={24} className="animate-spin" /></div>;
  if (isError || !configResponse) return <div title="Schedule & Rounds" breadcrumbs={[{ label: "Admissions", to: "/dept/admissions/dashboard" }, { label: "Schedule" }]}><div variant="danger" title="Error">Could not load config.</div></div>;

  const cfg = configResponse.config || {};
  const round = cfg.admission_round;

  return (
    <div title="Schedule & Rounds" description="Admission round management and cycle timeline."
      breadcrumbs={[{ label: "Admissions", to: "/dept/admissions/dashboard" }, { label: "Schedule & Rounds" }]}>
      {update.isSuccess && <div variant="success" title="Updated">Round configuration saved.</div>}
      {advance.isSuccess && <div variant="success" title="Advanced">Successfully advanced to the next admission round.</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <div title="Round Status">
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <strong>Current Round:</strong>{" "}
              <div variant="info">{round?.current_round || 1} / {round?.max_rounds || 3}</div>
            </div>
            <div>
              <strong>Portal Status:</strong>{" "}
              {cfg.is_portal_open
                ? <div variant="success">Open</div>
                : <div variant="danger">Closed</div>}
            </div>
            <div>
              <strong>Merit List:</strong>{" "}
              {cfg.is_merit_list_published
                ? <div variant="success">Published</div>
                : <div variant="neutral">Unpublished</div>}
            </div>
          </div>
        </div>

        <div title="Actions">
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <button className="inline-flex items-center justify-center rounded-md text-sm font-medium border h-9 px-4 py-2 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground" onClick={() => update.mutate({
              admission_config: { is_portal_open: !cfg.is_portal_open }
            })}>
              {cfg.is_portal_open ? "Close" : "Open"} Portal
            </button>
            <button className="inline-flex items-center justify-center rounded-md text-sm font-medium border h-9 px-4 py-2 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground" onClick={() => update.mutate({
              admission_config: { is_merit_list_published: !cfg.is_merit_list_published }
            })}>
              {cfg.is_merit_list_published ? "Unpublish" : "Publish"} Merit List
            </button>
            <button className="inline-flex items-center justify-center rounded-md text-sm font-medium border h-9 px-4 py-2 bg-primary text-primary-foreground shadow" disabled={advance.isPending || !cfg.is_portal_open} onClick={() => advance.mutate()}>
              {advance.isPending ? <Loader2 size={14} className="animate-spin" /> : null} Advance to Next Round
            </button>
          </div>
        </div>

        {/* Round History */}
        {(round?.round_history || []).length > 0 && (
          <div title="Round History">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {round!.round_history.map((rh) => (
                <div key={rh.round_number} style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }}>
                  <span>Round {rh.round_number}</span>
                  <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.85rem" }}>
                    <span>Filled: <strong>{rh.seats_filled || 0}</strong></span>
                    <span>Remaining: <strong>{rh.seats_remaining || 0}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
