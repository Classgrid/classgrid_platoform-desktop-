import React, { useState } from "react";
import { Button } from "@/components/marketing_ui/button";
import { DangerConfirmDialog } from "@/components/marketing_ui/danger-confirm-dialog";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";
import { useUserProfile } from "@/features/shared/queries/useUserProfile";
import { useNavigate } from "react-router-dom";

export function SettingsDeleteAccountCard() {
  const { data: profileData } = useUserProfile();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");

  const orgName = profileData?.organization_id?.name || "";

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post("/api/auth/delete-account", {
        password,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Account deleted successfully.");
      setOpen(false);
      navigate("/login");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete account.");
    },
  });

  const handleConfirm = () => {
    deleteAccountMutation.mutate();
  };

  return (
    <>
      <div className="border border-red-500/20 rounded-xl overflow-hidden mt-2 shadow-sm">
        <div className="p-6 bg-card flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <h3 className="text-lg font-semibold text-foreground tracking-tight">
              Delete Account
            </h3>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated data. This action is irreversible.
            </p>
          </div>
        </div>

        <div className="p-4 bg-red-500/5 border-t border-red-500/20 flex items-center justify-end">
          <Button variant="destructive" onClick={() => setOpen(true)}>
            Delete Account
          </Button>
        </div>
      </div>

      <DangerConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete Account"
        description="Permanently delete your account and all associated data."
        warningMessage="This action is irreversible. All your data will be permanently lost and cannot be recovered."
        confirmationSteps={[
          {
            label: "To confirm, type the organization name",
            value: orgName,
          }
        ]}
        actionLabel="Delete Account"
        cancelLabel="Cancel"
        isLoading={deleteAccountMutation.isPending}
        onConfirm={handleConfirm}
        variant="danger"
        isConfirmDisabled={password.length < 8}
      >
        <div className="flex flex-col gap-2.5 pt-2">
          <label className="text-sm text-zinc-300">Type your password to finalize</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-10 w-full rounded-md border bg-black px-3 text-sm text-white outline-none transition-all duration-200 focus:ring-1 focus:ring-white/30 focus:border-white/30 border-white/10"
            disabled={deleteAccountMutation.isPending}
          />
        </div>
      </DangerConfirmDialog>
    </>
  );
}
