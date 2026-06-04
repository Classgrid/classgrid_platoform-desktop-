import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Megaphone, BellRing, Search, Plus } from "lucide-react";
import { toast } from "sonner";

import { CgPageHeader } from "@/components/classgrid/PageHeader";
import { CgSectionPanel } from "@/components/classgrid/SectionPanel";
import { CgDataTable } from "@/components/classgrid/DataTable";
import { CgButton } from "@/components/classgrid/Button";
import { CgBadge } from "@/components/classgrid/Badge";
import { Input } from "@/components/shadcn/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/shadcn/dialog";

import { announcementsApi, type Announcement } from "../services/superAdminApi";

export function PlatformAnnouncementsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState("global");

  const { data, isLoading } = useQuery({
    queryKey: ["superadmin-announcements"],
    queryFn: announcementsApi.list,
  });

  const broadcastMutation = useMutation({
    mutationFn: (payload: { title: string; body: string; target: string }) =>
      announcementsApi.broadcastGlobal(payload),
    onSuccess: (res) => {
      toast.success(res.message || `Broadcast sent successfully (${res.sent} devices).`);
      queryClient.invalidateQueries({ queryKey: ["superadmin-announcements"] });
      setIsModalOpen(false);
      setTitle("");
      setBody("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to send broadcast.");
    },
  });

  const announcements = data?.notifications || [];
  const filteredAnnouncements = announcements.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  const columns: ColumnDef<Announcement>[] = [
    {
      header: "Title",
      accessorKey: "title",
      cell: ({ getValue }) => {
        const val = getValue<string>();
        return (
        <div className="flex items-center gap-2">
          <BellRing className="size-4 text-muted-foreground" />
          <span className="font-medium">{val}</span>
        </div>
        );
      },
    },
    {
      header: "Target Audience",
      accessorKey: "target",
      cell: ({ getValue }) => {
        const val = getValue<string>();
        return (
        <CgBadge variant="neutral" className="capitalize">
          {val.replace("_", " ")}
        </CgBadge>
        );
      },
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ getValue }) => {
        const val = getValue<string>();
        return (
        <CgBadge variant={val === "sent" ? "success" : "warning"}>{val}</CgBadge>
        );
      },
    },
    {
      header: "Scheduled At",
      accessorKey: "scheduledAt",
      cell: ({ getValue }) => new Date(getValue<string>()).toLocaleString(),
    },
  ];

  return (
    <div className="space-y-6">
      <CgPageHeader
        title="Platform Announcements"
        description="Broadcast push notifications and system alerts to all users or specific roles."
      />

      <CgSectionPanel>
        <div className="mb-4 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search announcements..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <CgButton className="gap-2" onClick={() => setIsModalOpen(true)}>
            <Megaphone className="size-4" />
            New Broadcast
          </CgButton>
        </div>

        <CgDataTable
          columns={columns}
          data={filteredAnnouncements}
          isLoading={isLoading}
          emptyMessage="No announcements found."
        />
      </CgSectionPanel>

      {/* Broadcast Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Global Broadcast</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Notification Title</label>
              <Input
                placeholder="e.g., Scheduled Maintenance"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Message Body</label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Enter the push notification message..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Target Audience</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              >
                <option value="global">All Platform Users</option>
                <option value="all_students">All Students</option>
                <option value="all_faculty">All Faculty / Teachers</option>
                <option value="all_org_admins">All Organization Admins</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <CgButton variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </CgButton>
            <CgButton
              onClick={() => broadcastMutation.mutate({ title, body, target })}
              isLoading={broadcastMutation.isPending}
              disabled={!title || !body}
            >
              Send Now
            </CgButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
