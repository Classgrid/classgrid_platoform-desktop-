/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 CRITICAL AI AND SYSTEM RULES 🚨
 * 1. NEVER DELETE ANY ENVIRONMENT VARIABLES.
 * 2. LOCALHOST TESTING IS STRICTLY BANNED. NO AI WILL EVER TRY TO WORK LOCALLY.
 * 3. THIS REPO IS PRODUCTION-FIRST. DO NOT TOUCH OR REMOVE KEYS.
 * ─────────────────────────────────────────────────────────
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 NAMING CONVENTION RULE 🚨
 * 1. "CLASSGRID PLATFORM" is strictly the REPO NAME.
 * 2. "CLASSGRID ERP" is the actual PRODUCT NAME.
 * 3. NEVER use "Classgrid Platform" anywhere in the frontend UI or user-facing text.
 * ─────────────────────────────────────────────────────────
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 HOSTING & ARCHITECTURE RULE 🚨
 * 1. BACKEND IS HOSTED ON AWS EC2 AT API.CLASSGRID.IN
 * 2. FRONTEND IS HOSTED ON VERCEL
 * ─────────────────────────────────────────────────────────
 */

import React from "react";
import { CheckCircle, AlertTriangle, CalendarX2, UserX } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/marketing_ui/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/marketing_ui/card";
import { DataTable } from "@/components/marketing_ui/data-table";

const attendanceColumns = [
  { accessorKey: "student", header: "Student" },
  { accessorKey: "course", header: "Course" },
  { accessorKey: "attendance", header: "Attendance %" },
  { accessorKey: "status", header: "Status" },
];

const attendanceData = [
  { id: "1", student: "Karan Desai", course: "B.Tech CS", attendance: "65%", status: "Defaulter" },
  { id: "2", student: "Meera Nair", course: "MBA", attendance: "72%", status: "Warning" },
  { id: "3", student: "Rahul Verma", course: "B.Sc Physics", attendance: "98%", status: "Good" },
];

export function AttendanceDashboardPage() {
  return (
    <DashboardLayout role="ATTENDANCE_MENU">
      <PageHeader 
        title="Attendance Overview" 
        description="Monitor campus-wide attendance and defaulters." 
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Campus Average" value="88%" icon={CheckCircle} trend="2% from last week" trendDirection="up" />
        <StatCard title="Defaulters (<75%)" value="142" icon={AlertTriangle} trend="Needs attention" trendDirection="down" />
        <StatCard title="On Leave Today" value="45" icon={CalendarX2} trend="Normal" trendDirection="neutral" />
        <StatCard title="Absentees Today" value="312" icon={UserX} trend="12% of total" trendDirection="neutral" />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Watchlist</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={attendanceColumns} data={attendanceData} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
