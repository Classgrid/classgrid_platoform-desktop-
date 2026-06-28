import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { Save, Bell, Palette, Shield } from "lucide-react";
import { apiClient } from "@/lib/apiClient";

import { toast } from "sonner";

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
      toast.success("Settings saved successfully.");
    },
    onError: () => {
      toast.error("Failed to save settings. Please try again.");
    }
  });

  const handlePrefChange = (field: keyof EmailPrefs, value: any) => {
    const newPrefs = { ...prefs, [field]: value };
    setPrefs(newPrefs);
    updatePrefs.mutate(newPrefs);
  };

  const isPending = updatePrefs.isPending;

  return (
    <div className="">
      <SectionPanel
        title="Settings"
        description="Manage your platform preferences, notifications, and appearance."
      />

      {/* Appearance */}
      <div className="">
        <div className="">
          <h2 className=" flex items-center gap-2">
            <Palette size={18} /> Appearance
          </h2>
          <p className="">Customize how Classgrid looks on your device.</p>
        </div>
        
        <div className="">
          <div className="">
            <span className="">Dark Mode</span>
            <span className="">Enable dark theme for the dashboard</span>
          </div>
          <label className="">
            <input
              type="checkbox"
              className=""
              checked={theme === "dark"}
              onChange={(e) => setTheme(e.target.checked ? "dark" : "light")}
            />
            <div className="">
              <div className=""></div>
            </div>
          </label>
        </div>
      </div>

      {/* Notifications */}
      <div className="">
        <div className="">
          <h2 className=" flex items-center gap-2">
            <Bell size={18} /> Notifications
          </h2>
          <p className="">Manage what events trigger email notifications.</p>
        </div>

        {isLoading ? (
          <div className="text-sm text-muted-foreground py-4">Loading preferences...</div>
        ) : (
          <>
            <div className="">
              <div className="">
                <span className="">Global Notifications</span>
                <span className="">Master switch to enable or disable all emails</span>
              </div>
              <label className="">
                <input
                  type="checkbox"
                  className=""
                  checked={prefs.global}
                  onChange={() => handlePrefChange("global", !prefs.global)}
                />
                <div className="">
                  <div className=""></div>
                </div>
              </label>
            </div>

            <div className="" style={{ opacity: prefs.global ? 1 : 0.5, pointerEvents: prefs.global ? "auto" : "none" }}>
              <div className="">
                <span className="">Platform Announcements</span>
                <span className="">Receive emails about major platform updates</span>
              </div>
              <label className="">
                <input
                  type="checkbox"
                  className=""
                  checked={prefs.announcements}
                  onChange={() => handlePrefChange("announcements", !prefs.announcements)}
                />
                <div className="">
                  <div className=""></div>
                </div>
              </label>
            </div>

            <div className="" style={{ opacity: prefs.global ? 1 : 0.5, pointerEvents: prefs.global ? "auto" : "none" }}>
              <div className="">
                <span className="">Join Approvals</span>
                <span className="">Get notified when new organizations sign up</span>
              </div>
              <label className="">
                <input
                  type="checkbox"
                  className=""
                  checked={prefs.joinApproval}
                  onChange={() => handlePrefChange("joinApproval", !prefs.joinApproval)}
                />
                <div className="">
                  <div className=""></div>
                </div>
              </label>
            </div>
          </>
        )}
      </div>

      {/* Removed sticky banner, using react-hot-toast instead */}
    </div>
  );
}
