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

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/marketing_ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/marketing_ui/card';
import { Input } from '@/components/marketing_ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/marketing_ui/select';
import { DateRangePicker, OrganizationSelector, OrganizationTypeFilter } from '../components/shared/BillingFilterComponents';
import { TransactionTable, TransactionDetailDrawer } from '../components/finance/TransactionComponents';

type DateRange = { from: Date; to?: Date };

const TransactionsPage = () => {
  const [paymentFlow, setPaymentFlow] = useState('ALL');
  const [organizationId, setOrganizationId] = useState('');
  const [organizationType, setOrganizationType] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [method, setMethod] = useState('ALL');
  const [settlementStatus, setSettlementStatus] = useState('ALL');
  const [refundStatus, setRefundStatus] = useState('ALL');
  const [dateRange, setDateRange] = useState<DateRange>();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const filters = {
    type: paymentFlow !== 'ALL' ? paymentFlow : undefined,
    organizationId: organizationId || undefined,
    organizationType: organizationType !== 'ALL' ? organizationType : undefined,
    status: status !== 'ALL' ? status : undefined,
    method: method !== 'ALL' ? method : undefined,
    settlementStatus: settlementStatus !== 'ALL' ? settlementStatus : undefined,
    refundStatus: refundStatus !== 'ALL' ? refundStatus : undefined,
    startDate: dateRange?.from.toISOString(),
    endDate: dateRange?.to?.toISOString(),
    search: search || undefined,
  };

  const clearFilters = () => {
    setPaymentFlow('ALL');
    setOrganizationId('');
    setOrganizationType('ALL');
    setStatus('ALL');
    setMethod('ALL');
    setSettlementStatus('ALL');
    setRefundStatus('ALL');
    setDateRange(undefined);
    setSearchInput('');
    setSearch('');
  };

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <div className="border-b border-border bg-card p-6">
        <h2 className="text-xl font-semibold tracking-tight">Payment Transactions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Includes both Classgrid subscriptions and institution-owned payment flows.
        </p>
      </div>

      <div className="space-y-6 p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Filters</CardTitle>
            <Button variant="ghost" size="sm" onClick={clearFilters}>Clear all</Button>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Select value={paymentFlow} onValueChange={(value) => value && setPaymentFlow(value)}>
              <SelectTrigger><SelectValue placeholder="Payment flow" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All payment flows</SelectItem>
                <SelectItem value="CLASSGRID_SUBSCRIPTION">Classgrid subscriptions</SelectItem>
                <SelectItem value="INSTITUTION_FEE">Institution payments</SelectItem>
              </SelectContent>
            </Select>
            <OrganizationSelector selectedId={organizationId} onSelect={setOrganizationId} />
            <OrganizationTypeFilter value={organizationType} onChange={setOrganizationType} />
            <Select value={status} onValueChange={(value) => value && setStatus(value)}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="CAPTURED">Captured</SelectItem>
                <SelectItem value="PARTIALLY_REFUNDED">Partially refunded</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="DISPUTED">Disputed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={method} onValueChange={(value) => value && setMethod(value)}>
              <SelectTrigger><SelectValue placeholder="Payment method" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All methods</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="netbanking">Net banking</SelectItem>
                <SelectItem value="wallet">Wallet</SelectItem>
              </SelectContent>
            </Select>
            <Select value={settlementStatus} onValueChange={(value) => value && setSettlementStatus(value)}>
              <SelectTrigger><SelectValue placeholder="Settlement status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All settlement statuses</SelectItem>
                <SelectItem value="UNSETTLED">Unsettled</SelectItem>
                <SelectItem value="SETTLED">Settled</SelectItem>
                <SelectItem value="FAILED">Settlement failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={refundStatus} onValueChange={(value) => value && setRefundStatus(value)}>
              <SelectTrigger><SelectValue placeholder="Refund status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All refund statuses</SelectItem>
                <SelectItem value="NONE">No refund</SelectItem>
                <SelectItem value="PENDING">Refund pending</SelectItem>
                <SelectItem value="PROCESSED">Refund processed</SelectItem>
                <SelectItem value="FAILED">Refund failed</SelectItem>
              </SelectContent>
            </Select>
            <DateRangePicker date={dateRange} setDate={setDateRange} />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search transaction, provider payment, or organization"
              className="xl:col-span-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Transaction log</CardTitle></CardHeader>
          <CardContent className="p-0">
            <TransactionTable filters={filters} onViewDetail={setSelectedTxId} />
          </CardContent>
        </Card>
      </div>

      {selectedTxId && (
        <TransactionDetailDrawer
          isOpen
          onClose={() => setSelectedTxId(null)}
          txId={selectedTxId}
        />
      )}
    </div>
  );
};

export default TransactionsPage;
