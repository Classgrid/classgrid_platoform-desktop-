/**
 * ==============================================================================
 * 🚨 AI AGENT WARNING: BREADCRUMB POLICY 🚨
 * ==============================================================================
 * NEVER hardcode "Super Admin Dashboard /" as a breadcrumb on any deep dive page.
 * Deep dive pages or sub-pages MUST accurately reflect the actual parent pages 
 * they were opened from (e.g., Organizations / [Name] / Configuration / ...).
 * DO NOT use generic dashboard text for breadcrumbs.
 * ==============================================================================
 */

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

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Search, Calendar as CalendarIcon, ChevronDown, MoreHorizontal } from "lucide-react";

// If UI table isn't found, fallback to simple HTML table styled with Tailwind
const dummyData = [
  { id: "T-1001", name: "Rahul Sharma", email: "rahul@example.com", orgType: "College", status: "Open", date: "Jul 25, 2026" },
  { id: "T-1002", name: "Priya Patel", email: "priya@example.com", orgType: "School", status: "Resolved", date: "Jul 24, 2026" },
  { id: "T-1003", name: "Amit Kumar", email: "amit@example.com", orgType: "Coaching", status: "In Progress", date: "Jul 23, 2026" },
  { id: "T-1004", name: "Neha Singh", email: "neha@example.com", orgType: "School", status: "Closed", date: "Jul 22, 2026" },
  { id: "T-1005", name: "Vikram Reddy", email: "vikram@example.com", orgType: "College", status: "Open", date: "Jul 21, 2026" },
];

export function SandboxPage() {
  return (
    <div className="min-h-screen w-full">
      
      {/* ═══ VERCEL EXACT DUMMY FILTER BAR ═══ */}
      <div className="flex flex-nowrap items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide w-full max-w-full text-sm px-6 pt-6">
        
        {/* All Branches */}
        <button className="flex h-9 min-w-[140px] flex-1 items-center justify-between rounded-md border border-border bg-transparent px-3 py-1 shadow-sm hover:bg-accent/50 transition-colors">
          <div className="flex items-center text-muted-foreground">
            <Search size={14} className="mr-2" />
            <span className="truncate">All Branc...</span>
          </div>
          <ChevronDown size={14} className="text-muted-foreground ml-2 shrink-0" />
        </button>

        {/* All Authors */}
        <button className="flex h-9 min-w-[140px] flex-1 items-center justify-between rounded-md border border-border bg-transparent px-3 py-1 shadow-sm hover:bg-accent/50 transition-colors">
          <div className="flex items-center text-muted-foreground">
            <Search size={14} className="mr-2" />
            <span className="truncate">All Autho...</span>
          </div>
          <ChevronDown size={14} className="text-muted-foreground ml-2 shrink-0" />
        </button>

        {/* All Environments */}
        <button className="flex h-9 min-w-[150px] flex-1 items-center justify-between rounded-md border border-border bg-transparent px-3 py-1 shadow-sm hover:bg-accent/50 transition-colors text-foreground">
          <span className="truncate">All Environments</span>
          <ChevronDown size={14} className="text-muted-foreground ml-2 shrink-0" />
        </button>

        {/* Select Date Range */}
        <button className="flex h-9 min-w-[200px] flex-[2] items-center rounded-md border border-border bg-transparent px-3 py-1 shadow-sm hover:bg-accent/50 transition-colors text-muted-foreground">
          <CalendarIcon size={14} className="mr-2 shrink-0" />
          <span className="truncate">Select Date Range</span>
        </button>

        {/* Status */}
        <button className="flex h-9 min-w-[140px] flex-1 items-center justify-between rounded-md border border-border bg-transparent px-3 py-1 shadow-sm hover:bg-accent/50 transition-colors">
          <div className="flex items-center">
            {/* Colored dots */}
            <div className="flex -space-x-1.5 mr-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 border border-background z-30" />
              <div className="w-3 h-3 rounded-full bg-red-500 border border-background z-20" />
              <div className="w-3 h-3 rounded-full bg-amber-500 border border-background z-10" />
              <div className="w-3 h-3 rounded-full bg-slate-200 border border-background z-0" />
            </div>
            <span className="text-foreground">Status</span>
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground">6/7</span>
          </div>
          <ChevronDown size={14} className="text-muted-foreground ml-2 shrink-0" />
        </button>

        {/* More Options */}
        <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-transparent shadow-sm hover:bg-accent/50 transition-colors">
          <MoreHorizontal size={14} className="text-foreground" />
        </button>

      </div>

      <div className="overflow-hidden bg-card border-t border-border">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
            <tr>
              <th className="px-6 py-4 font-medium">Ticket ID</th>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Email</th>
              <th className="px-6 py-4 font-medium">Org Type</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {/* Generate more rows to make the table big size */}
            {[...dummyData, ...dummyData, ...dummyData].map((row, index) => (
              <tr key={`${row.id}-${index}`} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4 font-medium text-foreground">{row.id}</td>
                <td className="px-6 py-4 text-foreground">{row.name}</td>
                <td className="px-6 py-4 text-muted-foreground">{row.email}</td>
                <td className="px-6 py-4 text-muted-foreground">{row.orgType}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    row.status === 'Open' ? 'bg-blue-500/10 text-blue-500' :
                    row.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-500' :
                    row.status === 'In Progress' ? 'bg-amber-500/10 text-amber-500' :
                    'bg-slate-500/10 text-slate-500'
                  }`}>
                    {row.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-muted-foreground">{row.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
