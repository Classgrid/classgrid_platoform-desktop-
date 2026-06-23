import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { Save, Bell, Palette, Shield } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { CgPageHeader } from "@/components/classgrid/PageHeader";
import { Button } from "@/components/marketing_ui/button";
import { SectionPanel } from "@/components/marketing_ui/SectionPanel";
import "../styles/settings.css";

type EmailPrefs = {
  global: boolean;
  announcements: boolean;
  notes: boolean;
  quizzes: boolean;
  joinApproval: boolean;
  emailOnPost: boolean;
  digestMode: "instant" | "daily" | "weekly";
};

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();

  const [prefs, setPrefs] = useState<EmailPrefs>({
    global: true,
    announcements: true,
    notes: true,
    quizzes: true,
    joinApproval: true,
    emailOnPost: true,
    digestMode: "instant",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["superadmin-settings"],
    queryFn: () => apiClient.get("/api/user/email-preferences").then((r) => r.data),
  });

  useEffect(() => {
    if (data?.emailNotifications) {
      setPrefs((prev) => ({ ...prev, ...data.emailNotifications }));
    }
  }, [data]);

  const updatePrefs = useMutation({
    mutationFn: (newPrefs: EmailPrefs) => apiClient.put("/api/user/email-preferences", newPrefs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-settings"] });
    },
  });

  const handleToggle = (key: keyof EmailPrefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updatePrefs.mutate(prefs);
  };

  return (
    <form className="cg-settings-page" onSubmit={handleSave} noValidate>
      <CgPageHeader
        title="Settings"
        description="Manage your platform preferences, notifications, and appearance."
        actions={
          <Button type="submit" isLoading={updatePrefs.isPending}>
            <Save size={14} /> Save Settings
          </Button>
        }
      />

      {/* Appearance */}
      <div className="cg-settings-card">
        <div className="cg-settings-card-header">
          <h2 className="cg-settings-card-title flex items-center gap-2">
            <Palette size={18} /> Appearance
          </h2>
          <p className="cg-settings-card-description">Customize how Classgrid looks on your device.</p>
        </div>
        
        <div className="cg-settings-row">
          <div className="cg-settings-row-info">
            <span className="cg-settings-row-title">Dark Mode</span>
            <span className="cg-settings-row-desc">Enable dark theme for the dashboard</span>
          </div>
          <label className="cg-switch-container">
            <input
              type="checkbox"
              className="cg-switch-input"
              checked={theme === "dark"}
              onChange={(e) => setTheme(e.target.checked ? "dark" : "light")}
            />
            <div className="cg-switch-track">
              <div className="cg-switch-thumb"></div>
            </div>
          </label>
        </div>
      </div>

      {/* Notifications */}
      <div className="cg-settings-card">
        <div className="cg-settings-card-header">
          <h2 className="cg-settings-card-title flex items-center gap-2">
            <Bell size={18} /> Notifications
          </h2>
          <p className="cg-settings-card-description">Manage what events trigger email notifications.</p>
        </div>

        {isLoading ? (
          <div className="text-sm text-muted-foreground py-4">Loading preferences...</div>
        ) : (
          <>
            <div className="cg-settings-row">
              <div className="cg-settings-row-info">
                <span className="cg-settings-row-title">Global Notifications</span>
                <span className="cg-settings-row-desc">Master switch to enable or disable all emails</span>
              </div>
              <label className="cg-switch-container">
                <input
                  type="checkbox"
                  className="cg-switch-input"
                  checked={prefs.global}
                  onChange={() => handleToggle("global")}
                />
                <div className="cg-switch-track">
                  <div className="cg-switch-thumb"></div>
                </div>
              </label>
            </div>

            <div className="cg-settings-row" style={{ opacity: prefs.global ? 1 : 0.5, pointerEvents: prefs.global ? "auto" : "none" }}>
              <div className="cg-settings-row-info">
                <span className="cg-settings-row-title">Platform Announcements</span>
                <span className="cg-settings-row-desc">Receive emails about major platform updates</span>
              </div>
              <label className="cg-switch-container">
                <input
                  type="checkbox"
                  className="cg-switch-input"
                  checked={prefs.announcements}
                  onChange={() => handleToggle("announcements")}
                />
                <div className="cg-switch-track">
                  <div className="cg-switch-thumb"></div>
                </div>
              </label>
            </div>

            <div className="cg-settings-row" style={{ opacity: prefs.global ? 1 : 0.5, pointerEvents: prefs.global ? "auto" : "none" }}>
              <div className="cg-settings-row-info">
                <span className="cg-settings-row-title">Join Approvals</span>
                <span className="cg-settings-row-desc">Get notified when new organizations sign up</span>
              </div>
              <label className="cg-switch-container">
                <input
                  type="checkbox"
                  className="cg-switch-input"
                  checked={prefs.joinApproval}
                  onChange={() => handleToggle("joinApproval")}
                />
                <div className="cg-switch-track">
                  <div className="cg-switch-thumb"></div>
                </div>
              </label>
            </div>
          </>
        )}
      </div>

      {updatePrefs.isSuccess && (
        <div className="p-3 bg-success/10 text-success text-sm rounded-md border border-success">
          Settings saved successfully.
        </div>
      )}
      {updatePrefs.isError && (
        <div className="p-3 bg-danger/10 text-danger text-sm rounded-md border border-danger">
          Failed to save settings. Please try again.
        </div>
      )}
    </form>
  );
}
