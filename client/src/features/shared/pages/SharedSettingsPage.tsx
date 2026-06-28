import React, { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/marketing_ui/button";
import { SettingsAppearanceCard } from "../components/settings/SettingsAppearanceCard";
import { SettingsNotificationsCard } from "../components/settings/SettingsNotificationsCard";
import { SettingsPushCard } from "../components/settings/SettingsPushCard";
import { useEmailPreferences, useUpdateEmailPreferences, EmailPrefs } from "../queries/useSettingsQueries";
import { useUserProfile, useUpdateProfile } from "../queries/useUserProfile";
import { CustomDomainCard } from "../../org/components/settings/CustomDomainCard";
import { OrgBrandingCard } from "@/components/dashboard/OrgBrandingCard";
import { Skeleton } from "@/components/marketing_ui/skeleton";

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

  if (isProfileLoading || isPrefLoading) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pb-12 animate-in fade-in duration-500">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-48 rounded-md" />
            <Skeleton className="h-4 w-72 rounded-md" />
          </div>
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
        
        {/* Cards Skeletons */}
        <div className="flex flex-col gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6 flex flex-col gap-6">
              <div className="flex flex-col gap-2 border-b border-border pb-4">
                <Skeleton className="h-6 w-40 rounded-md" />
                <Skeleton className="h-3 w-64 rounded-md" />
              </div>
              <div className="flex flex-col sm:flex-row gap-6">
                <Skeleton className="h-24 w-full sm:w-1/2 rounded-xl" />
                <Skeleton className="h-24 w-full sm:w-1/2 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-6 w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pb-12" onSubmit={handleSave} noValidate>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your platform preferences, notifications, and appearance.</p>
        </div>
        <div>
          <Button type="submit" disabled={isPending}>
            <Save size={14} className="mr-2" /> Save Settings
          </Button>
        </div>
      </div>

      <SettingsAppearanceCard />
      
      {profileData?.role !== "org_admin" && (
        <SettingsNotificationsCard 
          prefs={prefs} 
          onChange={handlePrefChange} 
          isLoading={isPrefLoading} 
        />
      )}
      
      {!isProfileLoading && (
        <SettingsPushCard 
          pushEnabled={pushEnabled} 
          onChange={setPushEnabled} 
        />
      )}

      {profileData?.role === "org_admin" && (
        <>
          <OrgBrandingCard />
          <CustomDomainCard />
        </>
      )}

    </form>
  );
}
