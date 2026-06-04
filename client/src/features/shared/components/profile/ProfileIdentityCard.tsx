import React, { useRef } from "react";
import { Camera, Mail, Globe, Activity } from "lucide-react";
import { CgAvatar } from "@/components/classgrid/Avatar";
import { CgBadge } from "@/components/classgrid/Badge";
import { ProfileData } from "../../queries/useUserProfile";

type ProfileIdentityCardProps = {
  form: ProfileData;
  onPhotoUpload: (base64: string) => void;
};

export function ProfileIdentityCard({ form, onPhotoUpload }: ProfileIdentityCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 600 * 1024) {
      alert("Profile photo must be under 600KB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      onPhotoUpload(base64);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="cg-profile-id-card">
      <div className="cg-profile-banner"></div>
      <div className="cg-profile-id-body flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
        <div className="cg-profile-avatar-anchor">
          <CgAvatar name={form.name} src={form.profilePicture || form.photoURL} size="lg" className="cg-profile-avatar-large" />
          <div className="cg-profile-avatar-upload-btn" onClick={() => fileInputRef.current?.click()}>
            <Camera size={18} />
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
        </div>
        <div className="cg-profile-id-info">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-4">
            <h1 className="cg-profile-primary-name">{form.name}</h1>
            <CgBadge variant="info" className="h-6 px-3 text-[10px] font-bold tracking-widest mb-2 md:mb-1">
              {form.role.replace("platform_", "").toUpperCase()}
            </CgBadge>
          </div>
          <div className="cg-profile-id-meta justify-center md:justify-start">
            <span className="flex items-center gap-1.5"><Mail size={14} /> {form.email}</span>
            <span className="flex items-center gap-1.5">
              <Globe size={14} /> {form.organization_id?.name || "Classgrid Cloud"}
            </span>
            <span className="flex items-center gap-1.5 text-success"><Activity size={14} /> Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
