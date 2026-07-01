import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { X, Save, Shield, Camera, Loader, Mail, Phone, 
  Lock, Smartphone, Globe, Calendar, Clock,
  Palette, Activity, CheckCircle2, ShieldAlert,
  User as UserIcon, ChevronRight, ArrowLeft,
  Instagram, Facebook, Linkedin, Github, FileBox, Users, GraduationCap
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { Button } from "@/components/marketing_ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/marketing_ui/avatar";
import { Spinner } from "@/components/marketing_ui/spinner";
import { Badge } from "@/components/marketing_ui/badge";
import { Input } from "@/components/marketing_ui/input";
import { Switch } from "@/components/marketing_ui/switch";
import { ImageCropperModal } from "@/components/marketing_ui/ImageCropperModal";
import { toast } from "sonner";
import { ContextualProfile } from "../components/ContextualProfile";
import { useCurrentUser } from "@/features/auth/queries/useCurrentUser";

type ProfileData = {
  name: string;
  phoneNumber: string;
  email: string;
  role: string;
  profilePicture: string;
  profileBanner?: string;
  lastLoginAt?: string;
  createdAt?: string;
  prn?: string;
  bio?: string;
};

type EmailPrefs = {
  global: boolean;
  announcements: boolean;
};

interface SharedProfilePageProps {
  publicUser?: ProfileData;
  onClose?: () => void;
}

export function SharedProfilePage({ publicUser, onClose }: SharedProfilePageProps) {
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

  const isReadOnly = !!publicUser;
  
  // Fetch current user from react-query cache to know their real role/org structure for ContextualProfile
  const { data: currentUser } = useCurrentUser();

  // Re-usable auth query hook can be used here, but keeping apiClient for direct access for now.
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["global-profile"],
    queryFn: () => apiClient.get("/api/user/profile").then((r) => r.data),
    enabled: !isReadOnly,
  });

  const { data: prefsData, isLoading: prefsLoading } = useQuery({
    queryKey: ["global-settings"],
    queryFn: () => apiClient.get("/api/user/email-preferences").then((r) => r.data),
    enabled: !isReadOnly,
  });

  useEffect(() => {
    if (publicUser) {
      setForm({
        name: publicUser.name || "",
        phoneNumber: publicUser.phoneNumber || "",
        email: publicUser.email || "",
        role: publicUser.role || "User",
        profilePicture: publicUser.profilePicture || "",
        profileBanner: publicUser.profileBanner || "",
        lastLoginAt: publicUser.lastLoginAt,
        createdAt: publicUser.createdAt,
        prn: publicUser.prn,
        bio: publicUser.bio,
      });
    } else if (profileData?.user) {
      setForm({
        name: profileData.user.name || "",
        phoneNumber: profileData.user.phoneNumber || "",
        email: profileData.user.email || "",
        role: profileData.user.role || "User",
        profilePicture: profileData.user.profilePicture || profileData.user.photoURL || "",
        profileBanner: profileData.user.profileBanner || "",
        lastLoginAt: profileData.user.lastLoginAt,
        createdAt: profileData.user.createdAt,
      });
    }
  }, [profileData, publicUser]);

  useEffect(() => {
    if (!isReadOnly && prefsData?.emailNotifications) {
      setPrefs({
        global: prefsData.emailNotifications.global ?? true,
        announcements: prefsData.emailNotifications.announcements ?? true,
      });
    }
  }, [prefsData, isReadOnly]);

  const updateProfile = useMutation({
    mutationFn: (updates: Partial<ProfileData>) => apiClient.put("/api/user/update", updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["global-profile"] });
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
        headers: { "Content-Type": blob.type }
      });

      if (!response.ok) throw new Error(`Upload failed: ${response.status} ${response.statusText}`);

      const updatePayload = type === "avatar" 
        ? { profilePicture: data.publicUrl }
        : { profileBanner: data.publicUrl };

      setForm((prev) => ({ ...prev, ...updatePayload }));
      updateProfile.mutate(updatePayload);
      
      toast.success(`${type} updated successfully!`, { id: loadingToast });
    } catch (err) {
      console.error(err);
      toast.error(`Failed to upload ${type}`, { id: loadingToast });
      throw err;
    }
  };

  const handleSave = () => {
    if (!form.name.trim()) { setErrors({ name: "Required" }); return; }
    updateProfile.mutate({ name: form.name, phoneNumber: form.phoneNumber });
    apiClient.put("/api/user/email-preferences", prefs);
  };

  const isLoading = !isReadOnly && (profileLoading || prefsLoading);

  const containerContent = (
    <div className="flex flex-col gap-6 w-full max-w-[1000px] pb-24 mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {isLoading ? (
        <div className="flex flex-col gap-6 w-full animate-pulse">
          {/* Skeleton Header */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg flex flex-col">
            <div className="h-[250px] relative bg-muted" />
            <div className="px-8 pb-8 flex flex-col items-start gap-4">
              <div className="relative -mt-[100px] mb-2 rounded-full overflow-hidden">
                <div className="w-[160px] h-[160px] border-4 border-background shadow-xl bg-muted" />
              </div>
              
              <div className="flex flex-col w-full gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-64 bg-muted rounded" />
                  <div className="h-6 w-24 bg-muted rounded-full" />
                </div>
                <div className="flex flex-wrap gap-4 mt-1 text-sm">
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-muted" /><div className="h-4 w-40 bg-muted rounded" /></div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-muted" /><div className="h-4 w-32 bg-muted rounded" /></div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-muted" /><div className="h-4 w-48 bg-muted rounded" /></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Skeleton Bento Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Basic Information */}
            <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-6 shadow-sm">
              <div className="border-b border-border pb-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-muted rounded-full" />
                  <div className="h-6 w-40 bg-muted rounded" />
                </div>
                <div className="h-4 w-64 bg-muted rounded opacity-80" />
              </div>
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <div className="h-3 w-32 bg-muted rounded" />
                  <div className="h-10 w-full bg-muted rounded-md" />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="h-3 w-24 bg-muted rounded" />
                  <div className="h-12 w-full bg-muted rounded-lg" />
                </div>
              </div>
            </div>

            {/* User Experience */}
            <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-6 shadow-sm">
              <div className="border-b border-border pb-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-muted rounded-full" />
                  <div className="h-6 w-40 bg-muted rounded" />
                </div>
                <div className="h-4 w-64 bg-muted rounded opacity-80" />
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between p-3 border border-transparent">
                  <div className="flex flex-col gap-2">
                    <div className="h-4 w-24 bg-muted rounded" />
                    <div className="h-3 w-40 bg-muted rounded opacity-80" />
                  </div>
                  <div className="w-11 h-6 bg-muted rounded-full" />
                </div>
                <div className="flex items-center justify-between p-3 border border-transparent">
                  <div className="flex flex-col gap-2">
                    <div className="h-4 w-24 bg-muted rounded" />
                    <div className="h-3 w-40 bg-muted rounded opacity-80" />
                  </div>
                  <div className="w-11 h-6 bg-muted rounded-full" />
                </div>
              </div>
            </div>

          </div>
        </div>
      ) : (
        <>
          {/* Identity Header */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg flex flex-col">
            <div 
              className="h-[250px] relative bg-muted" 
              style={form.profileBanner ? { backgroundImage: `url(${form.profileBanner})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
            >

              {!isReadOnly && (
                <>
                  <div 
                    className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/70 rounded-full cursor-pointer text-white backdrop-blur-md transition-all z-10 group" 
                    onClick={() => bannerInputRef.current?.click()}
                  >
                    <Camera size={16} />
                    <span className="absolute -bottom-10 right-0 scale-0 transition-all rounded bg-foreground px-3 py-1.5 text-xs text-background font-medium whitespace-nowrap shadow-lg group-hover:scale-100 pointer-events-none">
                      Update Banner
                    </span>
                  </div>
                  <Input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={handleBannerUpload} />
                </>
              )}
            </div>
            
            <div className="px-8 pb-8 flex flex-col items-start gap-4">
              <div 
                className={`relative -mt-[100px] mb-2 ${!isReadOnly ? 'cursor-pointer group' : ''} rounded-full overflow-hidden`} 
                onClick={() => !isReadOnly && fileInputRef.current?.click()}
              >
                <Avatar className="w-[160px] h-[160px] border-4 border-background shadow-xl bg-card">
                  <AvatarImage src={form.profilePicture} alt={form.name} className="object-cover" />
                  <AvatarFallback className="text-5xl font-bold bg-primary/10 text-primary">
                    {form.name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                {!isReadOnly && (
                  <>
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="text-white w-8 h-8" />
                    </div>
                    <Input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                  </>
                )}
              </div>
              
              <div className="flex flex-col w-full gap-3">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight text-foreground dark:text-white">{form.name}</h1>
                  <Badge variant="info" className="h-6 px-3 text-[10px] font-bold tracking-widest uppercase">
                    {(form.role || "User").replace("platform_", "")}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground font-medium mt-1">
                  <span className="flex items-center gap-1.5"><Mail size={16} /> {form.email}</span>
                  <span className="flex items-center gap-1.5"><Globe size={16} /> Classgrid Cloud</span>
                  <span className="flex items-center gap-1.5 text-success"><Activity size={16} /> Current Status: Active</span>
                  <span className="flex items-center gap-1.5 text-muted-foreground italic">@{(form.name || "user").toLowerCase().replace(/\s+/g, '_')}</span>
                </div>

                {/* Social Links with Premium Hover Effects */}
                <div className="flex items-center gap-3 mt-4">
                  <Button variant="outline" size="icon" className="h-10 w-10 rounded-full bg-background/50 backdrop-blur border-border/50 text-muted-foreground hover:text-pink-600 hover:border-pink-500 hover:bg-pink-500/10 hover:shadow-[0_0_15px_rgba(236,72,153,0.3)] transition-all duration-300 hover:-translate-y-0.5">
                    <Instagram size={18} />
                  </Button>
                  <Button variant="outline" size="icon" className="h-10 w-10 rounded-full bg-background/50 backdrop-blur border-border/50 text-muted-foreground hover:text-blue-600 hover:border-blue-600 hover:bg-blue-600/10 hover:shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all duration-300 hover:-translate-y-0.5">
                    <Facebook size={18} />
                  </Button>
                  <Button variant="outline" size="icon" className="h-10 w-10 rounded-full bg-background/50 backdrop-blur border-border/50 text-muted-foreground hover:text-sky-500 hover:border-sky-500 hover:bg-sky-500/10 hover:shadow-[0_0_15px_rgba(14,165,233,0.3)] transition-all duration-300 hover:-translate-y-0.5">
                    <Linkedin size={18} />
                  </Button>
                  <Button variant="outline" size="icon" className="h-10 w-10 rounded-full bg-background/50 backdrop-blur border-border/50 text-muted-foreground hover:text-foreground hover:border-foreground hover:bg-foreground/5 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all duration-300 hover:-translate-y-0.5">
                    <Github size={18} />
                  </Button>
                </div>
                
                <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent my-6 opacity-60" />

                {/* Media & Docs Prominent Button */}
                <div className="w-full sm:w-auto relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/40 to-blue-500/40 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <Button 
                    variant="outline" 
                    className="w-full sm:w-auto relative flex items-center justify-between gap-4 py-6 px-6 border-border/50 bg-background/50 dark:bg-muted/10 backdrop-blur-xl hover:bg-muted/50 dark:hover:bg-white/5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-primary/10 text-primary">
                        <FileBox size={18} />
                      </div>
                      <span className="font-semibold text-foreground/90 tracking-wide">Media, Links & Docs</span>
                    </div>
                    <ChevronRight size={18} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </Button>
                </div>

                <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent my-6 opacity-60" />

                {/* Groups & Academic Status in Glass Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  <div className="flex flex-col gap-3 p-4 rounded-xl border border-border/40 bg-muted/20 dark:bg-white/[0.02] hover:bg-muted/40 dark:hover:bg-white/[0.04] transition-colors">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
                      <Users size={16} className="text-blue-500" />
                      Groups in Common
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="bg-background/80 hover:bg-background border-border/50 text-xs py-1 px-3 shadow-sm">FY CS Batch A</Badge>
                      <Badge variant="secondary" className="bg-background/80 hover:bg-background border-border/50 text-xs py-1 px-3 shadow-sm">Web Dev Club</Badge>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3 p-4 rounded-xl border border-border/40 bg-muted/20 dark:bg-white/[0.02] hover:bg-muted/40 dark:hover:bg-white/[0.04] transition-colors">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
                      <GraduationCap size={16} className="text-purple-500" />
                      Academic Status
                    </div>
                    <div className="text-sm text-foreground/90 font-medium">
                      {form.role.includes("student") ? (
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold">B.Tech Computer Science</span>
                          <span className="text-xs text-muted-foreground">Class of 2027 • Student</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold">Computer Science Dept</span>
                          <span className="text-xs text-muted-foreground">Faculty Member</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Contextual Profile Data */}
          <div className="mt-8 mb-6">
            <ContextualProfile 
              targetRole={form.role || "student"} 
              viewerRole={currentUser?.role || "student"} 
              orgType={currentUser?.organization?.type || "university"} 
              structureType={currentUser?.organization?.structure || "standalone"} 
              isSelfView={!publicUser} 
              profileData={publicUser || profileData?.user}
            />
          </div>

          {/* User Experience & Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            
            {/* User Experience */}
            <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-6 shadow-sm hover:shadow-md hover:border-muted-foreground/30 transition-all">
              <div className="border-b border-border pb-4">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground"><Palette size={18} /> User Experience</h3>
                <p className="text-sm text-muted-foreground mt-1 opacity-80">Manage how you interact with the interface.</p>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 dark:bg-white/5 rounded-lg border border-transparent hover:bg-muted dark:hover:bg-white/10 hover:border-border transition-colors">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground/90">Dark Theme</span>
                    <span className="text-xs text-muted-foreground opacity-80">Optimize UI for low-light.</span>
                  </div>
                  <Switch
                    checked={theme === "dark"}
                    onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                    disabled={isReadOnly}
                    className={isReadOnly ? 'opacity-50 pointer-events-none' : ''}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 dark:bg-white/5 rounded-lg border border-transparent hover:bg-muted dark:hover:bg-white/10 hover:border-border transition-colors">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground/90">Push Alerts</span>
                    <span className="text-xs text-muted-foreground opacity-80">Real-time system notifications.</span>
                  </div>
                  <Switch
                    checked={prefs.global}
                    onCheckedChange={() => handlePrefToggle("global")}
                    disabled={isReadOnly}
                    className={isReadOnly ? 'opacity-50 pointer-events-none' : ''}
                  />
                </div>
              </div>
            </div>

            {/* Contact & Support */}
            <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-6 shadow-sm hover:shadow-md hover:border-muted-foreground/30 transition-all">
              <div className="border-b border-border pb-4">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground"><Phone size={18} /> Contact & Support</h3>
                <p className="text-sm text-muted-foreground mt-1 opacity-80">Verified communication channels.</p>
              </div>
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone Connectivity</label>
                  <Input value={form.phoneNumber} onChange={e => handleInputChange("phoneNumber", e.target.value)} placeholder="+91 " className="bg-background" readOnly={isReadOnly} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Verification Email</label>
                  <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg border border-success/30">
                    <span className="text-sm font-medium">{form.email}</span>
                    <Badge variant="success" className="h-6 text-[10px] tracking-wider uppercase">Verified</Badge>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {!isReadOnly && (
            <ImageCropperModal
              isOpen={cropOpen}
              onClose={() => setCropOpen(false)}
              imageSrc={cropSrc}
              aspectRatio={cropType === "avatar" ? 1 : 1584 / 396}
              title={cropType === "avatar" ? "Crop Profile Picture" : "Crop Banner"}
              onCropComplete={(blob) => uploadToR2(blob, cropType)}
            />
          )}

          {/* Sticky Save Bar */}
          {!isReadOnly && isDirty && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-[1000px] bg-card border border-primary/50 rounded-2xl p-4 flex items-center justify-between shadow-2xl z-50 animate-in slide-in-from-bottom-12 duration-300">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-bold">Unsaved changes detected</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Profile out of sync</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="ghost" className="hover:bg-danger/10 hover:text-danger transition-colors h-10" onClick={() => { setIsDirty(false); queryClient.invalidateQueries({ queryKey: ["global-profile"] }); }}>
                  Reset
                </Button>
                <Button className="shadow-lg shadow-primary/20 h-10 px-6 font-semibold" onClick={handleSave} isLoading={updateProfile.isPending}>
                  Push Updates
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  if (isReadOnly) {
    return (
      <div className="w-full h-full pb-12">
        <div className="sticky top-0 z-50 w-full h-14 bg-background/95 backdrop-blur border-b border-border flex items-center justify-center px-4 md:px-6">
          <div className="flex items-center text-sm text-muted-foreground">
            <button className="cursor-pointer hover:text-foreground hover:underline transition-colors focus:outline-none" onClick={onClose}>Chat</button>
            <ChevronRight size={14} className="mx-2 opacity-50" />
            <button className="cursor-pointer hover:text-foreground hover:underline transition-colors focus:outline-none" onClick={onClose}>{form.name || "User"}</button>
            <ChevronRight size={14} className="mx-2 opacity-50" />
            <span className="font-semibold text-foreground">Profile</span>
          </div>
        </div>
        <div className="pt-6">
          {containerContent}
        </div>
      </div>
    );
  }

  return containerContent;
}
