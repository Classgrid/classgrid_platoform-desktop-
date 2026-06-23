import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { MessageSquare, Search, Bug, Lightbulb, Mail } from "lucide-react";
import { toast } from "sonner";

import { CgPageHeader } from "@/components/classgrid/PageHeader";
import { CgSectionPanel } from "@/components/classgrid/SectionPanel";
import { CgDataTable } from "@/components/classgrid/DataTable";
import { CgButton } from "@/components/classgrid/Button";
import { CgBadge } from "@/components/classgrid/Badge";
import { Input } from "@/components/ui/input";

import { feedbackApi, type PlatformFeedback } from "../services/superAdminApi";

export function FeedbackPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["superadmin-feedback"],
    queryFn: feedbackApi.getAll,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => feedbackApi.updateStatus(id, status),
    onSuccess: () => {
      toast.success("Feedback status updated.");
      queryClient.invalidateQueries({ queryKey: ["superadmin-feedback"] });
    },
    onError: () => {
      toast.error("Failed to update feedback status.");
    },
  });

  const feedbacks = data?.data || [];
  const filteredFeedbacks = feedbacks.filter((f) =>
    f.message.toLowerCase().includes(search.toLowerCase()) ||
    f.user.name.toLowerCase().includes(search.toLowerCase())
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "bug":
        return <Bug className="size-4 text-destructive" />;
      case "feature_request":
        return <Lightbulb className="size-4 text-amber-500" />;
      default:
        return <MessageSquare className="size-4 text-muted-foreground" />;
    }
  };

  const columns: ColumnDef<PlatformFeedback>[] = [
    {
      header: "User",
      accessorKey: "user.name",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{row.original.user.name}</span>
          <span className="text-xs text-muted-foreground">{row.original.user.email}</span>
        </div>
      ),
    },
    {
      header: "Category",
      accessorKey: "category",
      cell: ({ getValue }) => {
        const val = getValue<string>();
        return (
        <div className="flex items-center gap-2">
          {getCategoryIcon(val)}
          <span className="capitalize">{val.replace("_", " ")}</span>
        </div>
        );
      },
    },
    {
      header: "Message",
      accessorKey: "message",
      cell: ({ getValue }) => {
        const val = getValue<string>();
        return (
        <p className="max-w-md truncate text-sm" title={val}>
          {val}
        </p>
        );
      },
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ getValue }) => {
        const val = getValue<string>();
        return (
        <CgBadge variant={val === "new" ? "warning" : val === "reviewed" ? "success" : "neutral"}>
          {val}
        </CgBadge>
        );
      },
    },
    {
      header: "Actions",
      accessorKey: "_id",
      cell: ({ row }) => (
        <div className="flex gap-2">
          {row.original.status !== "reviewed" && (
            <CgButton
              size="sm"
              variant="outline"
              onClick={() => updateMutation.mutate({ id: row.original._id, status: "reviewed" })}
            >
              Mark Reviewed
            </CgButton>
          )}
          {row.original.status !== "archived" && (
            <CgButton
              size="sm"
              variant="ghost"
              onClick={() => updateMutation.mutate({ id: row.original._id, status: "archived" })}
            >
              Archive
            </CgButton>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <CgPageHeader
        title="Platform Feedback"
        description="Review feature requests, bug reports, and general feedback from platform users."
      />

      <CgSectionPanel>
        <div className="mb-4 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search feedback..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <CgButton variant="outline" className="gap-2">
            <Mail className="size-4" />
            Send Broadcast
          </CgButton>
        </div>

        <CgDataTable
          columns={columns}
          data={filteredFeedbacks}
          isLoading={isLoading}
          emptyMessage="No feedback submitted yet."
        />
      </CgSectionPanel>
    </div>
  );
}
