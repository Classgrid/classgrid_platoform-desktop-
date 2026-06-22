import React, { useState, useEffect } from "react";
import { Loader } from "lucide-react";
import { CgButton } from "@/components/classgrid/Button";
import { useUserProfile, useUpdateProfile, ProfileData } from "../queries/useUserProfile";
import { ProfileIdentityCard } from "../components/profile/ProfileIdentityCard";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

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
    <div className="cg-page max-w-4xl mx-auto" style={{ paddingTop: "1.5rem" }}>
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">My Account</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Global Profile</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <header className="cg-page__header flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            Global Profile
            {updateProfile.isPending && (
              <Loader size={18} className="animate-spin text-muted-foreground" />
            )}
          </h1>
        </div>
      </header>

      <div className="mt-6">
        <ProfileIdentityCard form={form} onPhotoUpload={handlePhotoUpload} />
      </div>
    </div>
  );
}
