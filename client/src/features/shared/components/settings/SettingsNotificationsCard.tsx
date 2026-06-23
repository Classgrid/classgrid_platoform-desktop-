import React from "react";
import { Bell } from "lucide-react";
import { CgSwitch } from "@/components/classgrid/Switch";
import { CgSelect } from "@/components/classgrid/Select";
import { EmailPrefs } from "../../queries/useSettingsQueries";

type SettingsNotificationsCardProps = {
  prefs: EmailPrefs;
  onChange: (field: keyof EmailPrefs, value: any) => void;
  isLoading: boolean;
};

export function SettingsNotificationsCard({ prefs, onChange, isLoading }: SettingsNotificationsCardProps) {
  if (isLoading) {
    return (
      <div className="cg-settings-card">
        <div className="cg-settings-card-header">
          <h2 className="cg-settings-card-title flex items-center gap-2">
            <Bell size={18} /> Notifications
          </h2>
        </div>
        <div className="py-4 text-sm text-muted-foreground animate-pulse">Loading preferences...</div>
      </div>
    );
  }

  return (
    <div className="cg-settings-card">
      <div className="cg-settings-card-header">
        <h2 className="cg-settings-card-title flex items-center gap-2">
          <Bell size={18} className="text-foreground" /> Email Notifications
        </h2>
        <p className="cg-settings-card-description">Manage what events trigger email notifications.</p>
      </div>

      <div className="cg-settings-row">
        <div className="cg-settings-row-info">
          <span className="cg-settings-row-title">Global Notifications</span>
          <span className="cg-settings-row-desc">Master switch to enable or disable all emails</span>
        </div>
        <CgSwitch 
          checked={prefs.global} 
          onCheckedChange={(c) => onChange("global", c)} 
        />
      </div>

      <div className="flex flex-col gap-2 mt-2" style={{ opacity: prefs.global ? 1 : 0.5, pointerEvents: prefs.global ? "auto" : "none" }}>
        <div className="cg-settings-row py-3">
          <div className="cg-settings-row-info">
            <span className="cg-settings-row-title">Platform Announcements</span>
            <span className="cg-settings-row-desc">Receive emails about major platform updates</span>
          </div>
          <CgSwitch checked={prefs.announcements} onCheckedChange={(c) => onChange("announcements", c)} />
        </div>

        <div className="cg-settings-row py-3 border-t border-border/50">
          <div className="cg-settings-row-info">
            <span className="cg-settings-row-title">Notes & Material</span>
            <span className="cg-settings-row-desc">Get notified when new study material is posted</span>
          </div>
          <CgSwitch checked={prefs.notes} onCheckedChange={(c) => onChange("notes", c)} />
        </div>

        <div className="cg-settings-row py-3 border-t border-border/50">
          <div className="cg-settings-row-info">
            <span className="cg-settings-row-title">Quizzes & Assignments</span>
            <span className="cg-settings-row-desc">Get notified about new tests</span>
          </div>
          <CgSwitch checked={prefs.quizzes} onCheckedChange={(c) => onChange("quizzes", c)} />
        </div>

        <div className="cg-settings-row py-3 border-t border-border/50">
          <div className="cg-settings-row-info">
            <span className="cg-settings-row-title">Join Approvals</span>
            <span className="cg-settings-row-desc">Updates when users request to join your class</span>
          </div>
          <CgSwitch checked={prefs.joinApproval} onCheckedChange={(c) => onChange("joinApproval", c)} />
        </div>

        <div className="cg-settings-row py-3 border-t border-border/50">
          <div className="cg-settings-row-info">
            <span className="cg-settings-row-title">Email on Post</span>
            <span className="cg-settings-row-desc">Receive an email when you make a post</span>
          </div>
          <CgSwitch checked={prefs.emailOnPost} onCheckedChange={(c) => onChange("emailOnPost", c)} />
        </div>

        <div className="cg-settings-row py-3 border-t border-border/50">
          <div className="cg-settings-row-info">
            <span className="cg-settings-row-title">Email Digest Mode</span>
            <span className="cg-settings-row-desc">How often should we send non-urgent emails?</span>
          </div>
          <div className="w-[180px]">
            <CgSelect 
              value={prefs.digestMode} 
              onValueChange={(v: any) => onChange("digestMode", v)}
              placeholder="Select mode"
              options={[
                { label: "Instant", value: "instant" },
                { label: "Daily Digest", value: "daily" },
                { label: "Weekly Digest", value: "weekly" }
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
