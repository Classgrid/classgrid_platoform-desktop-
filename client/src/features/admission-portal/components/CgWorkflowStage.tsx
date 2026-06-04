import type { ApplicationState, EngineConfigResponse, FormSchema } from "../types";
import { CgFormEngine } from "./CgFormEngine";
import { CgDocumentEngine } from "./CgDocumentEngine";
import { CgStatusTracker } from "./CgStatusTracker";
import { CgAlert, CgBadge } from "@/components/classgrid";
import { Loader2, Upload, CreditCard, Download, CheckCircle2, Clock, AlertTriangle, XCircle, Printer, LogOut } from "lucide-react";
import { useState } from "react";
import { uploadDocument, submitApplication, initiateFeePayment, printApplication, printConfirmation, withdrawApplication } from "../api";
import { useSeatAvailability } from "../queries/useAdmissionEngine";

// ═══════════════════════════════════════════════════════════════
// CgWorkflowStage — State-machine renderer for candidate portal
//
// Reads the application's `status` and renders the correct UI:
//   draft → form editor
//   applied / under_verification → document upload + read-only form
//   waitlisted → waitlist rank + deadline timer
//   fee_pending → fee checkout
//   enrolled → success + downloads
//   rejected → rejection notice
//
// All config-driven via EngineConfigResponse from backend.
// ═══════════════════════════════════════════════════════════════

type Props = {
  app: ApplicationState;
  engineConfig: EngineConfigResponse;
  onRefresh: () => void;
};

export function CgWorkflowStage({ app, engineConfig, onRefresh }: Props) {
  const { config, form_schema } = engineConfig;
  const [uploading, setUploading] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  // Fetch real-time seat availability for the form
  const { data: seatData } = useSeatAvailability(app.organization_id);

  // Check if form is still editable based on config
  const editableUntilDate = config.enrollment_config?.editable_until;
  const isFormLocked = editableUntilDate ? new Date() > new Date(editableUntilDate) : false;
  const isCetMode = form_schema?.auth_method === "cet_en_otp";

  // Portal closed check
  if (config.is_portal_open === false && app.status === "draft") {
    return (
      <div className="cg-workflow-stage cg-workflow-stage--centered">
        <XCircle size={48} className="cg-workflow-stage__icon--large cg-color-destructive" />
        <h2 className="cg-workflow-stage__title">Admission Portal Closed</h2>
        <p className="cg-workflow-stage__description">
          The admission window for this institution has been closed. Please contact the admission office for more information.
        </p>
      </div>
    );
  }

  // ── WITHDRAWN STATE ──
  if (app.status === "withdrawn") {
    return (
      <div className="cg-workflow-stage cg-workflow-stage--centered">
        <LogOut size={48} className="cg-workflow-stage__icon--large cg-color-muted" />
        <h2 className="cg-workflow-stage__title">Application Withdrawn</h2>
        <p className="cg-workflow-stage__description">
          You have withdrawn your application. This action cannot be undone.
        </p>
      </div>
    );
  }

  // ── EXPIRED STATE ──
  if (app.status === "expired") {
    return (
      <div className="cg-workflow-stage cg-workflow-stage--centered">
        <Clock size={48} className="cg-workflow-stage__icon--large cg-color-destructive" />
        <h2 className="cg-workflow-stage__title">Seat Offer Expired</h2>
        <p className="cg-workflow-stage__description">
          Your seat offer has expired because fee payment was not completed within the deadline.
          Please contact the admission office if you believe this is in error.
        </p>
      </div>
    );
  }

  // Print handlers
  const handlePrintApplication = async () => {
    setPrintLoading(true);
    try {
      const blob = await printApplication();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "admission-application.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Print application failed:", err);
      // Fallback to browser print
      window.print();
    } finally {
      setPrintLoading(false);
    }
  };

  const handlePrintConfirmation = async () => {
    setPrintLoading(true);
    try {
      const blob = await printConfirmation();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "admission-confirmation.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Print confirmation failed:", err);
      window.print();
    } finally {
      setPrintLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!window.confirm("Are you sure you want to withdraw your application? This action cannot be undone.")) return;
    setWithdrawing(true);
    try {
      await withdrawApplication(app._id);
      onRefresh();
    } catch (err) {
      console.error("Withdraw failed:", err);
    } finally {
      setWithdrawing(false);
    }
  };

  // ── STAGE: DRAFT / STUDENT REGISTERED → Editable Form ──
  if (app.status === "draft" || app.status === "student_registered") {
    const handleSubmitDraft = async (data: Record<string, any>) => {
      setSubmitting(true);
      try {
        // Save draft first, then submit
        const { saveApplicationDraft } = await import("../api");
        await saveApplicationDraft({ full_name: data.full_name || app.full_name, form_data: data });
        await submitApplication();
        onRefresh();
      } catch (err) {
        console.error("Submit failed:", err);
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="cg-workflow-stage">
        {app.status === "student_registered" && (
          <div className="cg-workflow-stage__form-preview">
            <CgAlert variant="info" title="Registration Successful">
              Please complete your admission form to proceed. Your CET details have been pre-fetched.
            </CgAlert>
          </div>
        )}
        <CgFormEngine
          formSchema={form_schema}
          config={config}
          seatData={seatData}
          initialData={app.form_data || {}}
          onSubmit={handleSubmitDraft}
          isReadOnly={isFormLocked}
        />
        {submitting && (
          <div className="cg-workflow-stage__note cg-mt-4 cg-flex-gap-2">
            <Loader2 size={16} className="cg-spin" /> Submitting application...
          </div>
        )}
      </div>
    );
  }

  // ── STAGE: SUBMITTED / VERIFICATION → Read-only form + Document Upload ──
  if (
    app.status === "applied" ||
    app.status === "under_verification" ||
    app.status === "verified" ||
    app.status === "form_submitted" ||
    app.status === "prn_generated" ||
    app.status === "admin_verified"
  ) {
    const requiredDocs = form_schema.documents || [];
    const allowReupload = config.workflow_execution?.require_admin_document_verification !== false;

    const handleUpload = async (docName: string, file: File) => {
      setUploading(docName);
      try {
        await uploadDocument(docName, file);
        onRefresh();
      } catch (err) {
        console.error("Upload failed:", err);
      } finally {
        setUploading(null);
      }
    };

    return (
      <div className="cg-workflow-stage">
        {/* Status Progression */}
        <CgStatusTracker app={app} structureType={engineConfig.structure_type} />
        
        <CgAlert variant="info" title="Application Submitted">
          Your application is {app.status === "verified" || app.status === "admin_verified" ? "verified" : "under review"}. You can upload documents below.
        </CgAlert>

        {/* Offline flow awareness */}
        {(app.status === "under_verification" || app.status === "applied") && (
          <div className="cg-workflow-stage__note">
            📋 <strong>Note:</strong> Original document verification, physical signatures, and fee payment happen at the institution. This portal handles the online part only.
          </div>
        )}

        {/* Read-only form preview */}
        <details className="cg-workflow-stage__form-preview">
          <summary className="cg-workflow-stage__form-preview-summary">
            View Submitted Data
          </summary>
          <CgFormEngine formSchema={form_schema} config={config} initialData={app.form_data || {}} onSubmit={() => {}} isReadOnly />
        </details>

        {/* Document Upload System */}
        <div className="cg-document-engine__section">
          <h3 className="cg-workflow-stage__timeline-title">Required Documents</h3>
          <CgDocumentEngine
            documentsSchema={requiredDocs}
            existingDocs={(app.documents || []).reduce((acc, doc) => {
              acc[doc.name] = {
                id: doc.name,
                url: doc.url,
                state: doc.status as any,
                rejection_reason: doc.rejection_reason,
              };
              return acc;
            }, {} as Record<string, any>)}
            onUpload={handleUpload}
            onComplete={() => {
              // Could call a "finalize documents" API if needed, otherwise just refresh
              onRefresh();
            }}
            isReadOnly={app.status === "verified" || app.status === "admin_verified" || app.status === "prn_generated"}
          />
        </div>

        {/* Action Buttons */}
        <div className="cg-workflow-stage__action-bar">
          <div className="cg-flex-gap-2">
            {/* Print application (allowed after form_submitted) */}
            <button
              className="cg-btn cg-btn--outline"
              onClick={handlePrintApplication}
              disabled={printLoading}
            >
              {printLoading ? <Loader2 size={14} className="cg-spin" /> : <Printer size={14} />}
              Print Application
            </button>
            {app.prn && (
              <span className="cg-workflow-stage__timeline-meta cg-flex-center">
                PRN: <strong>{app.prn}</strong>
              </span>
            )}
          </div>
          {/* Withdraw (allowed before selected) */}
          {!["selected", "enrolled", "verified", "admin_verified", "prn_generated"].includes(app.status) && (
            <button
              className="cg-btn cg-btn--ghost cg-color-destructive"
              onClick={handleWithdraw}
              disabled={withdrawing}
            >
              {withdrawing ? <Loader2 size={14} className="cg-spin" /> : <LogOut size={14} />}
              Withdraw Application
            </button>
          )}
        </div>

        {/* Stage History Timeline */}
        {app.stage_history?.length > 0 && (
          <div className="cg-workflow-stage__timeline">
            <h3 className="cg-workflow-stage__timeline-title">Application Timeline</h3>
            <div className="cg-workflow-stage__timeline-list">
              {app.stage_history.map((entry, i) => (
                <div key={i} className="cg-workflow-stage__timeline-item">
                  <div className="cg-workflow-stage__timeline-status">
                    {entry.status.replace(/_/g, " ")}
                  </div>
                  <div className="cg-workflow-stage__timeline-meta">
                    {new Date(entry.timestamp).toLocaleString("en-IN")}
                    {entry.comment && ` — ${entry.comment}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── STAGE: REJECTED ──
  if (app.status === "rejected") {
    return (
      <div className="cg-workflow-stage cg-workflow-stage--centered">
        <XCircle size={48} className="cg-workflow-stage__icon--large cg-color-destructive" />
        <h2 className="cg-workflow-stage__title">Application Rejected</h2>
        {app.rejection_reason && (
          <CgAlert variant="danger" title="Reason">{app.rejection_reason}</CgAlert>
        )}
        <p className="cg-workflow-stage__description cg-workflow-stage__description--spaced">
          Please contact the admission office for further information.
        </p>
      </div>
    );
  }

  // ── STAGE: CANCELLED / UPGRADED ──
  if (app.status === "cancelled" || app.status === "upgraded_to_other") {
    return (
      <div className="cg-workflow-stage cg-workflow-stage--centered">
        <XCircle size={48} className="cg-workflow-stage__icon--large cg-color-destructive" />
        <h2 className="cg-workflow-stage__title">
          {app.status === "cancelled" ? "Admission Cancelled" : "Admission Upgraded"}
        </h2>
        <p className="cg-workflow-stage__description">
          {app.status === "upgraded_to_other" 
            ? "You have been upgraded to another institution in subsequent CAP rounds." 
            : "Your admission has been cancelled."}
        </p>
      </div>
    );
  }

  // ── STAGE: DIVISION ALLOTTED / RLA PENDING ──
  if (app.status === "division_allotted" || app.status === "rla_pending") {
    return (
      <div className="cg-workflow-stage cg-workflow-stage--centered">
        <AlertTriangle size={48} className="cg-workflow-stage__icon--large cg-color-warning" />
        <h2 className="cg-workflow-stage__title">Physical Reporting Required</h2>
        <p className="cg-workflow-stage__description cg-workflow-stage__description--constrained">
          You must physically report to the institute for document verification and to claim your seat. 
          Failure to report by the deadline will result in the forfeiture of your seat.
        </p>
        
        {app.rla_status === "reported" ? (
          <CgAlert variant="success" title="Reporting Confirmed">
            You have successfully reported to the institute. Please wait for the final fee payment link to be activated.
          </CgAlert>
        ) : (
          <div className="cg-workflow-stage__card">
            <div className="cg-workflow-stage__card-label">
              Action Required
            </div>
            <div className="cg-workflow-stage__card-value cg-text-lg">
              Visit Admission Office
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── STAGE: WAITLISTED ──
  if (app.status === "waitlisted") {
    const deadlineHours = config.waitlist_and_deadlines?.fee_payment_deadline_hours || 48;

    return (
      <div className="cg-workflow-stage cg-workflow-stage--centered">
        <Clock size={48} className="cg-workflow-stage__icon--large cg-color-warning" />
        <h2 className="cg-workflow-stage__title">You are Waitlisted</h2>
        <p className="cg-workflow-stage__description cg-workflow-stage__description--spaced-bottom">
          Your application is on the waitlist. We will notify you if a seat becomes available.
        </p>

        <div className="cg-workflow-stage__card">
          <div className="cg-workflow-stage__card-label">
            Current Waitlist Position
          </div>
          <div className="cg-workflow-stage__card-value cg-color-warning">
            WL-{app.waitlist_number ?? "?"}
          </div>
        </div>

        {config.waitlist_and_deadlines?.auto_promote_waitlist && (
          <p className="cg-workflow-stage__timeline-meta">
            Promoted candidates will have {deadlineHours} hours to complete fee payment.
          </p>
        )}
      </div>
    );
  }

  // ── STAGE: FEE PENDING ──
  if (app.status === "fee_pending" || app.status === "allotted" || app.status === "confirmed") {
    const handlePay = async () => {
      setPayLoading(true);
      try {
        const result = await initiateFeePayment();
        // Open Razorpay checkout if razorpay_order_id is returned
        if (result.razorpay_order_id && typeof window !== "undefined" && (window as any).Razorpay) {
          const options = {
            key: result.razorpay_key_id,
            amount: result.amount,
            currency: "INR",
            order_id: result.razorpay_order_id,
            name: engineConfig.organization,
            handler: () => onRefresh(),
          };
          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        }
      } catch (err) {
        console.error("Payment initiation failed:", err);
      } finally {
        setPayLoading(false);
      }
    };

    return (
      <div className="cg-workflow-stage cg-workflow-stage--centered">
        <CreditCard size={48} className="cg-workflow-stage__icon--large cg-color-primary" />
        <h2 className="cg-workflow-stage__title">
          {app.status === "allotted" ? "Seat Allotted — Pay to Confirm" : "Fee Payment Required"}
        </h2>
        <p className="cg-workflow-stage__description cg-workflow-stage__description--spaced-bottom">
          Complete the fee payment to confirm your admission.
        </p>

        <div className="cg-workflow-stage__card">
          <div className="cg-workflow-stage__card-label">
            Registration Fee
          </div>
          <div className="cg-workflow-stage__card-value cg-mt-6">
            ₹{config.registration_fee || 0}
          </div>
          <button
            className="cg-btn cg-btn--primary cg-w-full cg-flex-center"
            onClick={handlePay}
            disabled={payLoading}
          >
            {payLoading ? <Loader2 size={16} className="cg-spin" /> : <CreditCard size={16} />}
            {payLoading ? "Processing..." : "Pay Now"}
          </button>
        </div>

        {app.fee_payment_deadline && (
          <div className="cg-workflow-stage__deadline">
            <AlertTriangle size={14} />
            Deadline: {new Date(app.fee_payment_deadline).toLocaleString("en-IN")}
          </div>
        )}

        {/* Offline payment note */}
        <div className="cg-workflow-stage__note cg-workflow-stage__note--left">
          💰 <strong>Note:</strong> Fee payment may also be completed at the institution counter. Contact the admission office for offline payment options.
        </div>
      </div>
    );
  }

  // ── STAGE: SHORTLISTED ──
  if (app.status === "shortlisted") {
    return (
      <div className="cg-workflow-stage">
        <CgStatusTracker app={app} structureType={engineConfig.structure_type} />
        <CgAlert variant="success" title="Shortlisted!">
          Congratulations! You have been shortlisted based on merit. Please wait for seat allotment or visit the institution.
        </CgAlert>

        {/* Merit info */}
        {app.merit_score > 0 && (
          <div className="cg-workflow-stage__merit-grid">
            <div className="cg-workflow-stage__merit-card">
              <div className="cg-status-tracker__label">Merit Score</div>
              <div className="cg-workflow-stage__card-value cg-text-xl">{app.merit_score.toFixed(2)}%</div>
            </div>
            {app.general_rank && (
              <div className="cg-workflow-stage__merit-card">
                <div className="cg-status-tracker__label">General Rank</div>
                <div className="cg-workflow-stage__card-value cg-text-xl">#{app.general_rank}</div>
              </div>
            )}
            {app.category && (
              <div className="cg-workflow-stage__merit-card">
                <div className="cg-status-tracker__label">Category</div>
                <div className="cg-workflow-stage__card-value cg-text-lg">{app.category}</div>
              </div>
            )}
            {app.category_rank && (
              <div className="cg-workflow-stage__merit-card">
                <div className="cg-status-tracker__label">Category Rank</div>
                <div className="cg-workflow-stage__card-value cg-text-xl">#{app.category_rank}</div>
              </div>
            )}
          </div>
        )}

        {/* Print Application */}
        <div className="cg-workflow-stage__action-bar cg-workflow-stage__action-bar--start">
          <button className="cg-btn cg-btn--outline" onClick={handlePrintApplication} disabled={printLoading}>
            {printLoading ? <Loader2 size={14} className="cg-spin" /> : <Printer size={14} />}
            Print Application
          </button>
        </div>
      </div>
    );
  }

  // ── STAGE: SELECTED ──
  if (app.status === "selected") {
    return (
      <div className="cg-workflow-stage">
        <CgStatusTracker app={app} structureType={engineConfig.structure_type} />
        <CgAlert variant="success" title="🎉 Seat Offered!">
          You have been selected for admission. Please visit the institution to complete the admission process.
        </CgAlert>

        {/* Offline steps reminder */}
        <div className="cg-workflow-stage__note cg-workflow-stage__note--card">
          <h4 className="cg-workflow-stage__note-heading">Next Steps (At Institution)</h4>
          <ol className="cg-workflow-stage__steps-list">
            <li>Print your application and bring it to the college</li>
            <li>Bring original documents for physical verification</li>
            <li>Sign the printed application form</li>
            <li>Pay admission fees at the counter</li>
            <li>Collect your admission confirmation</li>
          </ol>
        </div>

        {/* Print buttons */}
        <div className="cg-workflow-stage__action-bar">
          <button className="cg-btn cg-btn--primary" onClick={handlePrintApplication} disabled={printLoading}>
            {printLoading ? <Loader2 size={14} className="cg-spin" /> : <Printer size={14} />}
            Print Application
          </button>
          <button className="cg-btn cg-btn--outline" onClick={handlePrintConfirmation} disabled={printLoading}>
            {printLoading ? <Loader2 size={14} className="cg-spin" /> : <Download size={14} />}
            Download Confirmation Letter
          </button>
        </div>

        {app.fee_payment_deadline && (
          <div className="cg-workflow-stage__deadline cg-mt-4 cg-workflow-stage__deadline--start">
            <AlertTriangle size={14} />
            Accept by: {new Date(app.fee_payment_deadline).toLocaleString("en-IN")}
          </div>
        )}
      </div>
    );
  }

  // ── STAGE: ENROLLED ──
  if (app.status === "enrolled") {
    return (
      <div className="cg-workflow-stage cg-workflow-stage--centered">
        <CgStatusTracker app={app} structureType={engineConfig.structure_type} />
        
        <CheckCircle2 size={48} className="cg-workflow-stage__icon--large cg-color-success" />
        <h2 className="cg-workflow-stage__title">Admission Confirmed!</h2>
        <p className="cg-workflow-stage__description cg-workflow-stage__description--spaced-bottom">
          Congratulations! You have been successfully enrolled.
        </p>

        {app.prn && (
          <div className="cg-workflow-stage__card">
            <div className="cg-workflow-stage__card-label">
              Your PRN / Registration Number
            </div>
            <div className="cg-workflow-stage__card-value cg-workflow-stage__card-value--mono">
              {app.prn}
            </div>
          </div>
        )}

        <div className="cg-workflow-stage__action-bar cg-workflow-stage__action-bar--center">
          <button className="cg-btn cg-btn--primary" onClick={handlePrintConfirmation} disabled={printLoading}>
            {printLoading ? <Loader2 size={14} className="cg-spin" /> : <Download size={14} />}
            Print Admission Letter
          </button>
          <button className="cg-btn cg-btn--outline" onClick={handlePrintApplication} disabled={printLoading}>
            {printLoading ? <Loader2 size={14} className="cg-spin" /> : <Printer size={14} />}
            Print Application Form
          </button>
        </div>
      </div>
    );
  }

  // ── FALLBACK: Unknown Status ──
  return (
    <div className="cg-workflow-stage cg-workflow-stage--centered cg-workflow-stage--padded">
      <CgStatusTracker app={app} structureType={engineConfig.structure_type} />
      <CgAlert variant="info" title={`Status: ${app.status?.replace(/_/g, " ")}`}>
        Your application is currently in the <strong>{app.status}</strong> stage. Please check back later or contact the admission office.
      </CgAlert>
    </div>
  );
}
