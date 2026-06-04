import { useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCw } from "lucide-react";
import { CgPageShell, CgSectionPanel, CgAlert, CgEmptyState } from "@/components/classgrid";
import { getSeatMatrix } from "../api";

export function VacancyTrackerPage() {
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["admission-seat-matrix"],
    queryFn: getSeatMatrix,
    refetchInterval: 10000, // Poll every 10 seconds for real-time feel
  });

  const seatMatrixData = data?.data || [];

  return (
    <CgPageShell
      title="Vacancy & Seat Tracker"
      description="Live dashboard monitoring available seats, waitlists, and quotas across branches."
      breadcrumbs={[
        { label: "Admissions", to: "/dept/admissions/dashboard" },
        { label: "Vacancy Tracker" },
      ]}
      actions={
        <button
          className="cg-btn cg-btn--outline"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw size={14} className={isRefetching ? "cg-spin" : ""} />
          Refresh Now
        </button>
      }
    >
      {isError && (
        <CgAlert variant="danger" title="Error">
          Could not load the live seat matrix.
        </CgAlert>
      )}

      {isLoading ? (
        <div className="cg-loading">
          <Loader2 size={24} className="cg-spin" />
        </div>
      ) : seatMatrixData.length === 0 ? (
        <CgEmptyState
          title="No Seat Matrix Configured"
          description="Seat quotas and capacities are not currently configured for this admission cycle."
        />
      ) : (
        <div className="cg-flex-col" style={{ gap: "2rem" }}>
          {seatMatrixData.map((branchConfig: any) => (
            <CgSectionPanel
              key={branchConfig._id}
              title={branchConfig.hierarchy_id?.name || "Institution Level"}
            >
              <div className="cg-grid-auto-lg">
                {(branchConfig.quotas || []).map((quota: any) => {
                  const vacancy = quota.capacity - quota.filled;
                  const fillRate = (quota.filled / quota.capacity) * 100;
                  
                  // Color coding based on vacancy
                  let statusColor = "hsl(var(--success))";
                  if (fillRate >= 100) statusColor = "hsl(var(--destructive))";
                  else if (fillRate >= 80) statusColor = "hsl(var(--warning))";

                  return (
                    <div
                      key={quota.name}
                      className="cg-vacancy-card"
                    >
                      {/* Top color bar indicator */}
                      <div
                        className="cg-vacancy-card__bar"
                        style={{ backgroundColor: statusColor }}
                      />
                      
                      <div className="cg-vacancy-card__header">
                        <div className="cg-vacancy-card__name">{quota.name}</div>
                        {fillRate >= 100 && (
                          <span className="cg-pill--danger">
                            FULL
                          </span>
                        )}
                      </div>

                      <div className="cg-vacancy-card__stats">
                        <div>
                          <div className="cg-vacancy-card__stat-label">Total Capacity</div>
                          <div className="cg-vacancy-card__stat-value">{quota.capacity}</div>
                        </div>
                        <div>
                          <div className="cg-vacancy-card__stat-label">Filled</div>
                          <div className="cg-vacancy-card__stat-value">{quota.filled}</div>
                        </div>
                        <div>
                          <div className="cg-vacancy-card__stat-label">Vacant</div>
                          <div className="cg-vacancy-card__stat-value--bold" style={{ color: statusColor }}>{vacancy > 0 ? vacancy : 0}</div>
                        </div>
                        <div>
                          <div className="cg-vacancy-card__stat-label">Waitlist</div>
                          <div className="cg-vacancy-card__stat-value" style={{ color: quota.waitlist_count > 0 ? "hsl(var(--warning))" : "inherit" }}>
                            {quota.waitlist_count || 0}
                          </div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="cg-vacancy-card__progress">
                        <div className="cg-vacancy-card__progress-fill" style={{ backgroundColor: statusColor, width: `${Math.min(fillRate, 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CgSectionPanel>
          ))}
        </div>
      )}
    </CgPageShell>
  );
}
