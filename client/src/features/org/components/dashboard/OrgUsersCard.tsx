import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/marketing_ui/card";
import { DataTable } from "@/components/marketing_ui/data-table";
import { Badge } from "@/components/marketing_ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/marketing_ui/avatar";
import { useOrgDashboardUsers } from "../../queries/useOrgDashboard";

interface OrgUsersCardProps {
  profile: any;
  capabilities: any;
}

export function OrgUsersCard({ profile, capabilities }: OrgUsersCardProps) {
  const { data: usersData, isLoading: isUsersLoading } = useOrgDashboardUsers({ role: "student", limit: 5 });

  const studentColumns = [
    { 
      key: "name", 
      header: profile?.terminology?.learner ? `${profile.terminology.learner} Name` : "Student Name",
      render: (value: string, row: any) => (
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            <AvatarImage src={row.profileImageUrl} alt={value} />
            <AvatarFallback>{value.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    { key: "prn", header: profile?.terminology?.identifier || "ID" },
    { key: "branch", header: profile?.terminology?.program || "Program" },
    { key: "batch", header: "Batch" },
    ...(capabilities.hasDivisions ? [{ key: "department", header: profile?.terminology?.group || "Section" }] : []),
    { 
      key: "status", 
      header: "Status",
      render: (value: string) => {
        const variant = value.toLowerCase() === "active" ? "success" : 
                        value.toLowerCase() === "pending" ? "warning" : "default";
        return <Badge variant={variant}>{value}</Badge>;
      }
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Enrollments</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable 
          columns={studentColumns} 
          rows={usersData?.users || []} 
          isLoading={isUsersLoading} 
        />
      </CardContent>
    </Card>
  );
}
