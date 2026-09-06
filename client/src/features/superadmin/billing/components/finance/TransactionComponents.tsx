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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/marketing_ui/table';
import { Badge } from '@/components/marketing_ui/badge';
import { Button } from '@/components/marketing_ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose, DrawerFooter } from '@/components/marketing_ui/drawer';
import { Building2, Receipt, ArrowRightCircle, ExternalLink, CreditCard, Smartphone, Banknote, History, User, Store, ShieldCheck, ShieldAlert, SplitSquareHorizontal, Undo2, MoreVertical, Terminal, Webhook } from 'lucide-react';
import { MoneyDisplay, AsyncBillingState } from '../shared/BillingStateComponents';
import { useTransactions, useTransactionDetail, useTransactionWebhooks, useRefundTransaction } from '../../hooks/useBillingFinance';
import { format } from 'date-fns';
import { Tabs, TabsList, TabsTrigger } from '@/components/marketing_ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/marketing_ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/marketing_ui/dropdown-menu';

// 24. TransactionStatusBadge
export const TransactionStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const normalized = status.toUpperCase();
  switch (normalized) {
    case 'SUCCESS':
    case 'COMPLETED':
    case 'CAPTURED':
      return <Badge className="bg-primary/10 text-primary border-primary/20">SUCCESS</Badge>;
    case 'FAILED':
    case 'DECLINED':
      return <Badge variant="destructive">FAILED</Badge>;
    case 'PENDING':
    case 'PROCESSING':
      return <Badge variant="secondary" className="text-muted-foreground border-dashed">PENDING</Badge>;
    case 'REFUNDED':
    case 'REVERSED':
      return <Badge variant="outline" className="border-primary text-primary border-dashed">REFUNDED</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// 25. TransactionTable
export const TransactionTable: React.FC<{
  onViewDetail: (txId: string) => void;
  filters: any;
}> = ({ onViewDetail, filters }) => {
  const { data: transactions, isLoading, error } = useTransactions(filters);

  return (
    <div className="rounded-md border bg-card">
      <AsyncBillingState loading={isLoading} error={error} skeletonType="table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Reference</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions?.map((tx: any) => (
              <TableRow key={tx.id}>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {format(new Date(tx.createdAt), 'dd MMM yyyy, HH:mm')}
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {tx.organization?.name || tx.orgId}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono text-xs uppercase bg-muted/50">{tx.type}</Badge>
                </TableCell>
                <TableCell className="font-medium">
                  <MoneyDisplay amountPaise={tx.amountPaise} />
                </TableCell>
                <TableCell>
                  <TransactionStatusBadge status={tx.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => onViewDetail(tx.id)} className="h-8 gap-1">
                    Details <ArrowRightCircle className="w-3 h-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {transactions?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  No transactions found matching the criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </AsyncBillingState>
    </div>
  );
};

// 26. TransactionDetailDrawer
export const TransactionDetailDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  txId: string;
}> = ({ isOpen, onClose, txId }) => {
  const { data: tx, isLoading, error } = useTransactionDetail(txId);

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-w-xl ml-auto right-0 left-auto h-full rounded-l-xl rounded-r-none">
        <DrawerHeader className="border-b pb-4">
          <DrawerTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Transaction Details
          </DrawerTitle>
        </DrawerHeader>
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          <AsyncBillingState loading={isLoading} error={error} skeletonType="card">
            {tx && (
              <>
                <div className="flex justify-between items-start bg-card p-4 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Amount</p>
                    <h3 className="text-2xl font-semibold flex items-center gap-2">
                      <MoneyDisplay amountPaise={tx.amountPaise} />
                    </h3>
                  </div>
                  <TransactionStatusBadge status={tx.status} />
                </div>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Transaction ID</span>
                    <span className="font-mono text-foreground">{tx._id || tx.id}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Organization</span>
                    <span className="text-foreground">{tx.organization?.name || tx.orgId}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Date</span>
                    <span className="text-foreground">{format(new Date(tx.createdAt), 'dd MMM yyyy, HH:mm:ss')}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Payment Gateway</span>
                    <span className="text-foreground">{tx.provider || 'System'}</span>
                  </div>
                  {tx.providerTxId && (
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Gateway Ref</span>
                      <span className="font-mono text-primary flex items-center gap-1 cursor-pointer hover:underline">
                        {tx.providerTxId} <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                  )}
                  {tx.paymentMethod && (
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Payment Method</span>
                      <PaymentMethodCell 
                        method={tx.paymentMethod.type} 
                        brand={tx.paymentMethod.brand} 
                        last4={tx.paymentMethod.last4} 
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <PayerInformationPanel payer={tx.payer} />
                  <MerchantAccountPanel merchant={tx.merchant} />
                </div>

                <div className="mt-6">
                  <TransactionTimeline events={tx.events || []} />
                </div>

                {tx.allocations && tx.allocations.length > 0 && (
                  <div className="mt-6">
                    <PaymentAllocationPanel allocations={tx.allocations} />
                  </div>
                )}

                {tx.refunds && tx.refunds.length > 0 && (
                  <div className="mt-6">
                    <RefundPanel refunds={tx.refunds} />
                  </div>
                )}

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SignatureVerificationPanel isVerified={tx.signatureVerified ?? true} signature={tx.signature} />
                  <GatewayResponsePanel response={tx.gatewayResponse} />
                </div>

                <div className="mt-6">
                  <WebhookTimeline txId={txId} />
                </div>
              </>
            )}
          </AsyncBillingState>
        </div>
        <DrawerFooter className="border-t">
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

// 43. TransactionFlowTabs
export const TransactionFlowTabs: React.FC<{
  activeTab: string;
  onTabChange: (tab: string) => void;
}> = ({ activeTab, onTabChange }) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full mb-6">
      <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="successful">Successful</TabsTrigger>
        <TabsTrigger value="pending">Pending</TabsTrigger>
        <TabsTrigger value="failed">Failed</TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

// 44. PaymentMethodCell
export const PaymentMethodCell: React.FC<{
  method: string; // e.g., 'card', 'upi', 'netbanking'
  brand?: string; // e.g., 'visa', 'mastercard'
  last4?: string;
}> = ({ method, brand, last4 }) => {
  if (!method) return <span className="text-muted-foreground">-</span>;

  let icon = <CreditCard className="w-4 h-4 text-muted-foreground" />;
  if (method.toLowerCase() === 'upi') icon = <Smartphone className="w-4 h-4 text-muted-foreground" />;
  if (method.toLowerCase() === 'netbanking') icon = <Banknote className="w-4 h-4 text-muted-foreground" />;

  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="capitalize">{method}</span>
      {last4 && <span className="text-muted-foreground font-mono text-xs">• {last4}</span>}
      {brand && <Badge variant="outline" className="text-[10px] h-5 px-1 uppercase">{brand}</Badge>}
    </div>
  );
};

// 45. TransactionTimeline
export const TransactionTimeline: React.FC<{
  events: { id: string; status: string; timestamp: string; note?: string }[];
}> = ({ events }) => {
  if (!events || events.length === 0) return null;

  return (
    <Card>
      <CardHeader className="py-3 px-4 border-b">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <History className="w-4 h-4 text-muted-foreground" />
          Event Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
          {events.map((event) => (
            <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-5 h-5 rounded-full border border-primary bg-background shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                <div className="w-2 h-2 bg-primary rounded-full" />
              </div>
              <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-lg border bg-card shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm capitalize">{event.status.replace(/_/g, ' ')}</span>
                  <time className="text-xs text-muted-foreground">{format(new Date(event.timestamp), 'MMM dd, HH:mm:ss')}</time>
                </div>
                {event.note && <p className="text-xs text-muted-foreground">{event.note}</p>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// 46. PayerInformationPanel
export const PayerInformationPanel: React.FC<{
  payer: { name?: string; email?: string; contact?: string } | null;
}> = ({ payer }) => {
  if (!payer) return null;

  return (
    <Card>
      <CardHeader className="py-3 px-4 border-b">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          Payer Details
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-2 text-sm">
        <div className="flex justify-between border-b pb-2">
          <span className="text-muted-foreground">Name</span>
          <span className="font-medium text-foreground">{payer.name || 'Not provided'}</span>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span className="text-muted-foreground">Email</span>
          <span className="text-foreground">{payer.email || '-'}</span>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span className="text-muted-foreground">Contact</span>
          <span className="text-foreground">{payer.contact || '-'}</span>
        </div>
      </CardContent>
    </Card>
  );
};

// 47. MerchantAccountPanel
export const MerchantAccountPanel: React.FC<{
  merchant: { accountId: string; name?: string; settlementStatus?: string } | null;
}> = ({ merchant }) => {
  if (!merchant) return null;

  return (
    <Card>
      <CardHeader className="py-3 px-4 border-b">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Store className="w-4 h-4 text-muted-foreground" />
          Connected Merchant Account
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-2 text-sm">
        <div className="flex justify-between border-b pb-2">
          <span className="text-muted-foreground">Account ID</span>
          <span className="font-mono text-foreground">{merchant.accountId}</span>
        </div>
        {merchant.name && (
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Business Name</span>
            <span className="text-foreground">{merchant.name}</span>
          </div>
        )}
        {merchant.settlementStatus && (
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Settlement</span>
            <span className="capitalize">{merchant.settlementStatus}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// 48. GatewayResponsePanel
export const GatewayResponsePanel: React.FC<{
  response: any;
}> = ({ response }) => {
  if (!response) return null;

  return (
    <Card>
      <CardHeader className="py-3 px-4 border-b">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Terminal className="w-4 h-4 text-muted-foreground" />
          Raw Gateway Response
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 bg-muted/30">
        <pre className="text-xs font-mono overflow-auto max-h-48 text-muted-foreground">
          {JSON.stringify(response, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
};

// 49. WebhookTimeline
export const WebhookTimeline: React.FC<{ txId: string }> = ({ txId }) => {
  const { data: webhooks, isLoading } = useTransactionWebhooks(txId);

  return (
    <Card>
      <CardHeader className="py-3 px-4 border-b">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Webhook className="w-4 h-4 text-muted-foreground" />
          Webhook Events
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="text-sm text-muted-foreground animate-pulse">Loading webhooks...</div>
        ) : !webhooks || webhooks.length === 0 ? (
          <div className="text-sm text-muted-foreground">No webhooks received for this transaction.</div>
        ) : (
          <div className="space-y-3">
            {webhooks.map((wh: any) => (
              <div key={wh.id} className="p-3 border rounded-md bg-card text-sm">
                <div className="flex justify-between items-center mb-2">
                  <Badge variant="outline" className="font-mono text-[10px]">{wh.event}</Badge>
                  <time className="text-xs text-muted-foreground">{format(new Date(wh.receivedAt), 'dd MMM HH:mm:ss')}</time>
                </div>
                <div className="text-xs text-muted-foreground">Status: <span className={wh.status === 'processed' ? 'text-green-500' : 'text-yellow-500'}>{wh.status}</span></div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// 50. SignatureVerificationPanel
export const SignatureVerificationPanel: React.FC<{
  isVerified: boolean;
  signature?: string;
}> = ({ isVerified, signature }) => {
  if (!signature) return null;

  return (
    <div className={`p-4 rounded-lg border flex items-start gap-3 ${isVerified ? 'bg-green-50/50 border-green-200' : 'bg-destructive/10 border-destructive/20'}`}>
      {isVerified ? (
        <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />
      ) : (
        <ShieldAlert className="w-5 h-5 text-destructive shrink-0" />
      )}
      <div>
        <h4 className={`text-sm font-semibold ${isVerified ? 'text-green-800' : 'text-destructive'}`}>
          {isVerified ? 'Signature Verified' : 'Signature Verification Failed'}
        </h4>
        <p className={`text-xs mt-1 break-all ${isVerified ? 'text-green-600/80' : 'text-destructive/80'}`}>
          Hash: {signature}
        </p>
      </div>
    </div>
  );
};

// 51. PaymentAllocationPanel
export const PaymentAllocationPanel: React.FC<{
  allocations: { id: string; target: string; amountPaise: number }[];
}> = ({ allocations }) => {
  if (!allocations || allocations.length === 0) return null;

  return (
    <Card>
      <CardHeader className="py-3 px-4 border-b">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <SplitSquareHorizontal className="w-4 h-4 text-muted-foreground" />
          Fund Allocations
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {allocations.map((alloc) => (
          <div key={alloc.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0">
            <span className="text-muted-foreground">{alloc.target}</span>
            <span className="font-medium text-foreground"><MoneyDisplay amountPaise={alloc.amountPaise} /></span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

// 52. RefundPanel
export const RefundPanel: React.FC<{
  refunds: { id: string; amountPaise: number; status: string; createdAt: string }[];
}> = ({ refunds }) => {
  if (!refunds || refunds.length === 0) return null;

  return (
    <Card>
      <CardHeader className="py-3 px-4 border-b">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Undo2 className="w-4 h-4 text-muted-foreground" />
          Refunds
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {refunds.map((ref) => (
          <div key={ref.id} className="flex items-center justify-between p-3 border rounded-md text-sm">
            <div>
              <div className="font-medium text-destructive"><MoneyDisplay amountPaise={ref.amountPaise} /></div>
              <div className="text-xs text-muted-foreground font-mono">{ref.id}</div>
            </div>
            <div className="text-right">
              <TransactionStatusBadge status={ref.status} />
              <div className="text-xs text-muted-foreground mt-1">{format(new Date(ref.createdAt), 'MMM dd')}</div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

// 53. TransactionActionMenu
export const TransactionActionMenu: React.FC<{
  txId: string;
  onInitiateRefund: () => void;
  onDownloadReceipt: () => void;
}> = ({ txId, onInitiateRefund, onDownloadReceipt }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onDownloadReceipt}>Download Receipt</DropdownMenuItem>
        <DropdownMenuItem onClick={onInitiateRefund} className="text-destructive">Initiate Refund</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
