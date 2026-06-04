import type { ApplicationState } from "../types";

// ═══════════════════════════════════════════════════════════════
// CgStatusTracker — Visual progression for Non-CET admission
//
// Shows the exact pipeline from CLASSGRID_SCHOOL_ADMISSION_PLAN:
//   applied → under_review → shortlisted → selected → enrolled
//
// Also handles branching states:
//   rejected, waitlisted, withdrawn, expired
// ═══════════════════════════════════════════════════════════════

const NON_CET_PIPELINE = [
  "applied",
  "under_review",
  "shortlisted",
  "selected",
  "enrolled",
] as const;

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  applied: "Applied",
  under_review: "Under Review",
  shortlisted: "Shortlisted",
  selected: "Selected",
  waitlisted: "Waitlisted",
  enrolled: "Enrolled",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
  expired: "Expired",
  // CET states
  student_registered: "Registered",
  form_submitted: "Form Submitted",
  prn_generated: "PRN Generated",
  admin_verified: "Admin Verified",
  division_allotted: "Division Allotted",
  fee_pending: "Fee Pending",
  rla_pending: "RLA Pending",
  cancelled: "Cancelled",
  upgraded_to_other: "Upgraded",
};

const TERMINAL_STATES = ["rejected", "withdrawn", "expired", "cancelled", "upgraded_to_other"];

type Props = {
  app: ApplicationState;
  structureType?: string;
};

export function CgStatusTracker({ app, structureType }: Props) {
  const status = app.status;
  const isTerminal = TERMINAL_STATES.includes(status);
  const isWaitlisted = status === "waitlisted";

  // Find where the current status falls in the pipeline
  const currentIndex = NON_CET_PIPELINE.indexOf(status as any);
  const effectiveIndex = currentIndex >= 0 ? currentIndex : -1;

  return (
    <div className="cg-status-tracker__container">
      {/* Status label */}
      <div className="cg-status-tracker__header">
        <div className="cg-status-tracker__label">
          Application Status
        </div>
        <div
          className={`cg-status-tracker__badge ${
            isTerminal
              ? "cg-status-tracker__badge--terminal"
              : isWaitlisted
              ? "cg-status-tracker__badge--waitlisted"
              : effectiveIndex >= 3
              ? "cg-status-tracker__badge--success"
              : "cg-status-tracker__badge--primary"
          }`}
        >
          {STATUS_LABELS[status] || status.replace(/_/g, " ")}
        </div>
      </div>

      {/* Pipeline steps */}
      {!isTerminal && (
        <div className="cg-status-tracker__pipeline">
          {NON_CET_PIPELINE.map((step, i) => {
            const isPast = effectiveIndex >= i;
            const isCurrent = effectiveIndex === i;
            const isWaitlistAtShortlist = isWaitlisted && step === "shortlisted";

            let circleClass = "cg-status-tracker__circle";
            if (isPast) circleClass += " cg-status-tracker__circle--past";
            else if (isCurrent) circleClass += " cg-status-tracker__circle--current";
            else if (isWaitlistAtShortlist) circleClass += " cg-status-tracker__circle--waitlist";

            return (
              <div key={step} className="cg-status-tracker__step">
                {/* Circle */}
                <div className={circleClass}>
                  {isPast ? "✓" : i + 1}
                  {/* Label */}
                  <span
                    className={`cg-status-tracker__step-label ${
                      isPast || isCurrent ? "cg-status-tracker__step-label--active" : ""
                    }`}
                  >
                    {STATUS_LABELS[step]}
                  </span>
                </div>
                {/* Connector line */}
                {i < NON_CET_PIPELINE.length - 1 && (
                  <div
                    className={`cg-status-tracker__connector ${
                      isPast && effectiveIndex > i ? "cg-status-tracker__connector--active" : ""
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Waitlist badge */}
      {isWaitlisted && (
        <div className="cg-status-tracker__waitlist-card">
          <span className="cg-text-lg">⏳</span>
          <div>
            <div className="cg-font-semibold">
              Waitlist Position: WL-{app.waitlist_number ?? "?"}
            </div>
            <div className="cg-text-micro cg-text-muted">
              You will be promoted automatically when a seat becomes available.
            </div>
          </div>
        </div>
      )}

      {/* Terminal state */}
      {isTerminal && (
        <div className="cg-status-tracker__terminal-card">
          {status === "rejected" && (app.rejection_reason || "Your application has been rejected. Contact the admission office.")}
          {status === "withdrawn" && "You have withdrawn your application."}
          {status === "expired" && "Your seat offer expired because fees were not paid in time."}
        </div>
      )}
    </div>
  );
}
