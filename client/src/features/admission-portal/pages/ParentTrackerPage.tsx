import { useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, Phone, ArrowRight, CheckCircle2, Clock, FileText, CreditCard, Download } from "lucide-react";
import { parentLogin, getParentStatus, getParentDocuments } from "../api";
import { useEngineConfig } from "../queries/useAdmissionEngine";

import type { ApplicationState } from "../types";

// ═══════════════════════════════════════════════════════════════
// ParentTrackerPage — Public parent portal for tracking child's
// admission status. Authenticates via phone OTP.
//
// Pipeline: Applied → Verified → Selected → Fee → Enrolled
// Shows: stage progress, document checklist, fee payment link
// ═══════════════════════════════════════════════════════════════

const PIPELINE_STAGES = [
  { key: "applied", label: "Applied", icon: FileText },
  { key: "under_verification", label: "Verified", icon: CheckCircle2 },
  { key: "fee_pending", label: "Selected", icon: CreditCard },
  { key: "enrolled", label: "Enrolled", icon: CheckCircle2 },
];

function getStageIndex(status: string): number {
  if (status === "enrolled") return 3;
  if (status === "fee_pending" || status === "allotted" || status === "confirmed") return 2;
  if (status === "under_verification" || status === "verified") return 1;
  if (status === "waitlisted") return 1; // Shown between verified and selected
  return 0;
}

export function ParentTrackerPage() {
  const { orgId } = useParams();
  const { data: engineConfig, isLoading: configLoading } = useEngineConfig(orgId);

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [appData, setAppData] = useState<ApplicationState | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await parentLogin(phone, orgId!);
      if (result.application_id) {
        // Store parent token
        if (result.token) localStorage.setItem("parent_token", result.token);

        // Fetch status and documents
        const [statusRes, docsRes] = await Promise.all([
          getParentStatus(result.application_id),
          getParentDocuments(result.application_id),
        ]);
        setAppData(statusRes.application || statusRes);
        setDocuments(docsRes.documents || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Phone number not found. Please check and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (configLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <Loader2 size={32} className="animate-spin" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "hsl(var(--background))", padding: "2rem" }}>
      <div style={{ maxWidth: "700px", margin: "0 auto" }}>

        <header style={{ marginBottom: "2rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
            {engineConfig?.organization || "Parent Portal"}
          </h1>
          <p style={{ color: "hsl(var(--muted-foreground))" }}>Track your child's admission status</p>
        </header>

        {/* ── Login Form ── */}
        {!appData && (
          <div style={{ background: "hsl(var(--card))", padding: "2rem", borderRadius: "var(--radius)", border: "1px solid hsl(var(--border))", maxWidth: "400px", margin: "0 auto" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1.5rem" }}>Verify Your Phone Number</h2>
            
            {error && <div style={{ marginBottom: "1rem" }}><div variant="danger" title="Error">{error}</div></div>}
            
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="">
                <label className="">Registered Mobile Number</label>
                <div style={{ position: "relative" }}>
                  <Phone size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "hsl(var(--muted-foreground))" }} />
                  <input type="tel" required className="" style={{ paddingLeft: "2.5rem" }}
                    placeholder="+91 9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={loading}
                  />
                </div>
              </div>
              <button type="submit" className="inline-flex items-center justify-center rounded-md text-sm font-medium border h-9 px-4 py-2 bg-primary text-primary-foreground shadow" disabled={loading}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : "View Status"} <ArrowRight size={16} />
              </button>
            </form>
          </div>
        )}

        {/* ── Status Dashboard ── */}
        {appData && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

            {/* Student Info */}
            <div style={{ background: "hsl(var(--card))", padding: "1.5rem", borderRadius: "var(--radius)", border: "1px solid hsl(var(--border))" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "1.1rem" }}>{appData.full_name}</div>
                  <div style={{ fontSize: "0.85rem", color: "hsl(var(--muted-foreground))" }}>
                    {appData.en_number || appData.phone || appData.email}
                  </div>
                </div>
                <div variant={appData.status === "enrolled" ? "success" : appData.status === "rejected" ? "danger" : "info"}>
                  {appData.status.replace(/_/g, " ")}
                </div>
              </div>
            </div>

            {/* Waitlist Alert */}
            {appData.status === "waitlisted" && (
              <div variant="warning" title={`Waitlisted — Position WL-${appData.waitlist_number ?? "?"}`}>
                Your child is currently on the waitlist. You will be notified when a seat becomes available.
              </div>
            )}

            {/* Fee Pending Alert */}
            {appData.status === "fee_pending" && (
              <div variant="warning" title="Action Required: Fee Payment">
                Your child has been selected! Please complete the fee payment to confirm admission.
                {appData.fee_payment_deadline && (
                  <div style={{ marginTop: "0.5rem", fontWeight: 600 }}>
                    Deadline: {new Date(appData.fee_payment_deadline).toLocaleString("en-IN")}
                  </div>
                )}
              </div>
            )}

            {/* Visual Pipeline */}
            <div style={{ background: "hsl(var(--card))", padding: "1.5rem", borderRadius: "var(--radius)", border: "1px solid hsl(var(--border))" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "1rem" }}>Application Progress</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
                {PIPELINE_STAGES.map((stage, idx) => {
                  const currentIdx = getStageIndex(appData.status);
                  const isComplete = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;
                  const Icon = stage.icon;

                  return (
                    <div key={stage.key} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "0 0 auto" }}>
                        <div style={{
                          width: "36px", height: "36px", borderRadius: "50%",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: isComplete ? "hsl(var(--primary))" : "hsl(var(--muted))",
                          color: isComplete ? "white" : "hsl(var(--muted-foreground))",
                          border: isCurrent ? "2px solid hsl(var(--primary))" : "2px solid transparent",
                          transition: "all 0.3s ease",
                        }}>
                          <Icon size={16} />
                        </div>
                        <span style={{
                          fontSize: "0.7rem", fontWeight: isCurrent ? 600 : 400, marginTop: "0.25rem",
                          color: isComplete ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                          whiteSpace: "nowrap",
                        }}>
                          {stage.label}
                        </span>
                      </div>
                      {idx < PIPELINE_STAGES.length - 1 && (
                        <div style={{
                          flex: 1, height: "2px", margin: "0 0.25rem",
                          background: idx < currentIdx ? "hsl(var(--primary))" : "hsl(var(--border))",
                          alignSelf: "flex-start", marginTop: "17px",
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Document Checklist */}
            {documents.length > 0 && (
              <div style={{ background: "hsl(var(--card))", padding: "1.5rem", borderRadius: "var(--radius)", border: "1px solid hsl(var(--border))" }}>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "1rem" }}>Document Status</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {documents.map((doc: any, i: number) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", borderRadius: "var(--radius)", border: "1px solid hsl(var(--border))" }}>
                      <span style={{ fontSize: "0.85rem", textTransform: "capitalize" }}>
                        {(doc.name || "").replace(/_/g, " ")}
                      </span>
                      <div variant={doc.status === "verified" ? "success" : doc.status === "rejected" ? "danger" : "warning"} size="sm">
                        {doc.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Downloads */}
            {appData.status === "enrolled" && (
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <button className="inline-flex items-center justify-center rounded-md text-sm font-medium border h-9 px-4 py-2 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground" onClick={() => window.print()}>
                  <Download size={16} /> Admission Letter
                </button>
                {appData.fee_paid && (
                  <button className="inline-flex items-center justify-center rounded-md text-sm font-medium border h-9 px-4 py-2 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground" onClick={() => window.print()}>
                    <Download size={16} /> Fee Receipt
                  </button>
                )}
              </div>
            )}

            {/* Sign Out */}
            <button className="inline-flex items-center justify-center rounded-md text-sm font-medium border h-9 px-4 py-2 inline-flex items-center justify-center rounded-md text-sm font-medium border h-9 px-4 py-2--ghost inline-flex items-center justify-center rounded-md text-sm font-medium border h-9 px-4 py-2--sm" style={{ alignSelf: "center" }} onClick={() => { setAppData(null); setDocuments([]); }}>
              Check another application
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
