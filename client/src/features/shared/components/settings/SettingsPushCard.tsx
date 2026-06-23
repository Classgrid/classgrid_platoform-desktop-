import React from "react";
import { Smartphone } from "lucide-react";
import { CgSwitch } from "@/components/classgrid/Switch";

type SettingsPushCardProps = {
  pushEnabled: boolean;
  onChange: (enabled: boolean) => void;
};

export function SettingsPushCard({ pushEnabled, onChange }: SettingsPushCardProps) {
  return (
    <div className="cg-settings-card">
      <div className="cg-settings-card-header">
        <h2 className="cg-settings-card-title flex items-center gap-2">
          <Smartphone size={18} className="text-foreground" /> Push Notifications
        </h2>
        <p className="cg-settings-card-description">Manage push alerts delivered to your devices.</p>
      </div>

      <div className="cg-settings-row">
        <div className="cg-settings-row-info">
          <span className="cg-settings-row-title">Enable Push Alerts</span>
          <span className="cg-settings-row-desc">Receive real-time system notifications</span>
        </div>
        <CgSwitch checked={pushEnabled} onCheckedChange={onChange} />
      </div>
    </div>
  );
}
