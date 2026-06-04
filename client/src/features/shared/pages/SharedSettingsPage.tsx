import React, { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { CgPageHeader } from "@/components/classgrid/PageHeader";
import { CgButton } from "@/components/classgrid/Button";
import { SettingsAppearanceCard } from "../components/settings/SettingsAppearanceCard";
import { SettingsNotificationsCard } from "../components/settings/SettingsNotificationsCard";
import { SettingsPushCard } from "../components/settings/SettingsPushCard";
import { useEmailPreferences, useUpdateEmailPreferences, EmailPrefs } from "../queries/useSettingsQueries";
import { useUserProfile, useUpdateProfile } from "../queries/useUserProfile";

export function SharedSettingsPage() {
  const { data: prefData, isLoading: isPrefLoading } = useEmailPreferences();
  const updatePrefs = useUpdateEmailPreferences();
  
  const { data: profileData, isLoading: isProfileLoading } = useUserProfile();
  const updateProfile = useUpdateProfile();

  const [prefs, setPrefs] = useState<EmailPrefs>({
    global: true,
    announcements: true,
    notes: true,
    quizzes: true,
    joinApproval: true,
    emailOnPost: true,
    digestMode: "instant",
  });

  const [pushEnabled, setPushEnabled] = useState(true);

  useEffect(() => {
    if (prefData) {
      setPrefs((prev) => ({ ...prev, ...prefData }));
    }
  }, [prefData]);

  useEffect(() => {
    if (profileData?.pushNotifications) {
      setPushEnabled(profileData.pushNotifications.global ?? true);
    }
  }, [profileData]);

  const handlePrefChange = (field: keyof EmailPrefs, value: any) => {
    setPrefs((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updatePrefs.mutate(prefs);
    
    // Push notifications are saved on the user profile object
    if (profileData && profileData.pushNotifications?.global !== pushEnabled) {
      updateProfile.mutate({ pushNotifications: { global: pushEnabled } });
    }
  };

  const isPending = updatePrefs.isPending || updateProfile.isPending;

  return (
    <form className="cg-settings-page pb-12" onSubmit={handleSave} noValidate>
      <CgPageHeader
        title="Settings"
        description="Manage your platform preferences, notifications, and appearance."
        actions={
          <CgButton type="submit" isLoading={isPending}>
            <Save size={14} className="mr-2" /> Save Settings
          </CgButton>
        }
      />

      <SettingsAppearanceCard />
      
      <SettingsNotificationsCard 
        prefs={prefs} 
        onChange={handlePrefChange} 
        isLoading={isPrefLoading} 
      />
      
      {!isProfileLoading && (
        <SettingsPushCard 
          pushEnabled={pushEnabled} 
          onChange={setPushEnabled} 
        />
      )}

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
