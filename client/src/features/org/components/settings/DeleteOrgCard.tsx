import React, { useState } from "react";
import { Button } from "@/components/marketing_ui/button";
import { DangerConfirmDialog } from "@/components/marketing_ui/danger-confirm-dialog";
import { useUserProfile } from "@/features/shared/queries/useUserProfile";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";

export function DeleteOrgCard() {
  const { data: profileData } = useUserProfile();
  const [showConfirm, setShowConfirm] = useState(false);

  const orgName = profileData?.organization_id?.name || "";
  const orgSubdomain = profileData?.organization_id?.subdomain || "";
  const orgLogo = profileData?.organization_id?.logo_url;

  const deleteMutation = useMutation({
    mutationFn: async () => {
      // Simulate a network request for 2 seconds so you can see the spinner
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true };
    },
    onSuccess: (data) => {
      toast.success("Deletion requested! Please check your email to confirm.");
      setShowConfirm(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to request organization deletion.");
    },
  });

  // Only render if we have org data
  if (!profileData?.organization_id) {
    return null;
  }

  return (
    <>
      <div className="border border-red-500/20 rounded-xl overflow-hidden mt-2 shadow-sm">
        <div className="p-6 bg-card flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <h3 className="text-lg font-semibold text-foreground tracking-tight">
              Delete Organization
            </h3>
            <p className="text-sm text-muted-foreground">
              Permanently delete this organization and all associated data, including student records, faculty accounts, departmental data, custom domains, fee transactions, and all ERP settings.
            </p>
          </div>

          <div className="bg-muted/20 border border-border/50 rounded-lg p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-muted/50 border border-border/50 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
              {orgLogo ? (
                <img src={orgLogo} alt={orgName} className="w-full h-full object-cover" />
              ) : (
                <div className="text-muted-foreground font-bold text-lg">
                  {orgName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-foreground">{orgName}</span>
              <span className="text-xs text-muted-foreground mt-0.5">
                Domain: {orgSubdomain}.classgrid.in
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-red-500/5 border-t border-red-500/20 flex items-center justify-end">
          <Button variant="destructive" onClick={() => setShowConfirm(true)}>
            Delete Organization
          </Button>
        </div>
      </div>

      <DangerConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Delete Organization"
        description={<>Permanently delete this organization and all associated data, including student records, faculty accounts, departmental data, custom domains, fee transactions, and all ERP settings.</>}
        warningMessage="This action is irreversible. All data across every department will be permanently lost and cannot be recovered."
        confirmationSteps={[
          {
            label: "To confirm, type the organization name",
            value: orgName,
          },
          {
            label: "Type the subdomain to finalize",
            value: orgSubdomain,
          },
          {
            label: "To confirm, type",
            value: "delete",
          },
        ]}
        actionLabel="Delete Organization"
        cancelLabel="Cancel"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        variant="danger"
      />
    </>
  );
}
