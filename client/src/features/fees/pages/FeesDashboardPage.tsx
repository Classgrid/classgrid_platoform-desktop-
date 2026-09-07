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
import { IndianRupee, AlertTriangle, TrendingUp, Receipt } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/marketing_ui/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/marketing_ui/card";
import { DataTable } from "@/components/marketing_ui/data-table";

const txColumns = [
  { accessorKey: "student", header: "Student" },
  { accessorKey: "amount", header: "Amount" },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "date", header: "Date" },
];

const txData = [
  { id: "1", student: "Karan Desai", amount: "₹45,000", status: "Success", date: "Today" },
  { id: "2", student: "Meera Nair", amount: "₹12,500", status: "Failed", date: "Yesterday" },
  { id: "3", student: "Rahul Verma", amount: "₹85,000", status: "Success", date: "2 days ago" },
];

export function FeesDashboardPage() {
  return (
    <DashboardLayout role="FEES_MENU">
      <PageHeader 
        title="Fees Overview" 
        description="Track payments, dues, and financial reports." 
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Collected" value="₹12.5M" icon={IndianRupee} trend="15% from last month" trendDirection="up" />
        <StatCard title="Pending Dues" value="₹2.1M" icon={AlertTriangle} trend="3% increase" trendDirection="down" />
        <StatCard title="Defaulters" value="145" icon={Receipt} trend="Needs attention" trendDirection="neutral" />
        <StatCard title="Growth" value="+8.4%" icon={TrendingUp} trend="Healthy" trendDirection="up" />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={txColumns} data={txData} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
