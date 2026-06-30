
import { ResponsiveSelect } from "@/components/marketing_ui/responsive-select";
import { useState, useMemo } from "react";
import { Users, UserPlus, X, Loader, Shield, Headphones, TrendingUp, Settings, RefreshCw, Trash2, CheckCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SectionPanel } from "@/components/marketing_ui/SectionPanel";
import { StatCard } from "@/components/marketing_ui/StatCard";
import { Badge } from "@/components/marketing_ui/badge";
import { Button } from "@/components/marketing_ui/button";
import { Input } from "@/components/marketing_ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/marketing_ui/dialog";
import { apiClient } from "@/lib/apiClient";

// ── Types ─────────────────────────────────────────────────────────────────────

type PlatformRole =
  | "super_admin"
  | "platform_support"
  | "platform_sales"
  | "platform_moderator"
  | "platform_analyst";

type TeamMember = {
  _id: string;
  name: string;
  email: string;
  role: PlatformRole;
  isEmailVerified: boolean;
  status: "active" | "suspended" | "pending";
  createdAt: string;
  lastLogin?: string;
};

// ── Role definitions ──────────────────────────────────────────────────────────

const PLATFORM_ROLES: { value: PlatformRole; label: string; description: string; icon: React.ComponentType<any> }[] = [
  {
    value: "super_admin",
    label: "Co-Super Admin",
    description: "Full platform access. Can manage everything except God-Owner controls.",
    icon: Shield,
  },
  {
    value: "platform_support",
    label: "Support Agent",
    description: "Can view and reply to support tickets, manage helpdesk.",
    icon: Headphones,
  },
  {
    value: "platform_sales",
    label: "Sales / Growth",
    description: "Can view leads, schedule demos, onboard new orgs.",
    icon: TrendingUp,
  },
  {
    value: "platform_moderator",
    label: "Content Moderator",
    description: "Can manage announcements, changelog, and reviews.",
    icon: Settings,
  },
  {
    value: "platform_analyst",
    label: "Analyst",
    description: "Read-only access to analytics, audit logs, and usage data.",
    icon: TrendingUp,
  },
];

const ROLE_MAP: Record<PlatformRole, { label: string; variant: "success" | "warning" | "info" | "danger" | "neutral" }> = {
  super_admin:          { label: "Co-Super Admin",    variant: "danger" },
  platform_support:     { label: "Support Agent",     variant: "info" },
  platform_sales:       { label: "Sales / Growth",    variant: "success" },
  platform_moderator:   { label: "Moderator",         variant: "warning" },
  platform_analyst:     { label: "Analyst",           variant: "neutral" },
};

function fmtDate(iso?: string) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// ── API calls ─────────────────────────────────────────────────────────────────

const teamApi = {
  getTeam: () =>
    apiClient
      .get<{ success: boolean; team: TeamMember[] }>("/api/super-admin/team")
      .then((r) => r.data),

  inviteMember: (payload: { name: string; email: string; role: PlatformRole }) =>
    apiClient
      .post<{ success: boolean; message: string; member: TeamMember }>("/api/super-admin/team/invite", payload)
      .then((r) => r.data),

  updateRole: (id: string, role: PlatformRole) =>
    apiClient
      .patch<{ success: boolean }>(`/api/super-admin/team/${id}/role`, { role })
      .then((r) => r.data),

  removeMember: (id: string) =>
    apiClient
      .delete<{ success: boolean }>(`/api/super-admin/team/${id}`)
      .then((r) => r.data),
};

// ── Component ─────────────────────────────────────────────────────────────────

const EMPTY_FORM = { name: "", email: "", role: "platform_support" as PlatformRole };

export function TeamPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<typeof EMPTY_FORM>>({});
  const [formResult, setFormResult] = useState<{ success: boolean; message: string } | null>(null);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["superadmin-platform-team"],
    queryFn: () => teamApi.getTeam(),
    staleTime: 60_000,
    retry: 1,
  });

  const team: TeamMember[] = data?.team ?? [];

  const inviteMutation = useMutation({
    mutationFn: (payload: typeof form) => teamApi.inviteMember(payload),
    onSuccess: (res) => {
      setFormResult({ success: true, message: res.message ?? "Invitation sent successfully." });
      setForm(EMPTY_FORM);
      qc.invalidateQueries({ queryKey: ["superadmin-platform-team"] });
    },
    onError: (err: any) => {
      setFormResult({ success: false, message: err?.message ?? "Failed to invite member." });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => teamApi.removeMember(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["superadmin-platform-team"] }),
  });

  const roleUpdateMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: PlatformRole }) => teamApi.updateRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["superadmin-platform-team"] }),
  });

  const stats = useMemo(() => {
    const byRole = PLATFORM_ROLES.reduce((acc, r) => {
      acc[r.value] = team.filter((m) => m.role === r.value).length;
      return acc;
    }, {} as Record<string, number>);
    return { total: team.length, byRole };
  }, [team]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormResult(null);
    
    // Custom Validation
    const newErrors: Partial<typeof EMPTY_FORM> = {};
    if (!form.name.trim()) newErrors.name = "Full Name is required.";
    if (!form.email.trim()) {
      newErrors.email = "Email Address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    inviteMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        title="Platform Team"
        description="Invite co-admins, support agents, sales staff, and analysts to help manage Classgrid. Each role has controlled access."
        actions={
          <div className="flex gap-2">
            <RefreshButton onClick={() => refetch()} isFetching={isFetching} />
            <Button onClick={() => { setShowForm(true); setFormResult(null); }}>
              <UserPlus size={14} /> Invite Team Member
            </Button>
          </div>
        }
      />

      {/* Role cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {PLATFORM_ROLES.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.value} className="bg-card border border-border rounded-lg p-4 shadow-sm flex flex-col gap-2">
              <div className="flex justify-between items-center text-primary">
                <Icon size={20} />
                <span className="text-xl font-bold text-foreground">{stats.byRole[r.value] ?? 0}</span>
              </div>
              <div>
                <div className="font-semibold text-foreground text-sm">{r.label}</div>
                <div className="text-xs text-muted-foreground mt-1 leading-snug">{r.description}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Invite Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              An invitation email with a one-time setup link will be sent to this address.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} noValidate className="grid gap-4 py-4">
            {formResult && (
              <div className={`p-3 rounded-md text-sm ${formResult.success ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
                {formResult.message}
              </div>
            )}
            
            <div className="grid gap-2">
              <label className="text-sm font-medium">Full Name *</label>
              <Input
                className={errors.name ? "border-danger focus-visible:ring-danger" : ""}
                placeholder="e.g. Rahul Sharma"
                value={form.name}
                onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setErrors((errs) => ({ ...errs, name: undefined })); }}
              />
              {errors.name && <span className="text-xs font-medium text-danger">{errors.name}</span>}
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Email Address *</label>
              <Input
                type="email"
                className={errors.email ? "border-danger focus-visible:ring-danger" : ""}
                placeholder="rahul@classgrid.in"
                value={form.email}
                onChange={(e) => { setForm((f) => ({ ...f, email: e.target.value })); setErrors((errs) => ({ ...errs, email: undefined })); }}
              />
              {errors.email && <span className="text-xs font-medium text-danger">{errors.email}</span>}
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Platform Role *</label>
              <ResponsiveSelect
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as PlatformRole }))}
              >
                {PLATFORM_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label} — {r.description}</option>
                ))}
              </ResponsiveSelect>
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={inviteMutation.isPending}>
                <UserPlus size={14} /> Send Invite
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Team Table */}
      <SectionPanel
        title={`Team Members (${stats.total})`}
        description="All platform staff with their assigned roles and access levels."
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-muted-foreground"><Loader size={20} className="animate-spin mb-2" /> Loading team…</div>
        ) : isError ? (
          <div className="bg-danger/10 border border-danger text-danger p-4 rounded-md my-4">
            <h4 className="font-bold">Failed to load Team</h4>
            <p className="text-sm mt-1">
              {error instanceof Error ? error.message : "Unknown error"}
              {(error as any)?.response?.data?.message ? ` — ${(error as any).response.data.message}` : ""}
            </p>
          </div>
        ) : team.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
            <Users size={32} className="mb-2 opacity-50" />
            <p>No team members yet. Invite your first co-admin or support agent above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-medium">Member</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Last Login</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {team.map((m) => {
                  const { label, variant } = ROLE_MAP[m.role] ?? { label: m.role, variant: "neutral" as const };
                  return (
                    <tr key={m._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">{m.name}</div>
                        <div className="text-xs text-muted-foreground">{m.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <ResponsiveSelect
                          className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          value={m.role}
                          onChange={(e) => roleUpdateMutation.mutate({ id: m._id, role: e.target.value as PlatformRole })}
                          disabled={roleUpdateMutation.isPending}
                        >
                          {PLATFORM_ROLES.map((r) => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </ResponsiveSelect>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={m.status === "active" ? "success" : m.status === "suspended" ? "danger" : "warning"} dot>
                          {m.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(m.lastLogin)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(m.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => removeMutation.mutate(m._id)}
                          isLoading={removeMutation.isPending}
                          title="Remove from team"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionPanel>
    </div>
  );
}
