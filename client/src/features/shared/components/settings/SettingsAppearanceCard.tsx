import React from "react";
import { Palette } from "lucide-react";
import { useTheme } from "next-themes";
import { CgSwitch } from "@/components/classgrid/CgSwitch";

export function SettingsAppearanceCard() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="cg-settings-card">
      <div className="cg-settings-card-header">
        <h2 className="cg-settings-card-title flex items-center gap-2">
          <Palette size={18} className="text-foreground" /> Appearance
        </h2>
        <p className="cg-settings-card-description">Customize how Classgrid looks on your device.</p>
      </div>
      
      <div className="cg-settings-row">
        <div className="cg-settings-row-info">
          <span className="cg-settings-row-title">Dark Mode</span>
          <span className="cg-settings-row-desc">Enable dark theme for the dashboard</span>
        </div>
        <CgSwitch 
          checked={theme === "dark"} 
          onChange={(checked) => setTheme(checked ? "dark" : "light")} 
        />
      </div>
    </div>
  );
}
