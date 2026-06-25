import React from "react";
import { Smartphone } from "lucide-react";
import { Switch } from "@/components/marketing_ui/switch";

type SettingsPushCardProps = {
  pushEnabled: boolean;
  onChange: (enabled: boolean) => void;
};

export function SettingsPushCard({ pushEnabled, onChange }: SettingsPushCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm mb-6">
      <div className="p-5 border-b border-border">
        <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
          <Smartphone size={18} className="text-foreground" /> Push Notifications
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Manage push alerts delivered to your devices.</p>
      </div>

      <div className="flex items-center justify-between p-5">
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-sm text-foreground">Enable Push Alerts</span>
          <span className="text-xs text-muted-foreground">Receive real-time system notifications</span>
        </div>
        <Switch checked={pushEnabled} onCheckedChange={onChange} />
      </div>
    </div>
  );
}
