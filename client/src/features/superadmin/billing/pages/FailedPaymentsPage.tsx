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

import React, { useState } from 'react';
import { FailedPaymentsTable, FailedPaymentDetailDrawer, FailedPaymentsOverview } from '../components/finance/FailureComponents';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/marketing_ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../../components/marketing_ui/select';

const FailedPaymentsPage = () => {
  const [filterType, setFilterType] = useState('ALL');
  const [selectedFailureId, setSelectedFailureId] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <div className="flex justify-between items-center p-6 border-b border-border bg-card">
        <h2 className="text-xl font-semibold tracking-tight">Failed Payments Triage</h2>
        <div className="flex gap-2 items-center">
          <Select value={filterType} onValueChange={(value) => value && setFilterType(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Failures" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Failures</SelectItem>
              <SelectItem value="UNRESOLVED">Unresolved</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <p className="text-sm text-muted-foreground">
          Triage and recover failed payment attempts. Never automatically retry a charge; generate a new secure checkout link instead.
        </p>



        {/* Overview Stats */}
        <FailedPaymentsOverview />

        {/* Log Table */}
        <Card>
          <CardHeader>
            <CardTitle>Failed Transaction Log</CardTitle>
            <p className="text-sm text-muted-foreground">All failed or incomplete platform subscription payments.</p>
          </CardHeader>
          <CardContent className="p-0">
            <FailedPaymentsTable 
              filterType={filterType} 
              onViewDetail={setSelectedFailureId} 
            />
          </CardContent>
        </Card>
      </div>

      {selectedFailureId && (
        <FailedPaymentDetailDrawer 
          isOpen={!!selectedFailureId} 
          onClose={() => setSelectedFailureId(null)} 
          failureId={selectedFailureId} 
        />
      )}
    </div>
  );
};

export default FailedPaymentsPage;
