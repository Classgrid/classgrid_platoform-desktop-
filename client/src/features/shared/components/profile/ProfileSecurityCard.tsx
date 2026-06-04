import React, { useState } from "react";
import { Shield, Lock, Smartphone, ChevronRight } from "lucide-react";
import { CgButton } from "@/components/classgrid/Button";
import { ChangePasswordDialog } from "../ChangePasswordDialog";

export function ProfileSecurityCard() {
  const [passwordOpen, setPasswordOpen] = useState(false);

  return (
    <>
      <div className="cg-bento-card">
        <div className="cg-bento-header">
          <h3 className="cg-bento-title"><Shield size={18} /> Security Guard</h3>
          <p className="cg-bento-desc">Manage account access and 2FA.</p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="cg-action-card">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl"><Lock size={20} className="text-primary" /></div>
              <div>
                <p className="text-sm font-bold text-foreground">Credential Vault</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Update Password</p>
              </div>
            </div>
            <CgButton variant="outline" size="sm" className="h-8 rounded-lg px-4" onClick={() => setPasswordOpen(true)}>
              Manage <ChevronRight size={14} className="ml-1" />
            </CgButton>
          </div>
          
          <div className="cg-action-card">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-warning/10 rounded-xl"><Smartphone size={20} className="text-warning" /></div>
              <div>
                <p className="text-sm font-bold text-foreground">Device 2FA</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Auto Enabled</p>
              </div>
            </div>
            <div className="text-xs font-medium text-success px-2 py-1 bg-success/10 rounded border border-success/20">
              Active
            </div>
          </div>
        </div>
      </div>

      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </>
  );
}
