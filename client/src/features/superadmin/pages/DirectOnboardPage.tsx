import { useState, useMemo } from "react";
import { Building2, Mail, Phone, MapPin, Users, Plus, X, CheckCircle, AlertCircle, Loader } from "lucide-react";


import { Badge } from "@/components/marketing_ui/badge";
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
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight">Onboard New Organization</h1>
          <p className="text-muted-foreground mt-1">
            Directly provision a new institution without requiring a demo request. Admin credentials will be emailed automatically.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="inline-flex items-center justify-center rounded-md text-sm font-medium border h-9 px-4 py-2 bg-primary text-primary-foreground shadow"
            onClick={() => { setShowForm(true); setResult(null); }}
          >
            <Plus size={14} /> Add Organization
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div title="Total Organizations" value={orgsLoading ? "—" : stats.total} icon={<Building2 size={16} />} />
        <div title="Active" value={orgsLoading ? "—" : stats.active} icon={<CheckCircle size={16} />} />
        <div title="Trial / Demo" value={orgsLoading ? "—" : stats.trial} icon={<Users size={16} />} />
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="">
          <div className=" ">
            <div className="">
              <h2 className="">Provision New Organization</h2>
              <button className="" onClick={() => setShowForm(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="">
              {result && (
                <div className={`p-4 rounded-md border p-4 rounded-md border--${result.success ? "success" : "danger"}`} style={{ marginBottom: "1.25rem" }}>
                  <div className="p-4 rounded-md border__body">
                    <span className="p-4 rounded-md border__title">{result.success ? "✅ Provisioned!" : "❌ Failed"}</span>
                    <p className="p-4 rounded-md border__message">{result.message}</p>
                    {result.success && result.activation && (
                      <p className="p-4 rounded-md border__message" style={{ marginTop: "0.5rem" }}>
                        Activation link sent to admin email. Code expires in 5 minutes.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="">
                <div className=" ">
                  <label className="">Institution Name *</label>
                  <input
                    className=""
                    required
                    placeholder="e.g. Sunrise Public School"
                    value={form.institutionName}
                    onChange={(e) => setForm((f) => ({ ...f, institutionName: e.target.value }))}
                  />
                </div>

                <div className="">
                  <label className="">Organization Type *</label>
                  <ResponsiveSelect className="" value={form.orgType} onChange={(e) => setForm((f) => ({ ...f, orgType: e.target.value }))}>
                    {ORG_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </ResponsiveSelect>
                </div>

                <div className="">
                  <label className="">Plan</label>
                  <ResponsiveSelect className="" value={form.plan} onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value as any }))}>
                    {PLAN_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </ResponsiveSelect>
                </div>

                <div className="">
                  <label className="">Admin Full Name *</label>
                  <input
                    className=""
                    required
                    placeholder="Principal / Admin name"
                    value={form.adminName}
                    onChange={(e) => setForm((f) => ({ ...f, adminName: e.target.value }))}
                  />
                </div>

                <div className="">
                  <label className="">Admin Email *</label>
                  <input
                    className=""
                    type="email"
                    required
                    placeholder="admin@institution.edu"
                    value={form.adminEmail}
                    onChange={(e) => setForm((f) => ({ ...f, adminEmail: e.target.value }))}
                  />
                </div>

                <div className="">
                  <label className="">Admin Phone</label>
                  <input
                    className=""
                    placeholder="+91 9000000000"
                    value={form.adminPhone}
                    onChange={(e) => setForm((f) => ({ ...f, adminPhone: e.target.value }))}
                  />
                </div>

                <div className="">
                  <label className="">City</label>
                  <input
                    className=""
                    placeholder="Pune"
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  />
                </div>

                <div className="">
                  <label className="">State</label>
                  <ResponsiveSelect className="" value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}>
                    {INDIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </ResponsiveSelect>
                </div>
              </div>

              <div className="">
                <button type="button" className="inline-flex items-center justify-center rounded-md text-sm font-medium border h-9 px-4 py-2 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="inline-flex items-center justify-center rounded-md text-sm font-medium border h-9 px-4 py-2 bg-primary text-primary-foreground shadow" disabled={mutation.isPending}>
                  {mutation.isPending ? <><Loader size={14} className="animate-spin" /> Provisioning…</> : <><Plus size={14} /> Provision Organization</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Organizations Table */}
      <div
        title="All Organizations"
        description="Every institution currently provisioned on Classgrid."
        noPadding
        style={{ marginTop: "1.5rem" }}
      >
        {orgsLoading ? (
          <div className=""><Loader size={20} className="animate-spin" /> Loading…</div>
        ) : orgs.length === 0 ? (
          <div className="">
            <Building2 size={32} className="" />
            <p>No organizations yet. Provision your first one above.</p>
          </div>
        ) : (
          <table className="">
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
      </div>
    </div>
  );
}
