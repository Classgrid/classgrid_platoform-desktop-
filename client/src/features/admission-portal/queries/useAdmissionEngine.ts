import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getEngineConfig,
  getCandidateSession,
  saveApplicationDraft,
  submitApplication,
  uploadDocument,
  initiateFeePayment,
  verifyFeePayment,
  withdrawApplication,
  getDocChecklist,
  getSeatAvailability,
  printApplication,
  printConfirmation,
} from "../api";
import type { EngineConfigResponse, ApplicationState } from "../types";

// ═══════════════════════════════════════════════════════════════
// Config Hook — fetches config + form_schema from backend
// Returns: { organization, structure_type, config, form_schema }
// ═══════════════════════════════════════════════════════════════

export function useEngineConfig(orgId?: string) {
  return useQuery<EngineConfigResponse>({
    queryKey: ["engine-config", orgId],
    queryFn: () => getEngineConfig(orgId!),
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });
}

// ═══════════════════════════════════════════════════════════════
// Session Hook — fetches authenticated candidate's application
// Auto-refreshes every 10s to pick up admin actions (review,
// shortlist, select, reject, enroll, division allotment)
// ═══════════════════════════════════════════════════════════════

export function useCandidateSession() {
  return useQuery<ApplicationState>({
    queryKey: ["candidate-session"],
    queryFn: getCandidateSession,
    enabled: !!localStorage.getItem("admission_token"),
    retry: false,
    refetchInterval: 10_000, // Poll every 10s for admin action reflection
    refetchIntervalInBackground: false,
  });
}

// ═══════════════════════════════════════════════════════════════
// Document Checklist Hook
// ═══════════════════════════════════════════════════════════════

export function useDocChecklist() {
  return useQuery({
    queryKey: ["doc-checklist"],
    queryFn: getDocChecklist,
    enabled: !!localStorage.getItem("admission_token"),
  });
}

// ═══════════════════════════════════════════════════════════════
// Seat Availability Hook — per stream/course/standard
// ═══════════════════════════════════════════════════════════════

export function useSeatAvailability(orgId?: string) {
  return useQuery({
    queryKey: ["seat-availability", orgId],
    queryFn: () => getSeatAvailability(orgId!),
    enabled: !!orgId,
    refetchInterval: 30_000, // Refresh every 30s for near-real-time
  });
}

// ═══════════════════════════════════════════════════════════════
// Mutations — all invalidate candidate-session on success
// ═══════════════════════════════════════════════════════════════

export function useSaveDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saveApplicationDraft,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["candidate-session"] });
    },
  });
}

export function useSubmitApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: submitApplication,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["candidate-session"] });
    },
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ docName, file }: { docName: string; file: File }) =>
      uploadDocument(docName, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["candidate-session"] });
      qc.invalidateQueries({ queryKey: ["doc-checklist"] });
    },
  });
}

export function useInitiateFeePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: initiateFeePayment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["candidate-session"] });
    },
  });
}

export function useVerifyFeePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ paymentId, orderId, signature }: { paymentId: string; orderId: string; signature: string }) =>
      verifyFeePayment(paymentId, orderId, signature),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["candidate-session"] });
    },
  });
}

export function useWithdrawApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (applicationId: string) => withdrawApplication(applicationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["candidate-session"] });
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// Print Mutations — download PDF blobs
// ═══════════════════════════════════════════════════════════════

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function usePrintApplication() {
  return useMutation({
    mutationFn: printApplication,
    onSuccess: (blob) => {
      downloadBlob(blob, "admission-application.pdf");
    },
  });
}

export function usePrintConfirmation() {
  return useMutation({
    mutationFn: printConfirmation,
    onSuccess: (blob) => {
      downloadBlob(blob, "admission-confirmation.pdf");
    },
  });
}
