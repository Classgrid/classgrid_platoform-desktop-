import React from "react";
import { BookOpen, CheckSquare, Clock, Users } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/marketing_ui/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/marketing_ui/card";
import { DataTable } from "@/components/marketing_ui/data-table";

const classesColumns = [
  { accessorKey: "course", header: "Course" },
  { accessorKey: "batch", header: "Batch" },
  { accessorKey: "time", header: "Time" },
  { accessorKey: "room", header: "Room" },
];

const classesData = [
  { id: "1", course: "Data Structures", batch: "SY CS-A", time: "10:00 AM", room: "Lab 3" },
  { id: "2", course: "Algorithms", batch: "TY CS-B", time: "11:30 AM", room: "Room 402" },
  { id: "3", course: "Web Development", batch: "FY IT-A", time: "02:00 PM", room: "Lab 1" },
];

export function FacultyWorkPage() {
  return (
    <DashboardLayout role="FACULTY_MENU">
      <PageHeader 
        title="Faculty Workspace" 
        description="Manage your classes, students, and grading." 
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Today's Classes" value="4" icon={BookOpen} trend="Next in 30m" trendDirection="neutral" />
        <StatCard title="Attendance Pending" value="2" icon={CheckSquare} trend="From yesterday" trendDirection="down" />
        <StatCard title="Papers to Grade" value="45" icon={Clock} trend="Mid-terms" trendDirection="neutral" />
        <StatCard title="Total Students" value="180" icon={Users} trend="Across 3 batches" trendDirection="up" />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={classesColumns} data={classesData} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
