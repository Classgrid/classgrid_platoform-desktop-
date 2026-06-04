import React from "react";
import { Activity, CheckCircle2 } from "lucide-react";
import { ProfileData } from "../../queries/useUserProfile";

type ProfileAccountIntelligenceProps = {
  form: ProfileData;
};

export function ProfileAccountIntelligence({ form }: ProfileAccountIntelligenceProps) {
  return (
    <div className="cg-bento-card">
      <div className="cg-bento-header">
        <h3 className="cg-bento-title"><Activity size={18} /> Account Intelligence</h3>
        <p className="cg-bento-desc">Summary of your session and registration data.</p>
      </div>
      <div className="cg-stats-grid">
        <div className="cg-stat-box">
          <span className="cg-stat-label">Last Successful Login</span>
          <span className="cg-stat-value text-foreground">
            {form.lastLoginAt ? new Date(form.lastLoginAt).toLocaleString() : "First Login"}
          </span>
        </div>
        <div className="cg-stat-box">
          <span className="cg-stat-label">Member Since</span>
          <span className="cg-stat-value text-foreground">
            {form.createdAt ? new Date(form.createdAt).toLocaleDateString() : "N/A"}
          </span>
        </div>
        <div className="cg-stat-box">
          <span className="cg-stat-label">Active Presence</span>
          <span className="cg-stat-value text-success flex items-center gap-2">
            <CheckCircle2 size={16} /> 1 Session
          </span>
        </div>
      </div>
    </div>
  );
}
