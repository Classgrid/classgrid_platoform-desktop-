import React from "react";
import { Users, FileText, CheckCircle, Clock } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/marketing_ui/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/marketing_ui/card";
import { DataTable } from "@/components/marketing_ui/data-table";

const applicationsColumns = [
  { accessorKey: "name", header: "Applicant" },
  { accessorKey: "course", header: "Course" },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "date", header: "Date" },
];

const applicationsData = [
  { id: "1", name: "Rohan Patel", course: "B.Tech CS", status: "Review", date: "Today" },
  { id: "2", name: "Aditi Sharma", course: "MBA", status: "Interview", date: "Yesterday" },
  { id: "3", name: "Suresh Kumar", course: "B.Sc Physics", status: "Rejected", date: "2 days ago" },
];

export function AdmissionsDashboardPage() {
  return (
    <DashboardLayout role="ADMISSION_MENU">
      <PageHeader 
        title="Admissions Overview" 
        description="Monitor and manage new student applications." 
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Applications" value="1,245" icon={FileText} trend="15% this week" trendDirection="up" />
        <StatCard title="Enrolled" value="840" icon={CheckCircle} trend="5% this week" trendDirection="up" />
        <StatCard title="Pending Review" value="312" icon={Clock} trend="Action required" trendDirection="neutral" />
        <StatCard title="Conversion Rate" value="67%" icon={Users} trend="2% from last month" trendDirection="up" />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={applicationsColumns} data={applicationsData} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
