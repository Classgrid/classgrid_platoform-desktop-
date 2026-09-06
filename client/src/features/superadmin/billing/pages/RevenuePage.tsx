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

// 🛑 AI AGENT INSTRUCTION: DO NOT EDIT OR REFACTOR THIS FILE.
// The user explicitly requested that AI agents must NEVER modify this file,
// its layout, logic, or structure without extreme explicit permission.
// 🛑 STOP AND ASK BEFORE MAKING ANY CHANGES HERE.

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/marketing_ui/card';
import { RevenueViewTabs, RevenueOrganizationTable, RevenueModuleTable } from '../components/finance/RevenueComponents';
import { RevenueExportDialog, RevenueInvoiceTable } from '../components/finance/FinanceComponents';

const RevenuePage = () => {
  const [activeTab, setActiveTab] = useState('organizations');

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <div className="flex items-center justify-between border-b border-border bg-card p-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Revenue Ledger</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Only captured Classgrid SaaS subscription revenue is included.
          </p>
        </div>
        <RevenueExportDialog />
      </div>

      <div className="space-y-6 p-6">
        <RevenueViewTabs activeTab={activeTab} onTabChange={setActiveTab} />
        <Card>
          <CardHeader>
            <CardTitle>
              {activeTab === 'organizations'
                ? 'Revenue by Organization'
                : activeTab === 'modules'
                  ? 'Revenue by Module'
                  : 'Revenue by Invoice'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">Detailed platform subscription revenue records.</p>
          </CardHeader>
          <CardContent className="p-0">
            {activeTab === 'organizations' && <RevenueOrganizationTable />}
            {activeTab === 'modules' && <RevenueModuleTable />}
            {activeTab === 'invoices' && <RevenueInvoiceTable />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RevenuePage;
