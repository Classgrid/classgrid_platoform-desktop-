import { apiClient } from "@/lib/apiClient";

export interface OrgUsageSummary {
  students: { active: number; limit: number | null };
  faculty: { active: number; limit: number | null };
  deptAdmins: { active: number; limit: number | null };
  orgAdmins: { active: number };
  classrooms: { active: number };
  emailsSent: { thisMonth: number; total: number };
  smsSent: { thisMonth: number; total: number };
  storageUsedGb: number;
  storageLimitGb: number | null;
  liveClassMinutes: { thisMonth: number };
  aiTokensUsed: { thisMonth: number };
}

export interface OrgUsageDailySeries {
  date: string;
  emails: number;
  sms: number;
  activeStudents: number;
  liveMinutes: number;
}

export interface OrgUsageBreakdownItem {
  name?: string;
  role?: string;
  count: number;
}

export interface OrgUsageResponse {
  summary: OrgUsageSummary;
  dailySeries: OrgUsageDailySeries[];
  studentBreakdown: {
    byDepartment: OrgUsageBreakdownItem[];
    byYear: OrgUsageBreakdownItem[];
  };
  facultyBreakdown: {
    byDepartment: OrgUsageBreakdownItem[];
  };
  deptAdminBreakdown: OrgUsageBreakdownItem[];
}

export interface OrgBillingSubscription {
  plan: string;
  status: string;
  isPaid: boolean;
  expiresAt: string | null;
  features: Record<string, boolean>;
  billing: {
    basePricePerMonth: number;
    pricePerStudent: number;
    pricePerFaculty: number;
    pricePerDeptAdmin: number;
    pricePerGB: number;
    pricePerEmail: number;
    pricePerSms: number;
    pricePerApiRequest: number;
    pricePerAiToken: number;
    pricePerAgoraMinute: number;
  };
  limits: {
    maxStudents: number | null;
    maxFaculty: number | null;
    maxDeptAdmins: number | null;
    storageGb: number | null;
  };
}

export interface OrgBillingCurrentCharges {
  platformFee: number;
  studentCharges: { count: number; rate: number; total: number };
  facultyCharges: { count: number; rate: number; total: number };
  deptAdminCharges: { count: number; rate: number; total: number };
  emailCharges: { count: number; rate: number; total: number };
  smsCharges?: { count: number; rate: number; total: number };
  storageCharges?: { count: number; rate: number; total: number };
  apiCharges?: { count: number; rate: number; total: number };
  aiCharges?: { count: number; rate: number; total: number };
  liveClassCharges?: { count: number; rate: number; total: number };
  subtotal: number;
  gstPercent: number;
  gstAmount: number;
  total: number;
}

export interface OrgBillingResponse {
  subscription: OrgBillingSubscription;
  currentMonthCharges: OrgBillingCurrentCharges;
  invoices: any[]; // We'll refine this later
  payments: any[];
  feeCollection: {
    totalInvoices: number;
    totalBilled: number;
    totalPaid: number;
    outstanding: number;
    transactions: number;
  };
}

export const orgAdminBillingApi = {
  getUsage: (params?: { month?: number; year?: number }) =>
    apiClient
      .get<OrgUsageResponse>("/api/org/usage", { params })
      .then((res) => res.data),

  getBilling: () =>
    apiClient.get<OrgBillingResponse>("/api/org/billing").then((res) => res.data),
};
