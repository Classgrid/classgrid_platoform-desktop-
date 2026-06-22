import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { 
  Save, Shield, Camera, Loader, Mail, Phone, 
  Lock, Smartphone, Globe, Calendar, Clock,
  Palette, Activity, CheckCircle2, ShieldAlert,
  User as UserIcon, ChevronRight
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { CgButton } from "@/components/classgrid/Button";
import { CgAvatar } from "@/components/classgrid/Avatar";
import { CgBadge } from "@/components/classgrid/Badge";
import { Input } from "@/components/shadcn/input";
import { ImageCropperModal } from "@/components/ui/ImageCropperModal";
import { toast } from "react-hot-toast";
import "../styles/profile.css";

type ProfileData = {
  name: string;
  phoneNumber: string;
  email: string;
  role: string;
  profilePicture: string;
  profileBanner?: string;
  lastLoginAt?: string;
  createdAt?: string;
};

type EmailPrefs = {
  global: boolean;
  announcements: boolean;
};

export function ProfilePage() {
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [isDirty, setIsDirty] = useState(false);
  const [form, setForm] = useState<ProfileData>({
    name: "", phoneNumber: "", email: "", role: "", profilePicture: "", profileBanner: ""
  });
  const [prefs, setPrefs] = useState<EmailPrefs>({ global: true, announcements: true });
  const [errors, setErrors] = useState<{ name?: string }>({});

  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState("");
  const [cropType, setCropType] = useState<"avatar" | "banner">("avatar");

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["superadmin-profile"],
    queryFn: () => apiClient.get("/api/user/profile").then((r) => r.data),
  });

  const { data: prefsData, isLoading: prefsLoading } = useQuery({
    queryKey: ["superadmin-settings"],
    queryFn: () => apiClient.get("/api/user/email-preferences").then((r) => r.data),
  });

  useEffect(() => {
    if (profileData?.user) {
      setForm({
        name: profileData.user.name || "",
        phoneNumber: profileData.user.phoneNumber || "",
        email: profileData.user.email || "",
        role: profileData.user.role || "",
        profilePicture: profileData.user.profilePicture || profileData.user.photoURL || "",
        profileBanner: profileData.user.profileBanner || "",
        lastLoginAt: profileData.user.lastLoginAt,
        createdAt: profileData.user.createdAt,
      });
    }
  }, [profileData]);

  useEffect(() => {
    if (prefsData?.emailNotifications) {
      setPrefs({
        global: prefsData.emailNotifications.global ?? true,
        announcements: prefsData.emailNotifications.announcements ?? true,
      });
    }
  }, [prefsData]);

  const updateProfile = useMutation({
    mutationFn: (updates: Partial<ProfileData>) => apiClient.put("/api/user/update", updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-profile"] });
      queryClient.invalidateQueries({ queryKey: ["auth-user"] });
      setIsDirty(false);
    },
  });

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handlePrefToggle = (field: keyof EmailPrefs) => {
    const newPrefs = { ...prefs, [field]: !prefs[field] };
    setPrefs(newPrefs);
  };

  const openCropper = (file: File, type: "avatar" | "banner") => {
    // Strict 5MB limit check
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`Please select an image smaller than 5MB. This file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      setCropSrc(e.target?.result as string);
      setCropType(type);
      setCropOpen(true);
    };
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) openCropper(file, "avatar");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) openCropper(file, "banner");
    if (bannerInputRef.current) bannerInputRef.current.value = "";
  };

  const uploadToR2 = async (blob: Blob, type: "avatar" | "banner") => {
    const loadingToast = toast.loading(`Uploading ${type}...`);
    try {
      const ext = blob.type === "image/png" ? "png" : "jpg";
      const fileName = `${type}-${Date.now()}.${ext}`;
      
      const { data } = await apiClient.post("/api/user/upload-url", {
        fileName,
        fileType: blob.type
      });

      const response = await fetch(data.uploadUrl, {
        method: "PUT",
        body: blob,
        headers: {
          "Content-Type": blob.type
        }
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const updatePayload = type === "avatar" 
        ? { profilePicture: data.publicUrl }
        : { profileBanner: data.publicUrl };

      setForm((prev) => ({ ...prev, ...updatePayload }));
      updateProfile.mutate(updatePayload);
      setCropOpen(false);
      
      toast.success(`${type} updated successfully!`, { id: loadingToast });
    } catch (err) {
      console.error(err);
      toast.error(`Failed to upload ${type}`, { id: loadingToast });
    }
  };

  const handleSave = () => {
    if (!form.name.trim()) { setErrors({ name: "Required" }); return; }
    updateProfile.mutate({ name: form.name, phoneNumber: form.phoneNumber });
    apiClient.put("/api/user/email-preferences", prefs);
  };

  const isLoading = profileLoading || prefsLoading;

  return (
    <div className="cg-profile-container">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader size={36} className="animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Syncing profile data...</p>
        </div>
      ) : (
        <>
          <div className="cg-profile-id-card">
            <div 
              className="cg-profile-banner" 
              style={form.profileBanner ? { backgroundImage: `url(${form.profileBanner})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
            >
              <div className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/70 rounded-full cursor-pointer text-white backdrop-blur-md transition-all z-10" onClick={() => bannerInputRef.current?.click()}>
                <Camera size={16} />
              </div>
              <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={handleBannerUpload} />
            </div>
            <div className="cg-profile-id-body">
              <div className="cg-profile-avatar-anchor">
                <CgAvatar name={form.name} src={form.profilePicture} size="lg" className="cg-profile-avatar-large" />
                <div className="cg-profile-avatar-upload-btn" onClick={() => fileInputRef.current?.click()}>
                  <Camera size={18} />
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
              </div>
              <div className="cg-profile-id-info">
                <div className="flex items-center gap-4">
                  <h1 className="cg-profile-primary-name">{form.name}</h1>
                  <CgBadge variant="info" className="h-6 px-3 text-[10px] font-bold tracking-widest">
                    {form.role.replace("platform_", "").toUpperCase()}
                  </CgBadge>
                </div>
                <div className="cg-profile-id-meta">
                  <span className="flex items-center gap-1.5"><Mail size={14} /> {form.email}</span>
                  <span className="flex items-center gap-1.5"><Globe size={14} /> Classgrid Cloud</span>
                  <span className="flex items-center gap-1.5 text-success"><Activity size={14} /> Current Status: Active</span>
                </div>
              </div>
            </div>
          </div>

          <div className="cg-profile-bento">
            <div className="flex flex-col gap-6">
              <div className="cg-bento-card">
                <div className="cg-bento-header">
                  <h3 className="cg-bento-title"><UserIcon size={18} /> Basic Information</h3>
                  <p className="cg-bento-desc">Standard identification details across the platform.</p>
                </div>
                <div className="flex flex-col gap-6">
                  <div className="cg-field-group">
                    <label className="cg-field-label">Full Display Name</label>
                    <Input value={form.name} onChange={e => handleInputChange("name", e.target.value)} placeholder="Enter name" />
                  </div>
                  <div className="cg-field-group">
                    <label className="cg-field-label">Access Role</label>
                    <div className="p-3 bg-muted/40 rounded-lg border border-dashed border-border text-sm font-semibold opacity-70">
                      {form.role.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="cg-bento-card">
                <div className="cg-bento-header">
                  <h3 className="cg-bento-title"><Palette size={18} /> User Experience</h3>
                  <p className="cg-bento-desc">Manage how you interact with the interface.</p>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="cg-settings-row">
                    <div className="flex flex-col">
                      <span className="cg-settings-label">Dark Theme</span>
                      <span className="cg-settings-hint">Optimize UI for low-light.</span>
                    </div>
                    <label className="cg-switch">
                      <input type="checkbox" checked={theme === "dark"} onChange={e => setTheme(e.target.checked ? "dark" : "light")} />
                      <div className="cg-switch-track"><div className="cg-switch-thumb"></div></div>
                    </label>
                  </div>
                  <div className="cg-settings-row">
                    <div className="flex flex-col">
                      <span className="cg-settings-label">Push Alerts</span>
                      <span className="cg-settings-hint">Real-time system notifications.</span>
                    </div>
                    <label className="cg-switch">
                      <input type="checkbox" checked={prefs.global} onChange={() => handlePrefToggle("global")} />
                      <div className="cg-switch-track"><div className="cg-switch-thumb"></div></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="cg-bento-card">
                <div className="cg-bento-header">
                  <h3 className="cg-bento-title"><Phone size={18} /> Contact & Support</h3>
                  <p className="cg-bento-desc">Verified communication channels.</p>
                </div>
                <div className="flex flex-col gap-6">
                  <div className="cg-field-group">
                    <label className="cg-field-label">Phone Connectivity</label>
                    <Input value={form.phoneNumber} onChange={e => handleInputChange("phoneNumber", e.target.value)} placeholder="+91 " />
                  </div>
                  <div className="cg-field-group">
                    <label className="cg-field-label">Verification Email</label>
                    <div className="flex items-center justify-between p-3 bg-success/5 rounded-lg border border-success/20">
                      <span className="text-sm font-medium">{form.email}</span>
                      <CgBadge variant="success" size="sm" dot>Verified</CgBadge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="cg-bento-card">
                <div className="cg-bento-header">
                  <h3 className="cg-bento-title"><Shield size={18} /> Security Guard</h3>
                  <p className="cg-bento-desc">Manage account access and 2FA.</p>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="cg-action-card">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-primary/10 rounded-xl"><Lock size={20} className="text-primary" /></div>
                      <div>
                        <p className="text-sm font-bold">Credential Vault</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Update Password</p>
                      </div>
                    </div>
                    <CgButton variant="outline" size="sm" className="h-8 rounded-lg px-4">Manage <ChevronRight size={14} /></CgButton>
                  </div>
                  <div className="cg-action-card">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-warning/10 rounded-xl"><Smartphone size={20} className="text-warning" /></div>
                      <div>
                        <p className="text-sm font-bold">Device 2FA</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">MFA Security</p>
                      </div>
                    </div>
                    <CgButton variant="outline" size="sm" className="h-8 rounded-lg px-4">Secure <ChevronRight size={14} /></CgButton>
                  </div>
                </div>
              </div>
            </div>

            <div className="cg-card-full">
              <div className="cg-bento-card">
                <div className="cg-bento-header">
                  <h3 className="cg-bento-title"><Activity size={18} /> Account Intelligence</h3>
                  <p className="cg-bento-desc">Summary of your session and registration data.</p>
                </div>
                <div className="cg-stats-grid">
                  <div className="cg-stat-box">
                    <span className="cg-stat-label">Last Successful Login</span>
                    <span className="cg-stat-value">{form.lastLoginAt ? new Date(form.lastLoginAt).toLocaleString() : "First Login"}</span>
                  </div>
                  <div className="cg-stat-box">
                    <span className="cg-stat-label">Member Since</span>
                    <span className="cg-stat-value">{form.createdAt ? new Date(form.createdAt).toLocaleDateString() : "N/A"}</span>
                  </div>
                  <div className="cg-stat-box">
                    <span className="cg-stat-label">Active Presence</span>
                    <span className="cg-stat-value text-success flex items-center gap-2">
                      <CheckCircle2 size={16} /> 1 Session
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <ImageCropperModal
            isOpen={cropOpen}
            onClose={() => setCropOpen(false)}
            imageSrc={cropSrc}
            aspectRatio={cropType === "avatar" ? 1 : 1584 / 396}
            title={cropType === "avatar" ? "Crop Profile Picture" : "Crop Banner"}
            onCropComplete={(blob) => uploadToR2(blob, cropType)}
          />

          {isDirty && (
            <div className="cg-sticky-save-bar">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-bold">Unsaved changes detected</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Profile out of sync</p>
              </div>
              <div className="flex gap-4">
                <CgButton variant="ghost" className="hover:bg-danger/10 hover:text-danger transition-colors" onClick={() => { setIsDirty(false); queryClient.invalidateQueries({ queryKey: ["superadmin-profile"] }); }}>
                  Reset
                </CgButton>
                <CgButton className="shadow-lg shadow-primary/20" onClick={handleSave} isLoading={updateProfile.isPending}>
                  Push Updates
                </CgButton>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
