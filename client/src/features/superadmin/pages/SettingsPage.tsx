import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { Save, Bell, Palette, Shield } from "lucide-react";
import { apiClient } from "@/lib/apiClient";

import { toast } from "sonner";

import { Button } from "@/components/marketing_ui/button";
import { SectionPanel } from "@/components/marketing_ui/SectionPanel";
import { Switch } from "@/components/marketing_ui/switch";

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
    <div >
      <SectionPanel
        title="Settings"
        description="Manage your platform preferences, notifications, and appearance."
      />

      {/* Appearance */}
      <div >
        <div >
          <h2 className=" flex items-center gap-2">
            <Palette size={18} /> Appearance
          </h2>
          <p >Customize how Classgrid looks on your device.</p>
        </div>
        
        <div >
          <div >
            <span >Dark Mode</span>
            <span >Enable dark theme for the dashboard</span>
          </div>
          <label >
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          </label>
        </div>
      </div>

      {/* Notifications */}
      <div >
        <div >
          <h2 className=" flex items-center gap-2">
            <Bell size={18} /> Notifications
          </h2>
          <p >Manage what events trigger email notifications.</p>
        </div>

        {isLoading ? (
          <div className="text-sm text-muted-foreground py-4">Loading preferences...</div>
        ) : (
          <>
            <div >
              <div >
                <span >Global Notifications</span>
                <span >Master switch to enable or disable all emails</span>
              </div>
              <label >
                <Switch
                  checked={prefs.global}
                  onCheckedChange={(checked) => handlePrefChange("global", checked)}
                />
              </label>
            </div>

            <div  >
              <div >
                <span >Platform Announcements</span>
                <span >Receive emails about major platform updates</span>
              </div>
              <label >
                <Switch
                  checked={prefs.announcements}
                  onCheckedChange={(checked) => handlePrefChange("announcements", checked)}
                />
              </label>
            </div>

            <div  >
              <div >
                <span >Join Approvals</span>
                <span >Get notified when new organizations sign up</span>
              </div>
              <label >
                <Switch
                  checked={prefs.joinApproval}
                  onCheckedChange={(checked) => handlePrefChange("joinApproval", checked)}
                />
              </label>
            </div>
          </>
        )}
      </div>

      {/* Removed sticky banner, using react-hot-toast instead */}
    </div>
  );
}
