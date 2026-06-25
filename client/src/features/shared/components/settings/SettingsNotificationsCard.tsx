import React from "react";
import { Bell } from "lucide-react";
import { Switch } from "@/components/marketing_ui/switch";

import { EmailPrefs } from "../../queries/useSettingsQueries";

type SettingsNotificationsCardProps = {
  prefs: EmailPrefs;
  onChange: (field: keyof EmailPrefs, value: any) => void;
  isLoading: boolean;
};

export function SettingsNotificationsCard({ prefs, onChange, isLoading }: SettingsNotificationsCardProps) {
  if (isLoading) {
    return (
    <div className="bg-card border border-border rounded-xl shadow-sm mb-6">
      <div className="p-5 border-b border-border">
        <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
          <Bell size={18} /> Notifications
        </h2>
      </div>
      <div className="py-4 px-5 text-sm text-muted-foreground animate-pulse">Loading preferences...</div>
    </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm mb-6">
      <div className="p-5 border-b border-border">
        <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
          <Bell size={18} className="text-foreground" /> Email Notifications
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Manage what events trigger email notifications.</p>
      </div>

      <div className="flex items-center justify-between p-5 border-b border-border/50">
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-sm text-foreground">Global Notifications</span>
          <span className="text-xs text-muted-foreground">Master switch to enable or disable all emails</span>
        </div>
        <Switch 
          checked={prefs.global} 
          onCheckedChange={(c) => onChange("global", c)} 
        />
      </div>

      <div className="flex flex-col" style={{ opacity: prefs.global ? 1 : 0.5, pointerEvents: prefs.global ? "auto" : "none" }}>
        <div className="flex items-center justify-between p-5">
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-sm text-foreground">Platform Announcements</span>
            <span className="text-xs text-muted-foreground">Receive emails about major platform updates</span>
          </div>
          <Switch checked={prefs.announcements} onCheckedChange={(c) => onChange("announcements", c)} />
        </div>

        <div className="flex items-center justify-between p-5 border-t border-border/50">
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-sm text-foreground">Notes & Material</span>
            <span className="text-xs text-muted-foreground">Get notified when new study material is posted</span>
          </div>
          <Switch checked={prefs.notes} onCheckedChange={(c) => onChange("notes", c)} />
        </div>

        <div className="flex items-center justify-between p-5 border-t border-border/50">
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-sm text-foreground">Quizzes & Assignments</span>
            <span className="text-xs text-muted-foreground">Get notified about new tests</span>
          </div>
          <Switch checked={prefs.quizzes} onCheckedChange={(c) => onChange("quizzes", c)} />
        </div>

        <div className="flex items-center justify-between p-5 border-t border-border/50">
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-sm text-foreground">Join Approvals</span>
            <span className="text-xs text-muted-foreground">Updates when users request to join your class</span>
          </div>
          <Switch checked={prefs.joinApproval} onCheckedChange={(c) => onChange("joinApproval", c)} />
        </div>

        <div className="flex items-center justify-between p-5 border-t border-border/50">
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-sm text-foreground">Email on Post</span>
            <span className="text-xs text-muted-foreground">Receive an email when you make a post</span>
          </div>
          <Switch checked={prefs.emailOnPost} onCheckedChange={(c) => onChange("emailOnPost", c)} />
        </div>

        <div className="flex items-center justify-between p-5 border-t border-border/50">
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-sm text-foreground">Email Digest Mode</span>
            <span className="text-xs text-muted-foreground">How often should we send non-urgent emails?</span>
          </div>
          <div className="w-[180px]">
            <select
              className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={prefs.digestMode}
              onChange={(e) => onChange("digestMode", e.target.value)}
            >
              <option value="instant">Instant</option>
              <option value="daily">Daily Digest</option>
              <option value="weekly">Weekly Digest</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
