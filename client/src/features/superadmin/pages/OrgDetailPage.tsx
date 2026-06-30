import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft, Building2, Users, GraduationCap, BookOpen, Mail,
  HardDrive, CreditCard, RefreshCw, Save, CheckCircle2, Clock,
  CalendarDays, ShieldCheck, Edit3, LogIn, Power, AlertTriangle,
} from "lucide-react";

import { Badge } from "@/components/marketing_ui/badge";
import { Button } from "@/components/marketing_ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/marketing_ui/dialog";
import { apiClient } from "@/lib/apiClient";

import { useOrgDetail, useSaveBillingRates, useCreateRazorpayOrder, useVerifyRazorpayPayment } from "../queries/useOrgDetail";
import type { OrgBillingRates } from "../services/superAdminApi";
import { RefreshButton } from "@/components/marketing_ui/refresh-button";


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
    <div className="py-2 border-b border-border flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      {editing ? (
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-muted-foreground">₹</span>
          <input
            type="number"
            min={0}
            step="any"
            value={value}
            onChange={(e) => onChange(field, parseFloat(e.target.value) || 0)}
            className="w-24 bg-background border border-border rounded-md px-2 py-1 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          {suffix && (
            <span className="text-xs text-muted-foreground">{suffix}</span>
          )}
        </div>
      ) : (
        <span className="text-sm font-semibold text-foreground">
          {value > 0 ? `${INR(value)}${suffix ? " " + suffix : ""}` : (
            <span className="text-xs font-normal text-muted-foreground">Not set</span>
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
      <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12">
        
        <div className="flex items-center gap-3 p-12 text-muted-foreground justify-center">
          <RefreshCw size={18} className="animate-spin" />
          <span>Loading organization details…</span>
        </div>
      </div>
    );
  }

  if (isError || !org) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12">
        <div className="bg-red-100 text-red-800 p-6 rounded-xl border border-red-200 max-w-lg">
          <h3 className="font-bold text-lg mb-2">Could not load organization</h3>
          <p className="mb-4">The backend returned an error or the org does not exist.</p>
          <div className="flex gap-2">
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
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{org.name}</h1>
          <p className="text-muted-foreground mt-1">{`${orgTypeLabel} · ${org.city ?? ""}${org.city && org.state ? ", " : ""}${org.state ?? ""}`}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {org.status === "suspended" ? (
            <Button variant="default" onClick={() => activateMut.mutate()} disabled={activateMut.isPending}>
              <Power size={14} className="mr-2" /> Activate Org
            </Button>
          ) : (
            <Button variant="destructive" onClick={() => setSuspendConfirm(true)}>
              <AlertTriangle size={14} className="mr-2" /> Suspend Org
            </Button>
          )}
          {org.owner_id && (
            <Button variant="outline" onClick={() => impersonateMut.mutate()} disabled={impersonateMut.isPending}>
              <LogIn size={14} className="mr-2" /> Impersonate Admin
            </Button>
          )}
          <RefreshButton onClick={() => refetch()} isFetching={isFetching} />
          
        </div>
      </div>

      {/* ── Overview strip ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          {
            icon: <ShieldCheck size={14} />,
            label: "Status",
            value: (
              <Badge variant={statusVariant(org.status) as any}>
                {org.status ?? "unknown"}
              </Badge>
            ),
          },
          {
            icon: <CreditCard size={14} />,
            label: "Plan",
            value: (
              <Badge variant={planVariant(sub?.plan) as any}>
                {sub?.plan ?? "demo"}
              </Badge>
            ),
          },
          {
            icon: <Users size={14} />,
            label: "Owner",
            value: (
              <span className="text-sm font-medium">
                {org.owner?.name ?? "—"}
                {org.owner?.email && (
                  <span className="block text-xs text-muted-foreground font-normal">
                    {org.owner.email}
                  </span>
                )}
              </span>
            ),
          },
          {
            icon: <CalendarDays size={14} />,
            label: "Joined",
            value: <span className="text-sm">{fmtDate(org.createdAt)}</span>,
          },
          {
            icon: <Clock size={14} />,
            label: "Renews / Expires",
            value: <span className="text-sm">{fmtDate(sub?.expiresAt)}</span>,
          },
        ].map(({ icon, label, value }) => (
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm flex flex-col gap-1" key={label}>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              {icon} {label}
            </span>
            <div>{value}</div>
          </div>
        ))}
      </div>

      {/* ── Usage Metrics ───────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl shadow-sm mt-6">
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-bold">Usage Metrics</h2>
          <p className="text-sm text-muted-foreground mt-1">Live counts pulled from the database and refreshed on every page load.</p>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="border border-border p-4 rounded-lg bg-background flex flex-col gap-1">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5"><GraduationCap size={14}/> Students</span>
              <span className="text-2xl font-bold">{usage?.totalStudents ?? 0}</span>
            </div>
            <div className="border border-border p-4 rounded-lg bg-background flex flex-col gap-1">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5"><Users size={14}/> Teachers</span>
              <span className="text-2xl font-bold">{usage?.totalTeachers ?? 0}</span>
            </div>
            <div className="border border-border p-4 rounded-lg bg-background flex flex-col gap-1">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5"><ShieldCheck size={14}/> Admins</span>
              <span className="text-2xl font-bold">{usage?.totalAdmins ?? 0}</span>
            </div>
            <div className="border border-border p-4 rounded-lg bg-background flex flex-col gap-1">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5"><BookOpen size={14}/> Classes</span>
              <span className="text-2xl font-bold">{usage?.totalClasses ?? 0}</span>
            </div>
            <div className="border border-border p-4 rounded-lg bg-background flex flex-col gap-1">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5"><Mail size={14}/> Emails Sent</span>
              <span className="text-2xl font-bold">{usage?.emailsSent ?? 0}</span>
            </div>
          </div>

          {/* Storage bar */}
          <div className="bg-muted/40 p-4 rounded-lg border border-border">
            <div className="flex justify-between items-center mb-2">
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <HardDrive size={14} /> Storage Usage
              </span>
              <span className="text-xs text-muted-foreground">
                {storageUsed.toFixed(2)} GB / {storageLimit} GB
                {storageUsed === 0 && (
                  <span className="ml-2 text-[10px] text-muted-foreground">
                    (tracking in progress)
                  </span>
                )}
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${storagePct >= 90 ? 'bg-red-500' : storagePct >= 70 ? 'bg-amber-500' : 'bg-primary'}`} 
                style={{ width: `${storagePct}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Billing Config + Estimate ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Rate Config Panel */}
        <div className="bg-card border border-border rounded-xl shadow-sm">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Billing Rate Config</h2>
              <p className="text-sm text-muted-foreground mt-1">Set custom pricing rates for this organization.</p>
            </div>
            <div>
              {editingRates ? (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={cancelEdit} disabled={saveMutation.isPending}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={saveRates} disabled={saveMutation.isPending}>
                    <Save size={13} className="mr-2" />
                    {saveMutation.isPending ? "Saving…" : "Save Rates"}
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={startEdit}>
                  <Edit3 size={13} className="mr-2" /> Edit Rates
                </Button>
              )}
            </div>
          </div>
          <div className="p-5">
            {saveMutation.isSuccess && !editingRates && (
              <div className="flex items-center gap-1.5 text-emerald-600 text-sm mb-4">
                <CheckCircle2 size={13} /> Billing rates saved successfully
              </div>
            )}

            <div className="flex flex-col">
              <RateRow label="Base Price / Month" field="basePricePerMonth" value={displayRates.basePricePerMonth} suffix="" editing={editingRates} onChange={onRateChange} />
              <RateRow label="Price per Student / Month" field="pricePerStudent" value={displayRates.pricePerStudent} suffix="/ student" editing={editingRates} onChange={onRateChange} />
              <RateRow label="Price per GB Storage / Month" field="pricePerGB" value={displayRates.pricePerGB} suffix="/ GB" editing={editingRates} onChange={onRateChange} />
              <RateRow label="Free Storage Included" field="freeStorageGB" value={displayRates.freeStorageGB} suffix="GB free" editing={editingRates} onChange={onRateChange} />
            </div>

            {!hasRates && !editingRates && (
              <p className="mt-4 text-sm text-muted-foreground">
                No billing rates set yet. Click <strong>Edit Rates</strong> to configure pricing for this org.
              </p>
            )}
          </div>
        </div>

        {/* Billing Estimate Panel */}
        <div className="bg-card border border-border rounded-xl shadow-sm">
          <div className="p-5 border-b border-border">
            <h2 className="text-lg font-bold">Monthly Bill Estimate</h2>
            <p className="text-sm text-muted-foreground mt-1">Calculated from current usage × your configured rates.</p>
          </div>
          <div className="p-5">
            {!hasRates ? (
              <p className="text-sm text-muted-foreground">
                Set billing rates on the left to see a live estimate.
              </p>
            ) : (
              <>
                <div className="flex flex-col gap-2">
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
                    <div key={label} className="flex justify-between text-sm py-2 border-b border-dashed border-border last:border-0">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">{INR(value)}</span>
                    </div>
                  ))}
                </div>

                {/* Total callout */}
                <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg flex justify-between items-center">
                  <span className="text-sm font-semibold">Estimated Total / Month</span>
                  <span className="text-xl font-bold text-primary">
                    {INR(bill.total)}
                  </span>
                </div>

                <p className="mt-3 text-xs text-muted-foreground mb-4">
                  Formula: Base + (Students × Rate) + (max(0, StorageGB − FreeGB) × GB Rate)
                </p>

                <Button 
                  onClick={handleRazorpayCheckout} 
                  disabled={createOrderMut.isPending || verifyPaymentMut.isPending}
                  className="w-full"
                >
                  <CreditCard size={15} className="mr-2" /> Pay Subscription (Razorpay)
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Subscription Details + Quick Actions ────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-card border border-border rounded-xl shadow-sm">
          <div className="p-5 border-b border-border">
            <h2 className="text-lg font-bold">Subscription Details</h2>
            <p className="text-sm text-muted-foreground mt-1">Current plan, limits, and feature access.</p>
          </div>
          <div className="p-5">
            <div className="flex flex-col gap-3">
              {[
                { label: "Plan", value: <Badge variant={planVariant(sub?.plan) as any}>{sub?.plan ?? "demo"}</Badge> },
                { label: "Billing Status", value: <Badge variant={sub?.isPaid ? "success" : ("warning" as any)}>{sub?.isPaid ? "Paid" : "Unpaid"}</Badge> },
                { label: "Max Students", value: sub?.metadata?.max_students ?? "—" },
                { label: "Max Faculty",  value: sub?.metadata?.max_faculty  ?? "—" },
                { label: "Storage Limit", value: `${sub?.metadata?.storage_limit_gb ?? 2} GB` },
                { label: "Expires / Renewal", value: fmtDate(sub?.expiresAt) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center text-sm py-1.5 border-b border-border/50 last:border-0">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm">
          <div className="p-5 border-b border-border">
            <h2 className="text-lg font-bold">Quick Actions</h2>
          </div>
          <div className="p-5">
            <div className="flex flex-col gap-2">
              <Button variant="outline" className="justify-start" asChild>
                <Link to={`/superadmin/billing`}>
                  <CreditCard size={14} className="mr-2" /> Manage Plan &amp; Subscription
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link to={`/superadmin/users?org=${id}`}>
                  <Users size={14} className="mr-2" /> View Users in This Org
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link to="/superadmin/alerts">
                  <Mail size={14} className="mr-2" /> View Email &amp; Error Logs
                </Link>
              </Button>
              
            </div>
          </div>
        </div>
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
