import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft, Building2, Users, GraduationCap, BookOpen, Mail,
  HardDrive, CreditCard, RefreshCw, Save, CheckCircle2, Clock,
  CalendarDays, ShieldCheck, Edit3, LogIn, Power, AlertTriangle,
} from "lucide-react";

import { CgPageHeader }   from "@/components/classgrid/PageHeader";
import { CgSectionPanel } from "@/components/classgrid/SectionPanel";
import { CgMetricCard }   from "@/components/classgrid/MetricCard";
import { CgBadge }        from "@/components/classgrid/Badge";
import { CgButton }       from "@/components/classgrid/Button";
import { CgProgress }     from "@/components/classgrid/Progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { apiClient } from "@/lib/apiClient";

import { useOrgDetail, useSaveBillingRates, useCreateRazorpayOrder, useVerifyRazorpayPayment } from "../queries/useOrgDetail";
import type { OrgBillingRates } from "../services/superAdminApi";

// ── helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const statusVariant = (s?: string) => {
  if (s === "active") return "success";
  if (s === "suspended" || s === "blocked") return "danger";
  return "warning";
};

const planVariant = (p?: string) =>
  p === "active" ? "success" : "warning";

/** Compute monthly bill estimate from usage + billing rates */
function calcMonthlyBill(
  students: number,
  storageGB: number,
  rates: OrgBillingRates
): { base: number; students: number; storage: number; total: number } {
  const base     = rates.basePricePerMonth;
  const stuCost  = students * rates.pricePerStudent;
  const freeGB   = rates.freeStorageGB ?? 0;
  const billableGB = Math.max(0, storageGB - freeGB);
  const storageCost = billableGB * rates.pricePerGB;
  return {
    base,
    students: stuCost,
    storage: storageCost,
    total: base + stuCost + storageCost,
  };
}

const INR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

// ── Billing rate input row ────────────────────────────────────────────────────

function RateRow({
  label,
  value,
  field,
  suffix,
  editing,
  onChange,
}: {
  label: string;
  value: number;
  field: keyof OrgBillingRates;
  suffix?: string;
  editing: boolean;
  onChange: (f: keyof OrgBillingRates, v: number) => void;
}) {
  return (
    <div className="cg-panel__toolbar" style={{ padding: "0.6rem 0", borderBottom: "1px solid hsl(var(--border))" }}>
      <span style={{ fontSize: "0.84rem", color: "hsl(var(--muted-foreground))" }}>{label}</span>
      {editing ? (
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ fontSize: "0.84rem", color: "hsl(var(--muted-foreground))" }}>₹</span>
          <input
            type="number"
            min={0}
            step="any"
            value={value}
            onChange={(e) => onChange(field, parseFloat(e.target.value) || 0)}
            style={{
              width: "6rem",
              background: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
              padding: "0.3rem 0.5rem",
              fontSize: "0.84rem",
              color: "hsl(var(--foreground))",
              outline: "none",
            }}
          />
          {suffix && (
            <span style={{ fontSize: "0.78rem", color: "hsl(var(--muted-foreground))" }}>{suffix}</span>
          )}
        </div>
      ) : (
        <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "hsl(var(--foreground))" }}>
          {value > 0 ? `${INR(value)}${suffix ? " " + suffix : ""}` : (
            <span style={{ color: "hsl(var(--muted-foreground))", fontWeight: 400, fontSize: "0.82rem" }}>Not set</span>
          )}
        </span>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function OrgDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch, isFetching } = useOrgDetail(id);
  const saveMutation = useSaveBillingRates(id!);
  const createOrderMut = useCreateRazorpayOrder(id!);
  const verifyPaymentMut = useVerifyRazorpayPayment(id!);

  const org = data?.data;
  const usage = org?.usage;
  const sub   = org?.subscription;

  // Load Razorpay Script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  // Billing rate local edit state
  const [editingRates, setEditingRates] = useState(false);
  const [suspendConfirm, setSuspendConfirm] = useState(false);

  const suspendMut = useMutation({
    mutationFn: () => apiClient.patch(`/api/super-admin/organizations/${id}/suspend`, { reason: "Suspended via SuperAdmin dashboard" }),
    onSuccess: () => { toast.success("Organization suspended."); refetch(); setSuspendConfirm(false); },
    onError: () => toast.error("Failed to suspend org."),
  });
  const activateMut = useMutation({
    mutationFn: () => apiClient.patch(`/api/super-admin/organizations/${id}/activate`),
    onSuccess: () => { toast.success("Organization activated."); refetch(); },
    onError: () => toast.error("Failed to activate org."),
  });
  const impersonateMut = useMutation({
    mutationFn: () => apiClient.post(`/api/super-admin/impersonate/${org?.owner_id}`).then(r => r.data),
    onSuccess: (data: any) => {
      if (data?.token) {
        toast.success(`Now impersonating ${org?.ownerName || "Org Admin"}. You will be redirected.`);
        localStorage.setItem("classgrid:impersonation-token", data.token);
        window.location.href = "/org/dashboard";
      }
    },
    onError: () => toast.error("Impersonation failed. Ensure the org has an owner."),
  });

  const [rates, setRates] = useState<OrgBillingRates>({
    basePricePerMonth: 0,
    pricePerStudent: 0,
    pricePerGB: 0,
    freeStorageGB: 0,
  });

  // Sync rates from API when data arrives (only if not currently editing)
  const serverRates: OrgBillingRates = {
    basePricePerMonth: sub?.billing?.basePricePerMonth ?? 0,
    pricePerStudent:   sub?.billing?.pricePerStudent   ?? 0,
    pricePerGB:        sub?.billing?.pricePerGB        ?? 0,
    freeStorageGB:     sub?.billing?.freeStorageGB     ?? 0,
  };
  const displayRates = editingRates ? rates : serverRates;

  const bill = calcMonthlyBill(
    usage?.totalStudents ?? 0,
    usage?.storageUsedGB ?? 0,
    displayRates
  );
  const hasRates = serverRates.basePricePerMonth > 0 || serverRates.pricePerStudent > 0 || serverRates.pricePerGB > 0;

  const storageLimit = sub?.metadata?.storage_limit_gb ?? 10;
  const storageUsed  = usage?.storageUsedGB ?? 0;
  const storagePct   = Math.min(100, (storageUsed / storageLimit) * 100);

  function startEdit() {
    setRates({ ...serverRates });
    setEditingRates(true);
  }

  function cancelEdit() {
    setEditingRates(false);
  }

  function saveRates() {
    saveMutation.mutate(
      { ...rates, plan: sub?.plan ?? "demo" },
      {
        onSuccess: () => setEditingRates(false),
      }
    );
  }

  function onRateChange(field: keyof OrgBillingRates, value: number) {
    setRates((prev) => ({ ...prev, [field]: value }));
  }

  async function handleRazorpayCheckout() {
    if (bill.total <= 0) {
      toast.error("Bill amount is 0. Nothing to pay.");
      return;
    }

    try {
      const order = await createOrderMut.mutateAsync(bill.total);

      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "Classgrid Platform",
        description: `Platform Subscription for ${org?.name}`,
        order_id: order.order_id,
        handler: async function (response: any) {
          try {
            await verifyPaymentMut.mutateAsync(response);
            toast.success("Payment successful! Subscription activated.");
          } catch (err: any) {
            toast.error("Payment verification failed.");
          }
        },
        theme: { color: "hsl(var(--primary))" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function () {
        toast.error("Payment failed or cancelled.");
      });
      rzp.open();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to initiate payment. Please check API keys.");
    }
  }

  // ── loading / error ──────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="cg-page">
        <div className="cg-page__header cg-page__header--split">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft size={14} /> Back
          </Button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "3rem", color: "hsl(var(--muted-foreground))" }}>
          <RefreshCw size={18} className="cg-spin" />
          <span>Loading organization details…</span>
        </div>
      </div>
    );
  }

  if (isError || !org) {
    return (
      <div className="cg-page">
        <div className="cg-alert cg-alert--danger" style={{ maxWidth: "540px" }}>
          <div className="cg-alert__body">
            <span className="cg-alert__title">Could not load organization</span>
            <p className="cg-alert__message">The backend returned an error or the org does not exist.</p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button variant="outline" onClick={() => refetch()}>Retry</Button>
            <Button variant="ghost" asChild><Link to="/superadmin/orgs">← All Orgs</Link></Button>
          </div>
        </div>
      </div>
    );
  }

  const orgTypeLabel = (org.org_type ?? org.structure_type ?? "organization")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c: string) => c.toUpperCase());

  return (
    <div className="cg-page cg-animate-in">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <CgPageHeader
        title={org.name}
        description={`${orgTypeLabel} · ${org.city ?? ""}${org.city && org.state ? ", " : ""}${org.state ?? ""}`}
        actions={
          <>
            {org.status === "suspended" ? (
              <Button variant="default" onClick={() => activateMut.mutate()} isLoading={activateMut.isPending}>
                <Power size={14} /> Activate Org
              </Button>
            ) : (
              <Button variant="destructive" onClick={() => setSuspendConfirm(true)}>
                <AlertTriangle size={14} /> Suspend Org
              </Button>
            )}
            {org.owner_id && (
              <Button variant="outline" onClick={() => impersonateMut.mutate()} isLoading={impersonateMut.isPending}>
                <LogIn size={14} /> Impersonate Admin
              </Button>
            )}
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw size={14} className={isFetching ? "cg-spin" : ""} /> Refresh
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/superadmin/orgs"><ArrowLeft size={14} /> All Orgs</Link>
            </Button>
          </>
        }
      />

      {/* ── Overview strip ──────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "0.75rem",
        }}
        className="cg-stagger"
      >
        {[
          {
            icon: <ShieldCheck size={14} />,
            label: "Status",
            value: (
              <Badge variant={statusVariant(org.status)} dot>
                {org.status ?? "unknown"}
              </Badge>
            ),
          },
          {
            icon: <CreditCard size={14} />,
            label: "Plan",
            value: (
              <Badge variant={planVariant(sub?.plan)}>
                {sub?.plan ?? "demo"}
              </Badge>
            ),
          },
          {
            icon: <Users size={14} />,
            label: "Owner",
            value: (
              <span style={{ fontSize: "0.84rem", fontWeight: 500 }}>
                {org.owner?.name ?? "—"}
                {org.owner?.email && (
                  <span style={{ display: "block", fontSize: "0.74rem", color: "hsl(var(--muted-foreground))", fontWeight: 400 }}>
                    {org.owner.email}
                  </span>
                )}
              </span>
            ),
          },
          {
            icon: <CalendarDays size={14} />,
            label: "Joined",
            value: <span style={{ fontSize: "0.84rem" }}>{fmtDate(org.createdAt)}</span>,
          },
          {
            icon: <Clock size={14} />,
            label: "Renews / Expires",
            value: <span style={{ fontSize: "0.84rem" }}>{fmtDate(sub?.expiresAt)}</span>,
          },
        ].map(({ icon, label, value }) => (
          <div className="cg-page__meta" key={label}>
            <span className="cg-page__meta-label" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              {icon} {label}
            </span>
            <strong style={{ fontWeight: "normal" }}>{value}</strong>
          </div>
        ))}
      </div>

      {/* ── Usage Metrics ───────────────────────────────────────────────── */}
      <CgSectionPanel
        title="Usage Metrics"
        description="Live counts pulled from the database and refreshed on every page load."
      >
        <div className="cg-stats-grid">
          <CgMetricCard
            title="Total Students"
            value={usage?.totalStudents ?? 0}
            icon={<GraduationCap size={15} />}
          />
          <CgMetricCard
            title="Teachers"
            value={usage?.totalTeachers ?? 0}
            icon={<Users size={15} />}
          />
          <CgMetricCard
            title="Admins"
            value={usage?.totalAdmins ?? 0}
            icon={<ShieldCheck size={15} />}
          />
          <CgMetricCard
            title="Total Classes"
            value={usage?.totalClasses ?? 0}
            icon={<BookOpen size={15} />}
          />
          <CgMetricCard
            title="Emails Sent"
            value={usage?.emailsSent ?? 0}
            icon={<Mail size={15} />}
          />
        </div>

        {/* Storage bar */}
        <div
          style={{
            marginTop: "1.25rem",
            padding: "1rem 1.1rem",
            background: "hsl(var(--muted) / 0.4)",
            borderRadius: "var(--radius)",
            border: "1px solid hsl(var(--border))",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.84rem", fontWeight: 500 }}>
              <HardDrive size={14} /> Storage Usage
            </span>
            <span style={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))" }}>
              {storageUsed.toFixed(2)} GB / {storageLimit} GB
              {storageUsed === 0 && (
                <span style={{ marginLeft: "0.5rem", fontSize: "0.74rem", color: "hsl(var(--muted-foreground))" }}>
                  (tracking in progress)
                </span>
              )}
            </span>
          </div>
          <CgProgress
            value={storagePct}
            variant={storagePct >= 90 ? "danger" : storagePct >= 70 ? "warning" : "primary"}
            size="md"
            label={`${storagePct.toFixed(0)}%`}
          />
        </div>
      </CgSectionPanel>

      {/* ── Billing Config + Estimate ────────────────────────────────────── */}
      <div className="cg-two-col">
        {/* Rate Config Panel */}
        <CgSectionPanel
          title="Billing Rate Config"
          description="Set custom pricing rates for this organization. Leave at 0 if not yet configured."
          actions={
            editingRates ? (
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Button variant="ghost" size="sm" onClick={cancelEdit} disabled={saveMutation.isPending}>
                  Cancel
                </Button>
                <Button size="sm" onClick={saveRates} disabled={saveMutation.isPending}>
                  <Save size={13} />
                  {saveMutation.isPending ? "Saving…" : "Save Rates"}
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={startEdit}>
                <Edit3 size={13} /> Edit Rates
              </Button>
            )
          }
        >
          {saveMutation.isSuccess && !editingRates && (
            <div style={{
              display: "flex", alignItems: "center", gap: "0.4rem",
              color: "hsl(var(--success))", fontSize: "0.82rem", marginBottom: "0.75rem"
            }}>
              <CheckCircle2 size={13} /> Billing rates saved successfully
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column" }}>
            <RateRow label="Base Price / Month" field="basePricePerMonth" value={displayRates.basePricePerMonth} suffix="" editing={editingRates} onChange={onRateChange} />
            <RateRow label="Price per Student / Month" field="pricePerStudent" value={displayRates.pricePerStudent} suffix="/ student" editing={editingRates} onChange={onRateChange} />
            <RateRow label="Price per GB Storage / Month" field="pricePerGB" value={displayRates.pricePerGB} suffix="/ GB" editing={editingRates} onChange={onRateChange} />
            <RateRow label="Free Storage Included" field="freeStorageGB" value={displayRates.freeStorageGB} suffix="GB free" editing={editingRates} onChange={onRateChange} />
          </div>

          {!hasRates && !editingRates && (
            <p style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "hsl(var(--muted-foreground))" }}>
              No billing rates set yet. Click <strong>Edit Rates</strong> to configure pricing for this org.
            </p>
          )}
        </CgSectionPanel>

        {/* Billing Estimate Panel */}
        <CgSectionPanel
          title="Monthly Bill Estimate"
          description="Calculated from current usage × your configured rates."
        >
          {!hasRates ? (
            <p style={{ fontSize: "0.84rem", color: "hsl(var(--muted-foreground))" }}>
              Set billing rates on the left to see a live estimate.
            </p>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {[
                  { label: "Base subscription", value: bill.base },
                  {
                    label: `Students (${usage?.totalStudents ?? 0} × ${INR(displayRates.pricePerStudent)})`,
                    value: bill.students,
                  },
                  {
                    label: `Storage (${Math.max(0, storageUsed - displayRates.freeStorageGB).toFixed(1)} GB billed)`,
                    value: bill.storage,
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.84rem",
                      padding: "0.45rem 0",
                      borderBottom: "1px dashed hsl(var(--border))",
                    }}
                  >
                    <span style={{ color: "hsl(var(--muted-foreground))" }}>{label}</span>
                    <span style={{ fontWeight: 500 }}>{INR(value)}</span>
                  </div>
                ))}
              </div>

              {/* Total callout */}
              <div
                style={{
                  marginTop: "1rem",
                  padding: "0.85rem 1rem",
                  background: "hsl(var(--primary) / 0.08)",
                  border: "1px solid hsl(var(--primary) / 0.25)",
                  borderRadius: "var(--radius)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "0.88rem", fontWeight: 600 }}>Estimated Total / Month</span>
                <span style={{ fontSize: "1.3rem", fontWeight: 700, color: "hsl(var(--primary))" }}>
                  {INR(bill.total)}
                </span>
              </div>

              <p style={{ marginTop: "0.6rem", fontSize: "0.74rem", color: "hsl(var(--muted-foreground))", marginBottom: "1rem" }}>
                Formula: Base + (Students × Rate) + (max(0, StorageGB − FreeGB) × GB Rate)
              </p>

              <Button 
                onClick={handleRazorpayCheckout} 
                isLoading={createOrderMut.isPending || verifyPaymentMut.isPending}
                style={{ width: "100%" }}
              >
                <CreditCard size={15} /> Pay Subscription (Razorpay)
              </Button>
            </>
          )}
        </CgSectionPanel>
      </div>

      {/* ── Subscription Details + Quick Actions ────────────────────────── */}
      <div className="cg-two-col">
        <CgSectionPanel title="Subscription Details" description="Current plan, limits, and feature access.">
          <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            {[
              { label: "Plan", value: <Badge variant={planVariant(sub?.plan)}>{sub?.plan ?? "demo"}</Badge> },
              { label: "Billing Status", value: <Badge variant={sub?.isPaid ? "success" : "warning"}>{sub?.isPaid ? "Paid" : "Unpaid"}</Badge> },
              { label: "Max Students", value: sub?.metadata?.max_students ?? "—" },
              { label: "Max Faculty",  value: sub?.metadata?.max_faculty  ?? "—" },
              { label: "Storage Limit", value: `${sub?.metadata?.storage_limit_gb ?? 2} GB` },
              { label: "Expires / Renewal", value: fmtDate(sub?.expiresAt) },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.84rem", padding: "0.35rem 0", borderBottom: "1px solid hsl(var(--border) / 0.5)" }}>
                <span style={{ color: "hsl(var(--muted-foreground))" }}>{label}</span>
                <span style={{ fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>
        </CgSectionPanel>

        <CgSectionPanel title="Quick Actions">
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <Button variant="outline" style={{ justifyContent: "flex-start" }} asChild>
              <Link to={`/superadmin/billing`}>
                <CreditCard size={14} /> Manage Plan &amp; Subscription
              </Link>
            </Button>
            <Button variant="outline" style={{ justifyContent: "flex-start" }} asChild>
              <Link to={`/superadmin/users?org=${id}`}>
                <Users size={14} /> View Users in This Org
              </Link>
            </Button>
            <Button variant="outline" style={{ justifyContent: "flex-start" }} asChild>
              <Link to="/superadmin/alerts">
                <Mail size={14} /> View Email &amp; Error Logs
              </Link>
            </Button>
            <Button variant="ghost" style={{ justifyContent: "flex-start" }} asChild>
              <Link to="/superadmin/orgs">
                <ArrowLeft size={14} /> Back to All Organizations
              </Link>
            </Button>
          </div>
        </CgSectionPanel>
      </div>

      {/* Suspend Confirmation Dialog */}
      <Dialog open={suspendConfirm} onOpenChange={setSuspendConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>⚠️ Suspend Organization</DialogTitle>
            <DialogDescription>
              This will immediately suspend <strong>{org?.name}</strong>. All users in this organization will be blocked from logging in until reactivated. This action is logged.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendConfirm(false)}>Cancel</Button>
            <Button variant="destructive" isLoading={suspendMut.isPending} onClick={() => suspendMut.mutate()}>
              <AlertTriangle size={14} /> Yes, Suspend Org
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
