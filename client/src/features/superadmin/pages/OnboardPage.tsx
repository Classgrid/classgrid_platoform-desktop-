import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Building, Plus, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/marketing_ui/badge";
import { Button } from "@/components/marketing_ui/button";



import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/marketing_ui/dialog";
import { Input } from "@/components/marketing_ui/input";
import { ResponsiveSelect } from "@/components/marketing_ui/responsive-select";

import { onboardingApi, type PendingOrganization } from "../services/superAdminApi";

export function OnboardPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", domain: "", type: "school", city: "" });
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["superadmin-pending-orgs"],
    queryFn: onboardingApi.getPendingOrganizations,
    staleTime: 60_000,
    retry: 1,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => onboardingApi.approveOrganization(id),
    onSuccess: (res) => {
      toast.success(res.message || "Organization approved.");
      queryClient.invalidateQueries({ queryKey: ["superadmin-pending-orgs"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to approve organization.");
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: typeof form) =>
      onboardingApi.createOrganization({
        institutionName: payload.name,
        adminEmail: payload.email,
        adminName: `${payload.name} Admin`,
        orgType: payload.type,
        city: payload.city,
        state: "N/A",
        plan: "demo",
      }),
    onSuccess: (res) => {
      toast.success(res.message || "Organization created successfully.");
      queryClient.invalidateQueries({ queryKey: ["superadmin-pending-orgs"] });
      setIsCreating(false);
      setForm({ name: "", email: "", domain: "", type: "school", city: "" });
      setErrors({});
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create organization.");
    },
  });

  const pendingOrgs = data?.data || [];
  const filteredOrgs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pendingOrgs;

    return pendingOrgs.filter((org) =>
      [org.name, org.ownerEmail, org.email, org.ownerName, org.domain, org.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [pendingOrgs, search]);

  const columns: ColumnDef<PendingOrganization>[] = [
    {
      accessorKey: "name",
      header: "Organization",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Building className="size-4 text-muted-foreground" />
          <span className="font-medium text-foreground">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Owner Email",
      cell: ({ row }) => row.original.ownerEmail || row.original.email || "Not provided",
    },
    {
      accessorKey: "domain",
      header: "Domain",
      cell: ({ row }) => row.original.domain || "Not provided",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Badge variant="warning">{row.original.status}</Badge>,
    },
    {
      accessorKey: "createdAt",
      header: "Submitted",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString("en-IN"),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => approveMutation.mutate(row.original._id)}
          disabled={approveMutation.isPending}
        >
          {approveMutation.isPending ? "Approving..." : "Approve"}
        </Button>
      ),
    },
  ];

  function submitCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: Partial<typeof form> = {};
    if (!form.name.trim()) nextErrors.name = "Organization name is required.";
    if (!form.domain.trim()) nextErrors.domain = "Domain is required.";
    if (!form.email.trim()) {
      nextErrors.email = "Owner email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    createMutation.mutate(form);
  }

  return (
    <div className="space-y-6">
      <div
        title="Organization Onboarding"
        description="Review pending requests and provision organizations through live backend APIs."
        actions={
          <>
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="size-4" />
              Onboard New Org
            </Button>
          </>
        }
      />

      <div title="Pending Organization Requests" description="Applications waiting for super-admin review." noPadding>
        <div className="flex items-center gap-2 p-2 border-b border-border">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or domain..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-10 pl-9"
            />
          </div>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="size-4" />
            Onboard New Org
          </Button>
        </div>

        {isError ? (
          <div className="p-4 rounded-md border bg-red-100 text-red-800 p-4 rounded-md border border-red-200" style={{ margin: "0 1rem 1rem" }}>
            <div className="p-4 rounded-md border__body">
              <span className="p-4 rounded-md border__title">Could not load pending organizations</span>
              <p className="p-4 rounded-md border__message">
                {(error as Error)?.message || "The pending organizations endpoint did not return data."}
              </p>
            </div>
            <Button variant="outline" onClick={() => refetch()}>Retry</Button>
          </div>
        ) : null}

        <div
          columns={columns}
          data={filteredOrgs}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          loadingLabel="Fetching pending organizations from backend"
          emptyIcon={<Building size={32} />}
          emptyTitle={pendingOrgs.length ? "No requests match your search" : "No pending organizations"}
          emptyDescription={
            pendingOrgs.length
              ? "Try a different organization name, owner email, or domain."
              : "New applications and direct onboarding requests will appear here."
          }
          emptyAction={
            pendingOrgs.length ? (
              <Button variant="outline" onClick={() => setSearch("")}>Clear Search</Button>
            ) : (
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="size-4" />
                Create Organization
              </Button>
            )
          }
        />
      </div>

      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Onboard New Organization</DialogTitle>
            <DialogDescription>Create a backend organization directly from the super-admin dashboard.</DialogDescription>
          </DialogHeader>

          <form onSubmit={submitCreate} noValidate className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Organization Name *</label>
              <Input
                className={errors.name ? "border-danger focus-visible:ring-danger" : ""}
                value={form.name}
                onChange={(event) => {
                  setForm({ ...form, name: event.target.value });
                  setErrors({ ...errors, name: undefined });
                }}
              />
              {errors.name ? <span className="text-xs font-medium text-danger">{errors.name}</span> : null}
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Owner Email *</label>
              <Input
                type="email"
                className={errors.email ? "border-danger focus-visible:ring-danger" : ""}
                value={form.email}
                onChange={(event) => {
                  setForm({ ...form, email: event.target.value });
                  setErrors({ ...errors, email: undefined });
                }}
              />
              {errors.email ? <span className="text-xs font-medium text-danger">{errors.email}</span> : null}
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Domain *</label>
              <Input
                className={errors.domain ? "border-danger focus-visible:ring-danger" : ""}
                value={form.domain}
                onChange={(event) => {
                  setForm({ ...form, domain: event.target.value });
                  setErrors({ ...errors, domain: undefined });
                }}
                placeholder="school.edu"
              />
              {errors.domain ? <span className="text-xs font-medium text-danger">{errors.domain}</span> : null}
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Type</label>
              <ResponsiveSelect
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.type}
                onChange={(event) => setForm({ ...form, type: event.target.value })}
              >
                <option value="school">School</option>
                <option value="coaching">Coaching</option>
                <option value="college">College</option>
              </ResponsiveSelect>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">City</label>
              <Input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={createMutation.isPending}>
                Submit
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
