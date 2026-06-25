import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/marketing_ui/card";
import { DataTable } from "@/components/marketing_ui/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/marketing_ui/avatar";
import { Kbd } from "@/components/marketing_ui/kbd";
import { useOrgDashboardClassrooms } from "../../queries/useOrgDashboard";

interface OrgClassroomsCardProps {
  profile: any;
  capabilities: any;
}

export function OrgClassroomsCard({ profile, capabilities }: OrgClassroomsCardProps) {
  const { data: classData, isLoading: isClassLoading } = useOrgDashboardClassrooms();

  const classroomColumns = [
    { key: "name", header: "Classroom Name" },
    { key: "subject", header: "Subject" },
    { 
      key: "teacherName", 
      header: profile?.terminology?.educator || "Teacher",
      render: (value: string, row: any) => (
        <div className="flex items-center gap-2">
          <Avatar size="sm">
            <AvatarImage src={row.teacher?.profileImageUrl} alt={value} />
            <AvatarFallback>{value !== "Unassigned" ? value.substring(0, 2).toUpperCase() : "??"}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-sm">{value}</span>
        </div>
      )
    },
    { key: "memberCount", header: (profile?.terminology?.learner || "Student") + "s" },
    { 
      key: "classCode", 
      header: "Code",
      render: (value: string) => <Kbd className="uppercase tracking-widest">{value}</Kbd>
    },
  ];

  const formattedClassrooms = classData?.classrooms?.map((c: any) => ({
    ...c,
    teacherName: c.teacher?.name || "Unassigned"
  })) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Classrooms</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable 
          columns={classroomColumns} 
          rows={formattedClassrooms} 
          isLoading={isClassLoading} 
        />
      </CardContent>
    </Card>
  );
}
