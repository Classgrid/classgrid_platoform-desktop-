import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Image as ImageIcon, Globe, Shield, Trash2, Eye, Upload, Check, X, Plus, Palette } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { Button } from "@/components/marketing_ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/marketing_ui/avatar";
import { Spinner } from "@/components/marketing_ui/spinner";
import { Badge } from "@/components/marketing_ui/badge";
import { ImageCropperModal } from "@/components/marketing_ui/ImageCropperModal";
import { toast } from "sonner";

type BrandColorSettings = {
  primary?: string;
  secondary?: string;
};

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
  brand_colors?: BrandColorSettings;
  theme_colors?: BrandColorSettings;
  branding?: {
    theme_colors?: BrandColorSettings;
  };
};

const DEFAULT_BRAND_COLORS = {
  primary: "#6366f1",
  secondary: "#4f46e5",
};
const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

const normalizeHexInput = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
};

const isValidHexColor = (value: string) => HEX_COLOR_PATTERN.test(normalizeHexInput(value));

const toColorPickerValue = (value: string) => {
  const color = normalizeHexInput(value);
  const shortHex = color.match(/^#([0-9a-fA-F]{3})$/);
  if (shortHex?.[1]) {
    const [r = "", g = "", b = ""] = shortHex[1].split("");
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  if (/^#[0-9a-fA-F]{6}/.test(color)) return color.slice(0, 7);
  return "#000000";
};

const resolveBrandColors = (branding?: BrandingData) => ({
  primary: normalizeHexInput(
    branding?.brand_colors?.primary ||
      branding?.theme_colors?.primary ||
      branding?.branding?.theme_colors?.primary ||
      DEFAULT_BRAND_COLORS.primary
  ),
  secondary: normalizeHexInput(
    branding?.brand_colors?.secondary ||
      branding?.theme_colors?.secondary ||
      branding?.branding?.theme_colors?.secondary ||
      DEFAULT_BRAND_COLORS.secondary
  ),
});

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
  const [brandColors, setBrandColors] = useState(DEFAULT_BRAND_COLORS);

  const [selectedPlatform, setSelectedPlatform] = useState("instagram_url");
  const [platformUrl, setPlatformUrl] = useState("");

  const { data, isLoading } = useQuery<BrandingData>({
    queryKey: ["org-branding"],
    queryFn: () => apiClient.get("/api/org-admin/branding").then((r) => r.data),
  });

  const updateBranding = useMutation({
    mutationFn: (updates: Partial<BrandingData>) => apiClient.patch("/api/org-admin/branding", updates),
    onSuccess: (res, variables) => {
      if (res.data?.branding) {
        queryClient.setQueryData(["org-branding"], (old: any) => ({ ...old, ...res.data.branding }));
      } else {
        queryClient.setQueryData(["org-branding"], (old: any) => ({ ...old, ...variables }));
      }
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

  React.useEffect(() => {
    if (data) setBrandColors(resolveBrandColors(data));
  }, [data]);

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

  const savedBrandColors = resolveBrandColors(data);
  const normalizedBrandColors = {
    primary: normalizeHexInput(brandColors.primary),
    secondary: normalizeHexInput(brandColors.secondary),
  };
  const brandColorsAreValid = isValidHexColor(brandColors.primary) && isValidHexColor(brandColors.secondary);
  const brandColorsChanged =
    normalizedBrandColors.primary !== savedBrandColors.primary ||
    normalizedBrandColors.secondary !== savedBrandColors.secondary;

  const handleBrandColorChange = (key: keyof BrandColorSettings, value: string) => {
    setBrandColors((current) => ({ ...current, [key]: value }));
  };

  const handleBrandColorBlur = (key: keyof BrandColorSettings) => {
    setBrandColors((current) => ({ ...current, [key]: normalizeHexInput(current[key] || "") }));
  };

  const handleResetBrandColors = () => {
    setBrandColors(savedBrandColors);
  };

  const handleSaveBrandColors = async () => {
    const payload = {
      primary: normalizeHexInput(brandColors.primary),
      secondary: normalizeHexInput(brandColors.secondary),
    };

    if (!HEX_COLOR_PATTERN.test(payload.primary) || !HEX_COLOR_PATTERN.test(payload.secondary)) {
      toast.error("Enter valid hex colors like #00E590.");
      return;
    }

    try {
      await updateBranding.mutateAsync({ brand_colors: payload });
      setBrandColors(payload);
      toast.success("Brand colors updated successfully!");
    } catch (error) {
      toast.error("Failed to update brand colors.");
    }
  };

  // Removed individual card spinner to use global page spinner

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-6 shadow-sm hover:shadow-md transition-all">
      <div className="border-b border-border pb-4 flex flex-col gap-2">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <ImageIcon size={18} /> Organization Branding
        </h3>
        <p className="text-sm text-muted-foreground mt-1 opacity-80">
          Upload your college logo, custom favicon, site title, and brand colors to white-label the platform.
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
        {data?.has_custom_domain && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Custom Favicon
                </label>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Browser tab icon. Uses standard PNG format (no .ico needed).
              </p>
            </div>

            <div className="relative group rounded-xl overflow-hidden border-2 border-dashed border-border w-[100px] h-[100px] flex items-center justify-center bg-muted/30 hover:border-primary/50">
              {data?.favicon_url ? (
                <img src={data.favicon_url} alt="Favicon" className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-300" />
              ) : (
                <div 
                  className="flex flex-col items-center gap-2 text-muted-foreground cursor-pointer"
                  onClick={() => faviconInputRef.current?.click()}
                >
                  <Globe size={24} />
                  <span className="text-[10px] font-medium text-center px-2">Upload PNG</span>
                </div>
              )}
              {data?.favicon_url && (
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
              <input type="file" ref={faviconInputRef} className="hidden" accept="image/png, image/jpeg" onChange={handleFaviconUpload} />
            </div>
          </div>
        )}

        {/* Campus Photo Upload */}
        {data?.has_custom_domain && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Campus Photo
                </label>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Dimensions: 1350x1800px (3:4 ratio). Background for your login page.
              </p>
            </div>

            <div className="relative group rounded-xl overflow-hidden border-2 border-dashed border-border w-[120px] h-[160px] flex items-center justify-center bg-muted/30 hover:border-primary/50">
              {data?.campus_photo_url ? (
                <img src={data.campus_photo_url} alt="Campus" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div 
                  className="flex flex-col items-center gap-2 text-muted-foreground cursor-pointer"
                  onClick={() => campusInputRef.current?.click()}
                >
                  <Camera size={24} />
                  <span className="text-[10px] font-medium text-center px-2">Upload Photo</span>
                </div>
              )}
              
              {data?.campus_photo_url && (
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
              <input type="file" ref={campusInputRef} className="hidden" accept="image/*" onChange={handleCampusUpload} />
            </div>
          </div>
        )}

        {/* Site Title Settings */}
        {data?.has_custom_domain && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Browser Tab Title
                </label>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Replaces "Classgrid ERP" in the browser tab.
              </p>
            </div>

            <div className="flex flex-col gap-3">
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
                    {updateBranding.isPending ? <Spinner /> : "Save"}
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
        )}

        {/* Website Theme Colors */}
        {data?.has_custom_domain && (
          <div className="flex flex-col gap-4 md:col-span-2 lg:col-span-2">
            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Palette size={14} /> Website Theme Colors
              </label>
              <p className="text-[11px] text-muted-foreground">
                Primary and secondary hex colors for the public college website.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="primary-brand-color" className="text-xs font-medium text-foreground">
                  Primary Brand Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    aria-label="Primary brand color swatch"
                    type="color"
                    value={toColorPickerValue(brandColors.primary)}
                    onChange={(e) => handleBrandColorChange("primary", e.target.value)}
                    className="h-10 w-11 shrink-0 cursor-pointer rounded-lg border border-border bg-background p-1"
                  />
                  <input
                    id="primary-brand-color"
                    type="text"
                    inputMode="text"
                    value={brandColors.primary}
                    placeholder="#00E590"
                    onChange={(e) => handleBrandColorChange("primary", e.target.value)}
                    onBlur={() => handleBrandColorBlur("primary")}
                    className={`w-full bg-background border rounded-lg px-3 py-2 text-sm outline-none transition-all ${
                      brandColors.primary && !isValidHexColor(brandColors.primary)
                        ? "border-destructive focus:ring-1 focus:ring-destructive"
                        : "border-border focus:ring-1 focus:ring-primary"
                    }`}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="secondary-brand-color" className="text-xs font-medium text-foreground">
                  Secondary Brand Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    aria-label="Secondary brand color swatch"
                    type="color"
                    value={toColorPickerValue(brandColors.secondary)}
                    onChange={(e) => handleBrandColorChange("secondary", e.target.value)}
                    className="h-10 w-11 shrink-0 cursor-pointer rounded-lg border border-border bg-background p-1"
                  />
                  <input
                    id="secondary-brand-color"
                    type="text"
                    inputMode="text"
                    value={brandColors.secondary}
                    placeholder="#4f46e5"
                    onChange={(e) => handleBrandColorChange("secondary", e.target.value)}
                    onBlur={() => handleBrandColorBlur("secondary")}
                    className={`w-full bg-background border rounded-lg px-3 py-2 text-sm outline-none transition-all ${
                      brandColors.secondary && !isValidHexColor(brandColors.secondary)
                        ? "border-destructive focus:ring-1 focus:ring-destructive"
                        : "border-border focus:ring-1 focus:ring-primary"
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleSaveBrandColors}
                disabled={isLoading || updateBranding.isPending || !brandColorsAreValid || !brandColorsChanged}
                className="w-fit"
              >
                {updateBranding.isPending ? <Spinner /> : "Save Colors"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleResetBrandColors}
                disabled={isLoading || updateBranding.isPending || !brandColorsChanged}
                className="w-fit"
              >
                Reset
              </Button>
            </div>
          </div>
        )}
      </div>

      {data?.has_custom_domain && (
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
      )}

      <ImageCropperModal
        isOpen={cropOpen}
        onClose={() => setCropOpen(false)}
        imageSrc={cropSrc}
        aspectRatio={cropType === "favicon" ? 1 : cropType === "campus" ? 0.75 : undefined}
        circularCrop={cropType === "favicon"}
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
