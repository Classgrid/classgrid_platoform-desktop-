import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { CgButton } from "@/components/classgrid/Button";
import { CgFieldGroup } from "@/components/classgrid/CgFieldGroup";
import { Input } from "@/components/marketing_ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/marketing_ui/dialog";
import { useCurrentUser } from "@/features/auth/queries/useCurrentUser";

type ChangePasswordDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const { data: user } = useCurrentUser();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const mustResetPassword = user?.mustResetPassword === true;

  const resetMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post("/api/auth/force-reset-password", { password });
      return data;
    },
    onSuccess: () => {
      setSuccess(true);
      setError("");
      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
        setPassword("");
      }, 2000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Failed to update password");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    resetMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock size={18} className="text-primary" /> Update Password
          </DialogTitle>
          <DialogDescription>
            {mustResetPassword
              ? "You are required to set a new password."
              : "Manage your account security."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {!mustResetPassword ? (
            <div className="p-4 bg-muted/40 rounded-lg border border-border text-sm text-muted-foreground">
              To voluntarily change your password, please sign out and use the <strong>Forgot Password</strong> flow from the login page.
              <br /><br />
              (In-session password changes are only available when forced by an admin or on first login).
            </div>
          ) : success ? (
            <div className="p-4 bg-success/10 text-success rounded-lg border border-success/20 text-sm font-medium text-center">
              Password updated successfully!
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <CgFieldGroup label="New Password" error={error}>
                <Input
                  type="password"
                  placeholder="Enter new password (min 8 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={resetMutation.isPending}
                />
              </CgFieldGroup>
              <DialogFooter className="mt-4">
                <CgButton
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={resetMutation.isPending}
                >
                  Cancel
                </CgButton>
                <CgButton type="submit" isLoading={resetMutation.isPending}>
                  Update Password
                </CgButton>
              </DialogFooter>
            </form>
          )}
        </div>
        
        {!mustResetPassword && (
          <DialogFooter>
            <CgButton type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </CgButton>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
