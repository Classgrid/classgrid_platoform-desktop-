import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Trash2, Plus, MoreHorizontal, Search, XCircle, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/marketing_ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/marketing_ui/tabs";
import { DataTable } from "@/components/marketing_ui/data-table";
import { Button } from "@/components/marketing_ui/button";
import { Input } from "@/components/marketing_ui/input";
import { ResponsiveSelect } from "@/components/marketing_ui/responsive-select";
import { Badge } from "@/components/marketing_ui/badge";
import { RefreshButton } from "@/components/marketing_ui/refresh-button";
import { apiClient } from "@/lib/apiClient";

// ── Types ─────────────────────────────────────────────────────────────────────

type PlatformRole = "super_admin" | "co_super_admin";

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
    label: "Super Admin",
    description: "God mode. Unrestricted access to everything.",
    icon: Shield
  },
  {
    value: "co_super_admin",
    label: "Co-Super Admin",
    description: "Full platform access. Can manage everything except God-Owner controls.",
    icon: Shield
  },
];

const ROLE_MAP: Record<PlatformRole, { label: string; variant: "danger" | "success" }> = {
  super_admin: { label: "Super Admin", variant: "danger" },
  co_super_admin: { label: "Co-Super Admin", variant: "success" }
};

function fmtDate(iso?: string) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
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
      .then((r) => r.data)
};

// ── Component ─────────────────────────────────────────────────────────────────

const EMPTY_FORM = { email: "", role: "co_super_admin" as PlatformRole };

export function TeamPage() {
  const qc = useQueryClient();
  const [forms, setForms] = useState([EMPTY_FORM]);
  const [errors, setErrors] = useState<Array<Partial<typeof EMPTY_FORM>>>([]);
  const [formResult, setFormResult] = useState<{ success: boolean; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState("team-members");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["superadmin-platform-team"],
    queryFn: () => teamApi.getTeam(),
    staleTime: 60_000,
    retry: 1
  });

  const team: TeamMember[] = data?.team ?? [];
  const activeMembers = team.filter((m) => m.status !== "pending");
  const pendingMembers = team.filter((m) => m.status === "pending");

  const removeMutation = useMutation({
    mutationFn: (id: string) => teamApi.removeMember(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["superadmin-platform-team"] })
  });

  const roleUpdateMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: PlatformRole }) => teamApi.updateRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["superadmin-platform-team"] })
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormResult(null);

    const newErrors: Array<Partial<typeof EMPTY_FORM>> = [];
    let hasError = false;

    forms.forEach((f, i) => {
        const err: Partial<typeof EMPTY_FORM> = {};
        if (!f.email.trim()) {
            err.email = "Email is required.";
            hasError = true;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) {
            err.email = "Invalid email format.";
            hasError = true;
        }
        newErrors[i] = err;
    });

    if (hasError) {
        setErrors(newErrors);
        return;
    }

    setErrors([]);
    setIsSubmitting(true);
    
    try {
        await Promise.all(forms.map(f => {
            const autoName = f.email.split("@")[0] || "New Member";
            return teamApi.inviteMember({ ...f, name: autoName });
        }));
        
        setFormResult({ success: true, message: "Invitations sent successfully." });
        setForms([EMPTY_FORM]);
        setActiveTab("pending-invitations");
        qc.invalidateQueries({ queryKey: ["superadmin-platform-team"] });
        setTimeout(() => setFormResult(null), 5000);
    } catch (err: any) {
        setFormResult({ success: false, message: err?.response?.data?.message || err?.message || "Failed to invite members." });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleAddMore = () => {
    setForms([...forms, EMPTY_FORM]);
  };

  const getColumns = (isPending: boolean) => [
    {
      key: "user",
      header: "User",
      render: (_: any, row: TeamMember) => (
        <div className="flex items-center gap-3 py-2 w-[250px] lg:w-[300px]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium shrink-0">
            {row.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-foreground leading-tight">{row.name}</span>
            <span className="text-sm text-muted-foreground">{row.email}</span>
          </div>
        </div>
      )
    },
    {
      key: "role",
      header: "Role",
      render: (_: any, row: TeamMember) => (
        <div className="w-[160px]">
          <ResponsiveSelect
            className="h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={row.role}
            onChange={(e) => roleUpdateMutation.mutate({ id: row._id, role: e.target.value as PlatformRole })}
            disabled={roleUpdateMutation.isPending}
          >
            {PLATFORM_ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </ResponsiveSelect>
        </div>
      )
    },
    {
      key: "status",
      header: "Status",
      render: (_: any, row: TeamMember) => (
        <div className="w-[100px]">
          <Badge variant={row.status === "active" ? "success" : row.status === "suspended" ? "danger" : "warning"} dot>
            {row.status === "pending" ? "Pending" : row.status === "active" ? "Active" : "Suspended"}
          </Badge>
        </div>
      )
    },
    {
      key: "lastLogin",
      header: "Last Login",
      render: (_: any, row: TeamMember) => (
        <span className="text-sm text-muted-foreground w-[100px] block">{fmtDate(row.lastLogin)}</span>
      )
    },
    {
      key: "date",
      header: isPending ? "Invited On" : "Joined",
      render: (_: any, row: TeamMember) => (
        <span className="text-sm text-muted-foreground w-[100px] block">{fmtDate(row.createdAt)}</span>
      )
    },
    {
      key: "actions",
      header: "",
      render: (_: any, row: TeamMember) => (
        <div className="flex justify-end pr-4">
            <Button
              size="sm"
              variant="ghost"
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 h-8 px-2 rounded-md"
              onClick={() => removeMutation.mutate(row._id)}
              disabled={removeMutation.isPending}
              title={isPending ? "Revoke Invite" : "Remove Member"}
            >
              <Trash2 size={16} />
            </Button>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1000px] mx-auto p-4 sm:p-6 lg:p-8 pb-12">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Members</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage team members and invitations</p>
        </div>
        <RefreshButton onClick={() => refetch()} isFetching={isFetching} />
      </div>

      {/* Invite Members Card (Vercel Style) */}
      <Card className="border-border shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border bg-muted/20 pb-4">
          <CardTitle className="text-lg">Invite Members</CardTitle>
          <CardDescription>
            Add new members to your team by entering their email address and assigning a role
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="p-6 pb-4">
                {formResult && (
                    <div className={`mb-4 p-3 rounded-md text-sm border ${formResult.success ? "bg-success/10 border-success/20 text-success" : "bg-danger/10 border-danger/20 text-danger"}`}>
                        {formResult.message}
                    </div>
                )}
                
                {forms.map((f, index) => (
                    <div key={index} className="flex flex-col sm:flex-row items-start gap-4 mb-4">
                        <div className="flex-1 w-full space-y-1.5">
                            {index === 0 && <label className="text-sm font-medium text-foreground">Email Address</label>}
                            <Input
                                type="email"
                                placeholder="jane@example.com"
                                className={errors[index]?.email ? "border-danger focus-visible:ring-danger bg-background" : "bg-background"}
                                value={f.email}
                                onChange={(e) => {
                                    const newForms = [...forms];
                                    newForms[index] = { ...newForms[index], email: e.target.value };
                                    setForms(newForms);
                                    
                                    if (errors[index]?.email) {
                                        const newErrors = [...errors];
                                        newErrors[index] = { ...newErrors[index], email: undefined };
                                        setErrors(newErrors);
                                    }
                                }}
                            />
                            {errors[index]?.email && <span className="text-xs font-medium text-danger">{errors[index]?.email}</span>}
                        </div>
                        <div className="w-full sm:w-[240px] flex items-start gap-2">
                            <div className="flex-1 space-y-1.5">
                                {index === 0 && <label className="text-sm font-medium text-foreground">Role</label>}
                                <ResponsiveSelect
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={f.role}
                                    onChange={(e) => {
                                        const newForms = [...forms];
                                        newForms[index] = { ...newForms[index], role: e.target.value as PlatformRole };
                                        setForms(newForms);
                                    }}
                                >
                                    {PLATFORM_ROLES.map((r) => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                </ResponsiveSelect>
                            </div>
                            {forms.length > 1 && (
                                <div className={index === 0 ? "pt-6" : ""}>
                                    <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-danger flex-shrink-0" onClick={() => {
                                        setForms(forms.filter((_, i) => i !== index));
                                        setErrors(errors.filter((_, i) => i !== index));
                                    }}>
                                        <X size={16} />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                
                <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-muted-foreground mt-2" onClick={handleAddMore}>
                    <Plus size={14} /> Add more
                </Button>
            </div>

            <div className="bg-muted/30 border-t border-border px-6 py-4 flex items-center justify-end">
                <Button type="submit" isLoading={isSubmitting} className="bg-primary text-primary-foreground font-medium w-[120px]">
                    Send Invite
                </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tabs & Data Table */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="team-members">Team Members</TabsTrigger>
          <TabsTrigger value="pending-invitations">Pending Invitations</TabsTrigger>
        </TabsList>
        
        {/* Vercel Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-2 mb-4 w-full">
            <div className="relative flex-1 w-full max-w-[400px]">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9 h-10 w-full bg-background" placeholder="Filter" />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 sm:ml-auto">
                <Button variant="outline" className="h-10 bg-background text-muted-foreground font-normal min-w-max justify-between gap-2" onClick={() => {}}>
                    All Team Roles <div className="ml-2 border-l pl-2 border-border text-[10px]">▼</div>
                </Button>
                <Button variant="outline" className="h-10 bg-background text-muted-foreground font-normal min-w-max justify-between gap-2" onClick={() => {}}>
                    2FA Status <div className="ml-2 border-l pl-2 border-border text-[10px]">▼</div>
                </Button>
                <Button variant="outline" className="h-10 bg-background text-foreground font-normal min-w-max justify-between gap-2" onClick={() => {}}>
                    Date <div className="ml-2 border-l pl-2 border-border text-[10px]">▼</div>
                </Button>
            </div>
        </div>

        <TabsContent value="team-members" className="m-0 border border-border rounded-md overflow-hidden bg-background">
          <DataTable
            columns={getColumns(false)}
            rows={activeMembers}
            isLoading={isLoading}
            emptyMessage="No active team members found."
          />
        </TabsContent>
        
        <TabsContent value="pending-invitations" className="m-0 border border-border rounded-md overflow-hidden bg-background">
          <DataTable
            columns={getColumns(true)}
            rows={pendingMembers}
            isLoading={isLoading}
            emptyMessage="No pending invitations."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
