import React, { useState } from "react";
import { Button } from "@/components/marketing_ui/button";
import { DangerConfirmDialog } from "@/components/marketing_ui/danger-confirm-dialog";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";

export function SettingsChangePasswordCard() {
  const [open, setOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post("/api/auth/change-password", {
        oldPassword,
        newPassword,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Password changed successfully.");
      setOpen(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to change password.");
    },
  });

  const allComplete = oldPassword.length > 0 && newPassword.length >= 8 && newPassword === confirmPassword;

  const handleConfirm = () => {
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    changePasswordMutation.mutate();
  };

  return (
    <>
      <div className="border border-border rounded-xl overflow-hidden mt-2 shadow-sm">
        <div className="p-6 bg-card flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <h3 className="text-lg font-semibold text-foreground tracking-tight">
              Change Password
            </h3>
            <p className="text-sm text-muted-foreground">
              Update your password to keep your account secure. Ensure your new password is at least 8 characters long.
            </p>
          </div>
        </div>

        <div className="p-4 bg-muted/20 border-t border-border flex items-center justify-end">
          <Button variant="outline" onClick={() => setOpen(true)}>
            Change Password
          </Button>
        </div>
      </div>

      <DangerConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Change Password"
        description="Please enter your current password, followed by your new password."
        warningMessage="You will remain logged in on this device."
        actionLabel="Change Password"
        cancelLabel="Cancel"
        isLoading={changePasswordMutation.isPending}
        onConfirm={handleConfirm}
        variant="warning"
        isConfirmDisabled={!allComplete}
      >
        <div className="flex flex-col gap-5 pt-2">
          <div className="flex flex-col gap-2.5">
            <label className="text-sm text-foreground/80">Current Password</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="h-10 w-full rounded-md border bg-background dark:bg-black px-3 text-sm text-foreground outline-none transition-all duration-200 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 border-input"
              disabled={changePasswordMutation.isPending}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2.5">
            <label className="text-sm text-foreground/80">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-10 w-full rounded-md border bg-background dark:bg-black px-3 text-sm text-foreground outline-none transition-all duration-200 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 border-input"
              disabled={changePasswordMutation.isPending}
            />
          </div>

          <div className="flex flex-col gap-2.5">
            <label className="text-sm text-foreground/80">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-10 w-full rounded-md border bg-background dark:bg-black px-3 text-sm text-foreground outline-none transition-all duration-200 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 border-input"
              disabled={changePasswordMutation.isPending}
            />
          </div>
        </div>
      </DangerConfirmDialog>
    </>
  );
}
