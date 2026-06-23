import { useState, useMemo } from "react";
import { Building2, Mail, Phone, MapPin, Users, Plus, X, CheckCircle, AlertCircle, Loader } from "lucide-react";
import { CgSectionPanel } from "@/components/classgrid/SectionPanel";
import { CgMetricCard } from "@/components/classgrid/MetricCard";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardApi, directProvisionApi } from "../services/superAdminApi";
import type { DirectProvisionPayload } from "../services/superAdminApi";

// ── Org type options ────────────────────────────────────────────────────────

const ORG_TYPES = [
  { value: "school", label: "School" },
  { value: "junior_college", label: "Junior College" },
  { value: "engineering", label: "Engineering College" },
  { value: "coaching", label: "Coaching Institute" },
  { value: "college", label: "College" },
  { value: "diploma", label: "Diploma Institute" },
  { value: "other", label: "Other" },
];

const PLAN_OPTIONS = [
  { value: "demo", label: "Demo (30 days)" },
  { value: "active", label: "Active (Paid)" },
];

const INDIA_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Delhi","Puducherry","Ladakh","Jammu & Kashmir",
];

// ── form default ────────────────────────────────────────────────────────────

const EMPTY_FORM: DirectProvisionPayload = {
  institutionName: "",
  orgType: "school",
  adminName: "",
  adminEmail: "",
  adminPhone: "",
  city: "",
  state: "Maharashtra",
  plan: "demo",
};

// ── Component ───────────────────────────────────────────────────────────────

export function DirectOnboardPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<DirectProvisionPayload>(EMPTY_FORM);
  const [result, setResult] = useState<{ success: boolean; message: string; activation?: any } | null>(null);

  // Recent orgs
  const { data: orgsData, isLoading: orgsLoading } = useQuery({
    queryKey: ["superadmin-all-orgs-direct"],
    queryFn: () => dashboardApi.getOrganizations(),
    staleTime: 30_000,
  });

  const orgs: any[] = orgsData?.data ?? [];

  const mutation = useMutation({
    mutationFn: (payload: DirectProvisionPayload) => directProvisionApi.provision(payload),
    onSuccess: (data) => {
      setResult({ success: true, message: data.message, activation: data.activation });
      setForm(EMPTY_FORM);
      qc.invalidateQueries({ queryKey: ["superadmin-all-orgs-direct"] });
    },
    onError: (err: any) => {
      setResult({ success: false, message: err?.message ?? "Provisioning failed. Please try again." });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    mutation.mutate(form);
  };

  const stats = useMemo(() => {
    const total = orgs.length;
    const active = orgs.filter((o) => o.status === "active").length;
    const trial = orgs.filter((o) => o.status === "trial" || o.status === "demo").length;
    return { total, active, trial };
  }, [orgs]);

  return (
    <div className="cg-page">
      {/* Header */}
      <div className="cg-page__header">
        <div className="cg-page__header-content">
          <h1 className="cg-page__title">Onboard New Organization</h1>
          <p className="cg-page__description">
            Directly provision a new institution without requiring a demo request. Admin credentials will be emailed automatically.
          </p>
        </div>
        <div className="cg-page__header-actions">
          <button
            className="cg-btn cg-btn--primary"
            onClick={() => { setShowForm(true); setResult(null); }}
          >
            <Plus size={14} /> Add Organization
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="cg-stats-grid">
        <CgMetricCard title="Total Organizations" value={orgsLoading ? "—" : stats.total} icon={<Building2 size={16} />} />
        <CgMetricCard title="Active" value={orgsLoading ? "—" : stats.active} icon={<CheckCircle size={16} />} />
        <CgMetricCard title="Trial / Demo" value={orgsLoading ? "—" : stats.trial} icon={<Users size={16} />} />
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="cg-modal-overlay">
          <div className="cg-modal cg-modal--lg">
            <div className="cg-modal__header">
              <h2 className="cg-modal__title">Provision New Organization</h2>
              <button className="cg-modal__close" onClick={() => setShowForm(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="cg-modal__body">
              {result && (
                <div className={`cg-alert cg-alert--${result.success ? "success" : "danger"}`} style={{ marginBottom: "1.25rem" }}>
                  <div className="cg-alert__body">
                    <span className="cg-alert__title">{result.success ? "✅ Provisioned!" : "❌ Failed"}</span>
                    <p className="cg-alert__message">{result.message}</p>
                    {result.success && result.activation && (
                      <p className="cg-alert__message" style={{ marginTop: "0.5rem" }}>
                        Activation link sent to admin email. Code expires in 5 minutes.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="cg-form-grid">
                <div className="cg-field cg-field--full">
                  <label className="cg-field__label">Institution Name *</label>
                  <input
                    className="cg-input"
                    required
                    placeholder="e.g. Sunrise Public School"
                    value={form.institutionName}
                    onChange={(e) => setForm((f) => ({ ...f, institutionName: e.target.value }))}
                  />
                </div>

                <div className="cg-field">
                  <label className="cg-field__label">Organization Type *</label>
                  <select className="cg-input" value={form.orgType} onChange={(e) => setForm((f) => ({ ...f, orgType: e.target.value }))}>
                    {ORG_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                <div className="cg-field">
                  <label className="cg-field__label">Plan</label>
                  <select className="cg-input" value={form.plan} onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value as any }))}>
                    {PLAN_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>

                <div className="cg-field">
                  <label className="cg-field__label">Admin Full Name *</label>
                  <input
                    className="cg-input"
                    required
                    placeholder="Principal / Admin name"
                    value={form.adminName}
                    onChange={(e) => setForm((f) => ({ ...f, adminName: e.target.value }))}
                  />
                </div>

                <div className="cg-field">
                  <label className="cg-field__label">Admin Email *</label>
                  <input
                    className="cg-input"
                    type="email"
                    required
                    placeholder="admin@institution.edu"
                    value={form.adminEmail}
                    onChange={(e) => setForm((f) => ({ ...f, adminEmail: e.target.value }))}
                  />
                </div>

                <div className="cg-field">
                  <label className="cg-field__label">Admin Phone</label>
                  <input
                    className="cg-input"
                    placeholder="+91 9000000000"
                    value={form.adminPhone}
                    onChange={(e) => setForm((f) => ({ ...f, adminPhone: e.target.value }))}
                  />
                </div>

                <div className="cg-field">
                  <label className="cg-field__label">City</label>
                  <input
                    className="cg-input"
                    placeholder="Pune"
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  />
                </div>

                <div className="cg-field">
                  <label className="cg-field__label">State</label>
                  <select className="cg-input" value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}>
                    {INDIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="cg-modal__footer">
                <button type="button" className="cg-btn cg-btn--outline" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="cg-btn cg-btn--primary" disabled={mutation.isPending}>
                  {mutation.isPending ? <><Loader size={14} className="cg-spin" /> Provisioning…</> : <><Plus size={14} /> Provision Organization</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Organizations Table */}
      <CgSectionPanel
        title="All Organizations"
        description="Every institution currently provisioned on Classgrid."
        noPadding
        style={{ marginTop: "1.5rem" }}
      >
        {orgsLoading ? (
          <div className="cg-empty-state"><Loader size={20} className="cg-spin" /> Loading…</div>
        ) : orgs.length === 0 ? (
          <div className="cg-empty-state">
            <Building2 size={32} className="cg-empty-state__icon" />
            <p>No organizations yet. Provision your first one above.</p>
          </div>
        ) : (
          <table className="cg-table">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Type</th>
                <th>Plan</th>
                <th>Users</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((org) => (
                <tr key={org._id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{org.name}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{org.ownerEmail}</div>
                  </td>
                  <td style={{ textTransform: "capitalize" }}>{org.org_type?.replace(/_/g, " ") || "—"}</td>
                  <td>{org.plan || "—"}</td>
                  <td>{org.userCount ?? 0}</td>
                  <td>
                    <Badge variant={org.status === "active" ? "success" : org.status === "suspended" ? "danger" : "warning"} dot>
                      {org.status ?? "unknown"}
                    </Badge>
                  </td>
                  <td style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    {org.createdAt ? new Date(org.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CgSectionPanel>
    </div>
  );
}
