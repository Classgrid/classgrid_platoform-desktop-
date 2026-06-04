import React, { useState, useEffect } from "react";
import { Loader } from "lucide-react";
import { CgButton } from "@/components/classgrid/Button";
import { useUserProfile, useUpdateProfile, ProfileData } from "../queries/useUserProfile";
import { ProfileIdentityCard } from "../components/profile/ProfileIdentityCard";
import { ProfileBasicInfoCard } from "../components/profile/ProfileBasicInfoCard";
import { ProfileAcademicCard } from "../components/profile/ProfileAcademicCard";
import { ProfileOrganizationCard } from "../components/profile/ProfileOrganizationCard";
import { ProfileSecurityCard } from "../components/profile/ProfileSecurityCard";
import { ProfileAccountIntelligence } from "../components/profile/ProfileAccountIntelligence";
import { ProfileStudentExtendedTabs } from "../components/profile/ProfileStudentExtendedTabs";

export function SharedProfilePage() {
  const { data: profileData, isLoading, refetch } = useUserProfile();
  const updateProfile = useUpdateProfile();

  const [isDirty, setIsDirty] = useState(false);
  const [form, setForm] = useState<ProfileData | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (profileData) {
      setForm(profileData);
    }
  }, [profileData]);

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    if (!form) return;
    setForm(prev => prev ? { ...prev, [field]: value } : null);
    setIsDirty(true);
    if (errors[field]) {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[field];
        return newErrs;
      });
    }
  };

  const handlePhotoUpload = (base64: string) => {
    handleInputChange("profilePicture", base64);
    updateProfile.mutate({ profilePicture: base64 });
  };

  const handleSave = () => {
    if (!form) return;

    if (!form.name || !form.name.trim()) {
      setErrors({ name: "Name is required" });
      return;
    }

    const updates = {
      name: form.name,
      phoneNumber: form.phoneNumber,
      alternateEmail: form.alternateEmail,
      dob: form.dob,
      gender: form.gender,
      address: form.address,
      prn: form.prn,
      branch: form.branch,
      batch: form.batch,
      department: form.department,
      qualification: form.qualification,
    };

    updateProfile.mutate(updates, {
      onSuccess: () => {
        setIsDirty(false);
      }
    });
  };

  const handleReset = () => {
    setIsDirty(false);
    setErrors({});
    if (profileData) setForm(profileData);
  };

  if (isLoading || !form) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader size={36} className="animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Loading profile data...</p>
      </div>
    );
  }

  const isStudent = form.role === "student";

  return (
    <div className="cg-profile-container">
      <ProfileIdentityCard form={form} onPhotoUpload={handlePhotoUpload} />

      <div className="cg-profile-bento">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          <ProfileBasicInfoCard form={form} onChange={handleInputChange} errors={errors} />
          {isStudent && <ProfileAcademicCard form={form} onChange={handleInputChange} originalData={profileData} />}
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          <ProfileOrganizationCard org={form.organization_id} />
          {!isStudent && <ProfileAcademicCard form={form} onChange={handleInputChange} originalData={profileData} />}
          <ProfileSecurityCard />
        </div>

        {/* Full Width */}
        <div className="cg-card-full">
          <ProfileAccountIntelligence form={form} />
        </div>
      </div>

      {isStudent && <ProfileStudentExtendedTabs />}

      {/* Sticky Save Bar */}
      {isDirty && (
        <div className="cg-sticky-save-bar">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-bold text-foreground">Unsaved changes detected</p>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Profile out of sync</p>
          </div>
          <div className="flex gap-4">
            <CgButton
              variant="ghost"
              className="hover:bg-danger/10 hover:text-danger transition-colors"
              onClick={handleReset}
              disabled={updateProfile.isPending}
            >
              Reset
            </CgButton>
            <CgButton
              className="shadow-lg shadow-primary/20"
              onClick={handleSave}
              isLoading={updateProfile.isPending}
            >
              Push Updates
            </CgButton>
          </div>
        </div>
      )}
    </div>
  );
}
