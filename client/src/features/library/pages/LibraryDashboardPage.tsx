import React from "react";
import { Book, CheckSquare, Clock, ArrowDownToLine } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/marketing_ui/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/marketing_ui/card";
import { DataTable } from "@/components/marketing_ui/data-table";

const booksColumns = [
  { accessorKey: "title", header: "Title" },
  { accessorKey: "borrower", header: "Borrower" },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "dueDate", header: "Due Date" },
];

const booksData = [
  { id: "1", title: "Introduction to Algorithms", borrower: "Rahul Sharma", status: "Issued", dueDate: "Tomorrow" },
  { id: "2", title: "Clean Code", borrower: "Priya Patel", status: "Overdue", dueDate: "2 days ago" },
  { id: "3", title: "Design Patterns", borrower: "Library", status: "Available", dueDate: "-" },
];

export function LibraryDashboardPage() {
  return (
    <DashboardLayout role="LIBRARY_MENU">
      <PageHeader 
        title="Library Dashboard" 
        description="Manage books, inventory, and circulations." 
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Books" value="15,420" icon={Book} trend="245 new this month" trendDirection="up" />
        <StatCard title="Issued Books" value="1,204" icon={CheckSquare} trend="8% of inventory" trendDirection="neutral" />
        <StatCard title="Overdue" value="84" icon={Clock} trend="Action required" trendDirection="down" />
        <StatCard title="New Arrivals" value="45" icon={ArrowDownToLine} trend="This week" trendDirection="up" />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Circulations</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={booksColumns} data={booksData} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
