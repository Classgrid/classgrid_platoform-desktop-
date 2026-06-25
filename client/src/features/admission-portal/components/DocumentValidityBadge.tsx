import React from "react";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface DocumentValidityBadgeProps {
  documentName: string;
  issueDate?: string;
}

const VALIDITY_RULES: Record<string, number | null> = {
  caste_certificate: 36,
  income_certificate: 12,
  transfer_certificate: 12,
  medical_fitness: 6,
  photo: 6,
  cet_allotment_letter: 12,
  school_leaving_certificate: 12,
  domicile: null,
  gap_certificate: null,
  "12th_marksheet": null,
  "10th_marksheet": null,
  aadhar_card: null,
};

export const DocumentValidityBadge: React.FC<DocumentValidityBadgeProps> = ({ documentName, issueDate }) => {
  const maxAgeMonths = VALIDITY_RULES[documentName];

  if (maxAgeMonths === undefined) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
        <Clock className="w-3 h-3" />
        No Expiry
      </span>
    );
  }

  if (maxAgeMonths === null) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
        <CheckCircle className="w-3 h-3" />
        Lifetime Valid
      </span>
    );
  }

  if (!issueDate) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
        <AlertTriangle className="w-3 h-3" />
        Missing Issue Date
      </span>
    );
  }

  const issued = new Date(issueDate);
  const expiryDate = new Date(issued);
  expiryDate.setMonth(expiryDate.getMonth() + maxAgeMonths);
  const now = new Date();

  const isExpired = now > expiryDate;

  // Check if expiring within 30 days
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const isExpiringSoon = !isExpired && expiryDate <= thirtyDaysFromNow;

  if (isExpired) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 animate-pulse border border-red-200 dark:border-red-800">
        <AlertTriangle className="w-3 h-3" />
        Expired on {expiryDate.toLocaleDateString()}
      </span>
    );
  }

  if (isExpiringSoon) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
        <Clock className="w-3 h-3" />
        Expiring Soon ({expiryDate.toLocaleDateString()})
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
      <CheckCircle className="w-3 h-3" />
      Valid until {expiryDate.toLocaleDateString()}
    </span>
  );
};
