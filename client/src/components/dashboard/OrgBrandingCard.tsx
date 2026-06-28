import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Image as ImageIcon, Globe, Shield, Trash2, Eye, Upload, Check, X, Plus } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { Button } from "@/components/marketing_ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/marketing_ui/avatar";
import { Spinner } from "@/components/marketing_ui/spinner";
import { Badge } from "@/components/marketing_ui/badge";
import { ImageCropperModal } from "@/components/marketing_ui/ImageCropperModal";
import { toast } from "sonner";

type BrandingData = {
  logo_url: string;
  favicon_url: string;
  campus_photo_url: string;
  social_links: {
    instagram_url?: string;
    youtube_url?: string;
    facebook_url?: string;
    linkedin_url?: string;
    twitter_url?: string;
    github_url?: string;
    website_url?: string;
  };
  site_title: string;
  has_custom_domain: boolean;
  name: string;
  sidebar_name: string;
};

export function OrgBrandingCard() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const campusInputRef = useRef<HTMLInputElement>(null);

  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState("");
  const [cropType, setCropType] = useState<"logo" | "favicon" | "campus">("logo");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [localSiteTitle, setLocalSiteTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const [selectedPlatform, setSelectedPlatform] = useState("instagram_url");
  const [platformUrl, setPlatformUrl] = useState("");

  const { data, isLoading } = useQuery<BrandingData>({
    queryKey: ["org-branding"],
    queryFn: () => apiClient.get("/api/org-admin/branding").then((r) => r.data),
  });

  const updateBranding = useMutation({
    mutationFn: (updates: Partial<BrandingData>) => apiClient.patch("/api/org-admin/branding", updates),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ["org-branding"] });
      if (variables.site_title !== undefined) {
        setIsEditingTitle(false);
      }
    },
  });

  // Dynamically update the favicon and title in the browser tab
  React.useEffect(() => {
    if (data?.site_title) {
      document.title = data.site_title;
      setLocalSiteTitle(data.site_title);
      localStorage.setItem("org_title", data.site_title);
    } else if (data && !data.site_title) {
      localStorage.removeItem("org_title");
    }
    
    if (data?.favicon_url) {
      localStorage.setItem("org_favicon", data.favicon_url);
      
      const link1 = document.getElementById('favicon-32') as HTMLLinkElement;
      const link2 = document.getElementById('favicon-16') as HTMLLinkElement;
      const link3 = document.getElementById('favicon-ico') as HTMLLinkElement;
      const cacheBustedUrl = `${data.favicon_url}?t=${Date.now()}`;
      if (link1) link1.href = cacheBustedUrl;
      if (link2) link2.href = cacheBustedUrl;
      if (link3) link3.href = cacheBustedUrl;
    } else if (data && !data.favicon_url) {
      localStorage.removeItem("org_favicon");
    }
  }, [data?.favicon_url, data?.site_title]);

  const openCropper = (file: File, type: "logo" | "favicon" | "campus") => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`Please select an image smaller than 5MB.`);
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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) openCropper(file, "logo");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) openCropper(file, "favicon");
    if (faviconInputRef.current) faviconInputRef.current.value = "";
  };

  const handleCampusUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) openCropper(file, "campus");
    if (campusInputRef.current) campusInputRef.current.value = "";
  };

  const uploadToR2 = async (blob: Blob, type: "logo" | "favicon" | "campus") => {
    const loadingToast = toast.loading(`Uploading ${type}...`);
    try {
      const ext = blob.type === "image/png" ? "png" : "jpg";
      const fileName = `org-${type}-${Date.now()}.${ext}`;
      
      const { data } = await apiClient.post("/api/user/upload-url", {
        fileName,
        fileType: blob.type
      });

      const response = await fetch(data.uploadUrl, {
        method: "PUT",
        body: blob,
        headers: { "Content-Type": blob.type }
      });

      if (!response.ok) throw new Error(`Upload failed`);

      let payload = {};
      if (type === "logo") payload = { logo_url: data.publicUrl };
      else if (type === "favicon") payload = { favicon_url: data.publicUrl };
      else if (type === "campus") payload = { campus_photo_url: data.publicUrl };

      await updateBranding.mutateAsync(payload);
      
      const typeLabel = type === "logo" ? "College Logo" : type === "campus" ? "Campus Photo" : "Favicon";
      toast.success(`${typeLabel} updated successfully!`, { id: loadingToast });
      setCropOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to upload ${type}`, { id: loadingToast });
    }
  };

  const handleDelete = async (type: "logo" | "favicon" | "campus") => {
    const loadingToast = toast.loading(`Removing ${type}...`);
    try {
      let payload = {};
      if (type === "logo") payload = { logo_url: "" };
      else if (type === "favicon") payload = { favicon_url: "" };
      else if (type === "campus") payload = { campus_photo_url: "" };

      await updateBranding.mutateAsync(payload);
      const typeLabel = type === "logo" ? "College Logo" : type === "campus" ? "Campus Photo" : "Favicon";
      toast.success(`${typeLabel} removed successfully!`, { id: loadingToast });
    } catch (error) {
      toast.error(`Failed to remove ${type}`, { id: loadingToast });
    }
  };

  const handleAddSocialLink = async () => {
    if (!platformUrl.trim() || !platformUrl.startsWith("http")) {
      toast.error("Please enter a valid HTTP/HTTPS URL");
      return;
    }
    const currentLinks = data?.social_links || {};
    const payload = {
      social_links: {
        ...currentLinks,
        [selectedPlatform]: platformUrl.trim()
      }
    };
    await updateBranding.mutateAsync(payload);
    setPlatformUrl("");
    toast.success("Social link added successfully!");
  };

  const handleRemoveSocialLink = async (key: string) => {
    const currentLinks = { ...(data?.social_links || {}) };
    delete (currentLinks as any)[key];
    await updateBranding.mutateAsync({ social_links: currentLinks });
    toast.success("Social link removed!");
  };

  // Removed individual card spinner to use global page spinner

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-6 shadow-sm hover:shadow-md transition-all">
      <div className="border-b border-border pb-4 flex flex-col gap-2">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <ImageIcon size={18} /> Organization Branding
        </h3>
        <p className="text-sm text-muted-foreground mt-1 opacity-80">
          Upload your college logo, custom favicon, and site title to white-label the platform.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* College Logo Upload */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              College Logo
            </label>
            <p className="text-[11px] text-muted-foreground">
              Displayed on your Login Page and Admin Sidebar.
            </p>
          </div>
          <div 
            className="relative group rounded-xl overflow-hidden border-2 border-dashed border-border w-[200px] h-[100px] flex items-center justify-center bg-muted/30"
          >
            {data?.logo_url ? (
              <img src={data.logo_url} alt="Logo" className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <Camera size={24} />
                <span className="text-xs font-medium">Upload Logo</span>
              </div>
            )}
            
            {/* Micro-interaction Overlay */}
            {data?.logo_url && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
                <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full" onClick={() => setPreviewImage(data.logo_url)}>
                  <Eye size={14} />
                </Button>
                <Button size="icon" variant="default" className="h-8 w-8 rounded-full" onClick={() => fileInputRef.current?.click()}>
                  <Upload size={14} />
                </Button>
                <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full" onClick={() => handleDelete("logo")}>
                  <Trash2 size={14} />
                </Button>
              </div>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
          </div>
        </div>

        {/* Custom Favicon Upload */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Custom Favicon
              </label>
              {!data?.has_custom_domain && (
                <Badge variant="warning" className="h-5 text-[9px] uppercase tracking-wider px-1.5">
                  Custom Domain Required
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Browser tab icon. Uses standard PNG format (no .ico needed).
            </p>
          </div>

          <div 
            className={`relative rounded-xl overflow-hidden border-2 border-dashed border-border w-[100px] h-[100px] flex items-center justify-center bg-muted/30 ${
              data?.has_custom_domain ? "group hover:border-primary/50" : "opacity-50 cursor-not-allowed"
            }`}
          >
            {data?.favicon_url ? (
              <img src={data.favicon_url} alt="Favicon" className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-300" />
            ) : (
              <div 
                className={`flex flex-col items-center gap-2 text-muted-foreground ${data?.has_custom_domain ? "cursor-pointer" : ""}`}
                onClick={() => data?.has_custom_domain && faviconInputRef.current?.click()}
              >
                <Globe size={24} />
                <span className="text-[10px] font-medium text-center px-2">Upload PNG</span>
              </div>
            )}
            {data?.has_custom_domain && data?.favicon_url && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
                <Button size="icon" variant="secondary" className="h-7 w-7 rounded-full" onClick={() => setPreviewImage(data.favicon_url)}>
                  <Eye size={12} />
                </Button>
                <Button size="icon" variant="default" className="h-7 w-7 rounded-full" onClick={() => faviconInputRef.current?.click()}>
                  <Upload size={12} />
                </Button>
                <Button size="icon" variant="destructive" className="h-7 w-7 rounded-full" onClick={() => handleDelete("favicon")}>
                  <Trash2 size={12} />
                </Button>
              </div>
            )}
            {data?.has_custom_domain && (
              <input type="file" ref={faviconInputRef} className="hidden" accept="image/png, image/jpeg" onChange={handleFaviconUpload} />
            )}
            {!data?.has_custom_domain && (
               <div className="absolute inset-0 bg-background/80 flex items-center justify-center p-2 text-center backdrop-blur-[1px]">
                  <Shield size={16} className="text-muted-foreground mb-1" />
               </div>
            )}
          </div>
        </div>

        {/* Campus Photo Upload */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Campus Photo
              </label>
              {!data?.has_custom_domain && (
                <Badge variant="warning" className="h-5 text-[9px] uppercase tracking-wider px-1.5">
                  Custom Domain Required
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Dimensions: 1350x1800px (3:4 ratio). Background for your login page.
            </p>
          </div>

          <div 
            className={`relative rounded-xl overflow-hidden border-2 border-dashed border-border w-[120px] h-[160px] flex items-center justify-center bg-muted/30 ${
              data?.has_custom_domain ? "group hover:border-primary/50" : "opacity-50 cursor-not-allowed"
            }`}
          >
            {data?.campus_photo_url ? (
              <img src={data.campus_photo_url} alt="Campus" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            ) : (
              <div 
                className={`flex flex-col items-center gap-2 text-muted-foreground ${data?.has_custom_domain ? "cursor-pointer" : ""}`}
                onClick={() => data?.has_custom_domain && campusInputRef.current?.click()}
              >
                <Camera size={24} />
                <span className="text-[10px] font-medium text-center px-2">Upload Photo</span>
              </div>
            )}
            
            {data?.has_custom_domain && data?.campus_photo_url && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
                <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full" onClick={() => setPreviewImage(data.campus_photo_url)}>
                  <Eye size={14} />
                </Button>
                <Button size="icon" variant="default" className="h-8 w-8 rounded-full" onClick={() => campusInputRef.current?.click()}>
                  <Upload size={14} />
                </Button>
                <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full" onClick={() => handleDelete("campus")}>
                  <Trash2 size={14} />
                </Button>
              </div>
            )}
            {data?.has_custom_domain && (
              <input type="file" ref={campusInputRef} className="hidden" accept="image/*" onChange={handleCampusUpload} />
            )}
            {!data?.has_custom_domain && (
               <div className="absolute inset-0 bg-background/80 flex items-center justify-center p-2 text-center backdrop-blur-[1px]">
                  <Shield size={16} className="text-muted-foreground mb-1" />
               </div>
            )}
          </div>
        </div>

        {/* Site Title Settings */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Browser Tab Title
              </label>
              {!data?.has_custom_domain && (
                <Badge variant="warning" className="h-5 text-[9px] uppercase tracking-wider px-1.5">
                  Custom Domain Required
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Replaces "Classgrid ERP" in the browser tab.
            </p>
          </div>

          <div className={`flex flex-col gap-3 ${!data?.has_custom_domain ? "opacity-50 pointer-events-none" : ""}`}>
            <div className="relative">
              <input
                type="text"
                value={isEditingTitle ? localSiteTitle : (data?.site_title || "Classgrid ERP")}
                onChange={(e) => setLocalSiteTitle(e.target.value)}
                disabled={!isEditingTitle}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm disabled:opacity-70 disabled:bg-muted/30 focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
            
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  onClick={() => updateBranding.mutate({ site_title: localSiteTitle })}
                  disabled={updateBranding.isPending || !localSiteTitle.trim()}
                  className="flex-1"
                >
                  {updateBranding.isPending ? <Spinner size="sm" /> : "Save"}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditingTitle(false);
                    setLocalSiteTitle(data?.site_title || "Classgrid ERP");
                  }}
                  className="px-3"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setIsEditingTitle(true)}
                className="w-full text-xs font-medium"
              >
                Edit Title
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-6 mt-2">
        <div className="flex flex-col gap-1 mb-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground uppercase tracking-wider">
            <Globe size={16} /> Social Links
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Connect your institution's social media accounts to display them on the login page. Must start with http:// or https://.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="bg-background border border-border rounded-lg px-2 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="instagram_url">Instagram</option>
                <option value="youtube_url">YouTube</option>
                <option value="facebook_url">Facebook</option>
                <option value="linkedin_url">LinkedIn</option>
                <option value="twitter_url">Twitter</option>
                <option value="github_url">GitHub</option>
                <option value="website_url">Website</option>
              </select>
              <input
                type="url"
                placeholder="https://..."
                value={platformUrl}
                onChange={(e) => setPlatformUrl(e.target.value)}
                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
            <Button size="sm" onClick={handleAddSocialLink} disabled={!platformUrl.trim() || updateBranding.isPending} className="w-fit">
              <Plus size={14} className="mr-1" /> Add Link
            </Button>
          </div>

          <div className="md:col-span-1 lg:col-span-2 flex flex-wrap gap-2">
            {data?.social_links && Object.entries(data.social_links).map(([key, url]) => {
              if (!url) return null;
              const label = key.replace("_url", "").charAt(0).toUpperCase() + key.replace("_url", "").slice(1);
              return (
                <div key={key} className="flex items-center gap-2 bg-muted/50 border border-border rounded-full px-3 py-1.5 text-xs">
                  <span className="font-medium text-foreground">{label}</span>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary max-w-[150px] truncate" title={url}>
                    {url}
                  </a>
                  <button onClick={() => handleRemoveSocialLink(key)} className="text-muted-foreground hover:text-destructive ml-1">
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <ImageCropperModal
        isOpen={cropOpen}
        onClose={() => setCropOpen(false)}
        imageSrc={cropSrc}
        aspectRatio={cropType === "favicon" ? 1 : cropType === "campus" ? 0.75 : undefined}
        title={cropType === "favicon" ? "Crop Favicon (Square PNG)" : cropType === "campus" ? "Crop Campus Photo (3:4)" : "Crop College Logo"}
        onCropComplete={(blob) => uploadToR2(blob, cropType)}
      />

      {/* Full Screen Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center">
            <Button 
              variant="outline" 
              size="icon" 
              className="absolute -top-12 right-0 rounded-full bg-background/20 text-white border-white/20 hover:bg-white/20 hover:text-white"
              onClick={(e) => { e.stopPropagation(); setPreviewImage(null); }}
            >
              <X size={20} />
            </Button>
            <img 
              src={previewImage} 
              alt="Preview" 
              className="max-w-full max-h-[85vh] object-contain drop-shadow-2xl rounded-lg" 
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
