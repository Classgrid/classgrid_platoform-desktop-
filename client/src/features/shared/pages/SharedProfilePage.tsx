import React, { useState, useEffect } from "react";
import { Loader } from "lucide-react";
import { CgButton } from "@/components/classgrid/Button";
import { useUserProfile, useUpdateProfile, ProfileData } from "../queries/useUserProfile";
import { ProfileIdentityCard } from "../components/profile/ProfileIdentityCard";

export function SharedProfilePage() {
  const { data: profileData, isLoading } = useUserProfile();
  const updateProfile = useUpdateProfile();

  const [form, setForm] = useState<ProfileData | null>(null);

  useEffect(() => {
    if (profileData) {
      setForm(profileData);
    }
  }, [profileData]);

  const handlePhotoUpload = (base64: string) => {
    setForm(prev => prev ? { ...prev, profilePicture: base64 } : null);
    updateProfile.mutate({ profilePicture: base64 });
  };

  if (isLoading || !form) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader size={36} className="animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Loading profile data...</p>
      </div>
    );
  }

  return (
    <div className="cg-page max-w-4xl mx-auto">
      <header className="cg-page__header">
        <div>
          <p className="text-sm font-medium text-muted-foreground">My Account</p>
          <h1 className="text-2xl font-bold tracking-tight">Global Profile</h1>
        </div>
      </header>

      <div className="mt-6">
        <ProfileIdentityCard form={form} onPhotoUpload={handlePhotoUpload} />
      </div>
    </div>
  );
}
