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
import { FileEdit, CheckSquare, Clock, GraduationCap } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/marketing_ui/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/marketing_ui/card";
import { DataTable } from "@/components/marketing_ui/data-table";

const examColumns = [
  { accessorKey: "exam", header: "Exam Name" },
  { accessorKey: "subject", header: "Subject" },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "date", header: "Date" },
];

const examData = [
  { id: "1", exam: "Mid-Term", subject: "Physics", status: "Ongoing", date: "Today" },
  { id: "2", exam: "Unit Test 1", subject: "Mathematics", status: "Grading", date: "Yesterday" },
  { id: "3", exam: "Finals", subject: "Chemistry", status: "Scheduled", date: "Next Week" },
];

export function ExamsDashboardPage() {
  return (
    <DashboardLayout role="EXAMS_MENU">
      <PageHeader 
        title="Examinations Overview" 
        description="Manage exams, grading, and results." 
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Active Exams" value="12" icon={FileEdit} trend="Currently running" trendDirection="neutral" />
        <StatCard title="Results Published" value="84" icon={CheckSquare} trend="This semester" trendDirection="up" />
        <StatCard title="Pending Grading" value="3" icon={Clock} trend="Action required" trendDirection="neutral" />
        <StatCard title="Pass Percentage" value="94%" icon={GraduationCap} trend="3% from last year" trendDirection="up" />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming & Active Exams</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={examColumns} data={examData} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
