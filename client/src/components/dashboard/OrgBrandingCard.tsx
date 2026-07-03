import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Globe, Trash2, Eye, Upload, Plus, X, Palette, Image as ImageIcon, Link as LinkIcon, Building2, Layout, LayoutTemplate } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { Button } from "@/components/marketing_ui/button";
import { Spinner } from "@/components/marketing_ui/spinner";
import { ImageCropperModal } from "@/components/marketing_ui/ImageCropperModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/marketing_ui/select";
import { toast } from "sonner";

type BrandColorSettings = {
  primary?: string;
  secondary?: string;
};

type BrandingData = {
  logo_url: string;
  sidebar_logo_url?: string;
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
  has_custom_domain?: boolean;
  has_erp_domain: boolean;
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

const SOCIAL_ICONS: Record<string, string> = {
  instagram_url: "https://bumxgscngzjadyozdpce.supabase.co/storage/v1/object/public/LOGO%20AND%20%20SVG/instagram-2-1-logo-svgrepo-com.svg",
  youtube_url: "https://bumxgscngzjadyozdpce.supabase.co/storage/v1/object/public/LOGO%20AND%20%20SVG/youtube-color-svgrepo-com.svg",
  facebook_url: "https://bumxgscngzjadyozdpce.supabase.co/storage/v1/object/public/LOGO%20AND%20%20SVG/facebook-icon-logo-svgrepo-com.svg",
  linkedin_url: "https://bumxgscngzjadyozdpce.supabase.co/storage/v1/object/public/LOGO%20AND%20%20SVG/linkedin-svgrepo-com.svg",
  twitter_url: "https://bumxgscngzjadyozdpce.supabase.co/storage/v1/object/public/LOGO%20AND%20%20SVG/Untitled%20folder/new-twitter-x-logo-twitter-icon-x-social-media-icon-free-png.webp",
  github_url: "https://bumxgscngzjadyozdpce.supabase.co/storage/v1/object/public/LOGO%20AND%20%20SVG/Untitled%20folder/github-svgrepo-com.svg",
};

export function OrgBrandingCard() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sidebarLogoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const campusInputRef = useRef<HTMLInputElement>(null);

  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState("");
  const [cropType, setCropType] = useState<"logo" | "sidebar_logo" | "favicon" | "campus">("logo");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const [localSiteTitle, setLocalSiteTitle] = useState("");
  const [localName, setLocalName] = useState("");
  const [localSidebarName, setLocalSidebarName] = useState("");
  
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
    },
  });

  React.useEffect(() => {
    if (data) {
      if (data.site_title) {
        document.title = data.site_title;
        setLocalSiteTitle(data.site_title);
        localStorage.setItem("org_title", data.site_title);
      }
      if (data.name) setLocalName(data.name);
      if (data.sidebar_name) setLocalSidebarName(data.sidebar_name);
      setBrandColors(resolveBrandColors(data));
      
      if (data.favicon_url) {
        localStorage.setItem("org_favicon", data.favicon_url);
        const link1 = document.getElementById('favicon-32') as HTMLLinkElement;
        const link2 = document.getElementById('favicon-16') as HTMLLinkElement;
        const link3 = document.getElementById('favicon-ico') as HTMLLinkElement;
        const cacheBustedUrl = `${data.favicon_url}?t=${Date.now()}`;
        if (link1) link1.href = cacheBustedUrl;
        if (link2) link2.href = cacheBustedUrl;
        if (link3) link3.href = cacheBustedUrl;
      }
    }
  }, [data]);

  const openCropper = (file: File, type: "logo" | "sidebar_logo" | "favicon" | "campus") => {
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

  const uploadToR2 = async (blob: Blob, type: "logo" | "sidebar_logo" | "favicon" | "campus") => {
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
      else if (type === "sidebar_logo") payload = { sidebar_logo_url: data.publicUrl };
      else if (type === "favicon") payload = { favicon_url: data.publicUrl };
      else if (type === "campus") payload = { campus_photo_url: data.publicUrl };

      await updateBranding.mutateAsync(payload);
      
      toast.success(`${type} updated successfully!`, { id: loadingToast });
      setCropOpen(false);
    } catch (err) {
      toast.error(`Failed to upload ${type}`, { id: loadingToast });
    }
  };

  const handleAddSocialLink = async () => {
    if (!platformUrl.trim() || !platformUrl.startsWith("http")) {
      toast.error("Please enter a valid HTTP/HTTPS URL");
      return;
    }
    const currentLinks = data?.social_links || {};
    await updateBranding.mutateAsync({
      social_links: { ...currentLinks, [selectedPlatform]: platformUrl.trim() }
    });
    setPlatformUrl("");
    toast.success("Social link added successfully!");
  };

  const handleRemoveSocialLink = async (key: string) => {
    const currentLinks = { ...(data?.social_links || {}) };
    delete (currentLinks as any)[key];
    await updateBranding.mutateAsync({ social_links: currentLinks });
    toast.success("Social link removed!");
  };

  const handleSaveIdentity = async () => {
    await updateBranding.mutateAsync({
      site_title: localSiteTitle,
      name: localName,
      sidebar_name: localSidebarName
    });
    toast.success("Website Identity saved successfully!");
  };

  const handleSaveBrandColors = async () => {
    const payload = {
      primary: normalizeHexInput(brandColors.primary),
      secondary: normalizeHexInput(brandColors.secondary),
    };
    if (!HEX_COLOR_PATTERN.test(payload.primary) || !HEX_COLOR_PATTERN.test(payload.secondary)) {
      toast.error("Enter valid hex colors.");
      return;
    }
    await updateBranding.mutateAsync({ brand_colors: payload });
    toast.success("Theme colors updated successfully!");
  };

  // UI Components
  const SectionHeader = ({ num, title, description }: { num: number, title: string, description: string }) => (
    <div className="flex flex-col gap-1 mb-6">
      <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
        <span className="w-5 h-5 rounded bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{num}</span>
        {title}
      </h3>
      <p className="text-xs text-muted-foreground ml-7">{description}</p>
    </div>
  );

  const AssetRow = ({ 
    title, description, imgUrl, onUploadClick, type, fallbackIcon 
  }: { 
    title: string, description: string, imgUrl?: string, onUploadClick: () => void, type: string, fallbackIcon: React.ReactNode 
  }) => (
    <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-card hover:bg-muted/10 transition-colors group">
      <div className="flex gap-4 items-center">
        <div className="w-16 h-16 rounded-lg border-2 border-dashed border-border/60 bg-muted/20 flex items-center justify-center overflow-hidden shrink-0">
          {imgUrl ? (
             <img src={imgUrl} alt={title} className="w-full h-full object-contain p-1" />
          ) : (
            <div className="text-muted-foreground opacity-50">{fallbackIcon}</div>
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">{title}</span>
          <span className="text-xs text-muted-foreground">{description}</span>
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={onUploadClick} className="shrink-0 bg-background shadow-sm hover:bg-accent">
        Upload / Replace
      </Button>
    </div>
  );

  if (isLoading) return <div className="p-8 flex justify-center"><Spinner /></div>;

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto pb-20">
      
      {/* 0. Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Organization Branding</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage logos, favicon, website title, colors, and social links to white-label your platform.</p>
        </div>
        {/* The user wireframe scribbled this out, but keeping it invisible or subtle just in case. Leaving it out entirely to match mockup. */}
      </div>

      <div className="flex flex-col xl:flex-row gap-6 items-start">
        
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-6 w-full xl:w-5/12">
          
          {/* 1. Brand Preview */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <SectionHeader num={1} title="Brand Preview" description="See how your branding will appear across the platform." />
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Sidebar Preview */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-muted-foreground text-center">Sidebar Preview</span>
                <div className="border border-border rounded-lg bg-background p-3 flex flex-col gap-3 h-32 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-muted rounded flex items-center justify-center overflow-hidden shrink-0">
                      {data?.sidebar_logo_url ? <img src={data.sidebar_logo_url} className="w-full h-full object-contain" /> : <Building2 size={12} className="opacity-40" />}
                    </div>
                    <span className="text-sm font-bold truncate">{localSidebarName || data?.sidebar_name || "Organization"}</span>
                  </div>
                  <div className="flex flex-col gap-2 mt-2 opacity-40">
                    <div className="h-2 w-16 bg-muted-foreground rounded-full" />
                    <div className="h-2 w-20 bg-muted-foreground rounded-full" />
                    <div className="h-2 w-12 bg-muted-foreground rounded-full" />
                  </div>
                </div>
              </div>

              {/* Login Preview */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-muted-foreground text-center">Login Page Preview</span>
                <div className="border border-border rounded-lg bg-background h-32 relative overflow-hidden shadow-sm">
                   {data?.campus_photo_url ? (
                     <img src={data.campus_photo_url} className="absolute inset-0 w-full h-full object-cover blur-[2px] opacity-60" />
                   ) : (
                     <div className="absolute inset-0 bg-primary/10" />
                   )}
                   <div className="absolute inset-x-2 top-4 bottom-2 bg-background/90 backdrop-blur-md rounded border border-border shadow-lg flex flex-col items-center justify-center p-2 gap-2">
                     <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center overflow-hidden border border-border/50">
                        {data?.logo_url ? <img src={data.logo_url} className="w-full h-full object-contain p-1" /> : <ImageIcon size={14} className="opacity-40" />}
                     </div>
                     <span className="text-[10px] font-bold text-center truncate w-full">{localName || data?.name || "Welcome"}</span>
                     <div className="w-16 h-4 bg-primary rounded mt-auto" style={{ backgroundColor: brandColors.primary }} />
                   </div>
                </div>
              </div>

              {/* Tab Preview */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-muted-foreground text-center">Browser Tab Preview</span>
                <div className="border border-border rounded-lg bg-muted/30 h-32 p-2 flex flex-col shadow-sm">
                  <div className="bg-background border border-border rounded flex items-center gap-2 p-1.5 shadow-sm max-w-[150px]">
                    <div className="w-3.5 h-3.5 rounded-sm overflow-hidden shrink-0 bg-muted flex items-center justify-center">
                      {data?.favicon_url ? <img src={data.favicon_url} className="w-full h-full object-contain" /> : <Globe size={10} className="opacity-40" />}
                    </div>
                    <span className="text-[10px] truncate">{localSiteTitle || data?.site_title || "Classgrid"}</span>
                    <X size={10} className="ml-auto opacity-40 shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 mt-2 px-1 opacity-40">
                    <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                    <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                    <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Website Identity */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <SectionHeader num={3} title="Website Identity" description="Set the names and title used across the platform." />
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <label className="text-xs font-semibold text-foreground w-40 shrink-0">Browser Tab Title</label>
                <input type="text" value={localSiteTitle} onChange={e => setLocalSiteTitle(e.target.value)} className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary" placeholder="Institution - Home" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <label className="text-xs font-semibold text-foreground w-40 shrink-0">Institution Name (Full)</label>
                <input type="text" value={localName} onChange={e => setLocalName(e.target.value)} className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary" placeholder="Vishwakarma Institute..." />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <label className="text-xs font-semibold text-foreground w-40 shrink-0">Sidebar Short Name</label>
                <input type="text" value={localSidebarName} onChange={e => setLocalSidebarName(e.target.value)} className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary" placeholder="VIT" maxLength={22} />
              </div>
              
              <div className="flex justify-end mt-2">
                <Button size="sm" onClick={handleSaveIdentity} disabled={updateBranding.isPending}>
                  {updateBranding.isPending ? <Spinner /> : "Save Identity"}
                </Button>
              </div>
            </div>
          </div>

          {/* 4. Theme Colors */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <SectionHeader num={4} title="Theme Colors" description="Choose primary and secondary colors for the public website." />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-foreground">Primary Brand Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={toColorPickerValue(brandColors.primary || "")} onChange={e => setBrandColors(c => ({...c, primary: e.target.value}))} className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-border bg-background p-1" />
                  <input type="text" value={brandColors.primary} onChange={e => setBrandColors(c => ({...c, primary: e.target.value}))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary uppercase" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-foreground">Secondary Brand Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={toColorPickerValue(brandColors.secondary || "")} onChange={e => setBrandColors(c => ({...c, secondary: e.target.value}))} className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-border bg-background p-1" />
                  <input type="text" value={brandColors.secondary} onChange={e => setBrandColors(c => ({...c, secondary: e.target.value}))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary uppercase" />
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 border border-border rounded-xl bg-muted/20 flex flex-wrap items-center gap-4">
              <span className="text-xs font-semibold text-muted-foreground mr-2">Preview:</span>
              <button className="px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90" style={{ backgroundColor: brandColors.primary }}>
                Primary Button
              </button>
              <button className="px-4 py-2 rounded-lg text-sm font-semibold border bg-transparent transition-colors hover:bg-muted" style={{ borderColor: brandColors.secondary, color: brandColors.secondary }}>
                Secondary Button
              </button>
              <span className="text-sm font-semibold hover:underline cursor-pointer" style={{ color: brandColors.primary }}>
                Link Text
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <Button size="sm" variant="outline" onClick={() => setBrandColors(resolveBrandColors(data))}>Reset</Button>
              <Button size="sm" onClick={handleSaveBrandColors} disabled={updateBranding.isPending}>Save Colors</Button>
            </div>
          </div>
        </div>


        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-6 w-full xl:w-7/12">
          
          {/* 2. Brand Assets */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <SectionHeader num={2} title="Brand Assets" description="Upload your logos, favicon and campus photo." />
            
            <div className="flex flex-col gap-3">
              <AssetRow 
                title="College Logo" description="Displayed on Login Page and Admin Sidebar."
                imgUrl={data?.logo_url} type="logo" fallbackIcon={<Building2 size={24} />}
                onUploadClick={() => fileInputRef.current?.click()}
              />
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) openCropper(f, "logo"); if (fileInputRef.current) fileInputRef.current.value = ""; }} />

              <AssetRow 
                title="Sidebar Logo" description="Displayed in the top-left sidebar menu."
                imgUrl={data?.sidebar_logo_url} type="sidebar_logo" fallbackIcon={<Layout size={24} />}
                onUploadClick={() => sidebarLogoInputRef.current?.click()}
              />
              <input type="file" ref={sidebarLogoInputRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) openCropper(f, "sidebar_logo"); if (sidebarLogoInputRef.current) sidebarLogoInputRef.current.value = ""; }} />

              <AssetRow 
                title="Custom Favicon" description="Browser tab icon. PNG format (32x32 px)."
                imgUrl={data?.favicon_url} type="favicon" fallbackIcon={<Globe size={24} />}
                onUploadClick={() => faviconInputRef.current?.click()}
              />
              <input type="file" ref={faviconInputRef} className="hidden" accept="image/png, image/jpeg" onChange={(e) => { const f = e.target.files?.[0]; if (f) openCropper(f, "favicon"); if (faviconInputRef.current) faviconInputRef.current.value = ""; }} />

              <AssetRow 
                title="Campus Photo" description="Background for login page. Recommended 1350x1800px."
                imgUrl={data?.campus_photo_url} type="campus" fallbackIcon={<ImageIcon size={24} />}
                onUploadClick={() => campusInputRef.current?.click()}
              />
              <input type="file" ref={campusInputRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) openCropper(f, "campus"); if (campusInputRef.current) campusInputRef.current.value = ""; }} />
            </div>
          </div>

          {/* 5. Social Links */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <SectionHeader num={5} title="Social Links" description="Add your social media links to display on the login page." />
            
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger className="w-full sm:w-[160px] bg-background border-border h-10">
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram_url">Instagram</SelectItem>
                  <SelectItem value="youtube_url">YouTube</SelectItem>
                  <SelectItem value="facebook_url">Facebook</SelectItem>
                  <SelectItem value="linkedin_url">LinkedIn</SelectItem>
                  <SelectItem value="twitter_url">Twitter</SelectItem>
                  <SelectItem value="github_url">GitHub</SelectItem>
                  <SelectItem value="website_url">Website</SelectItem>
                </SelectContent>
              </Select>
              
              <input type="url" placeholder="https://..." value={platformUrl} onChange={e => setPlatformUrl(e.target.value)} className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm h-10 focus:ring-1 focus:ring-primary" />
              
              <Button onClick={handleAddSocialLink} disabled={!platformUrl.trim() || updateBranding.isPending} className="h-10 shrink-0 px-6">
                Add Link
              </Button>
            </div>

            {/* List Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-muted-foreground border-b border-border mb-2">
              <div className="col-span-3">Platform</div>
              <div className="col-span-7">URL</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* List Items */}
            <div className="flex flex-col gap-2">
              {data?.social_links && Object.keys(data.social_links).length > 0 ? Object.entries(data.social_links).map(([key, url]) => {
                if (!url) return null;
                const label = key.replace("_url", "").charAt(0).toUpperCase() + key.replace("_url", "").slice(1);
                const iconSrc = SOCIAL_ICONS[key];
                
                return (
                  <div key={key} className="grid grid-cols-12 gap-4 px-4 py-3 bg-background border border-border rounded-lg items-center hover:bg-muted/30 transition-colors">
                    <div className="col-span-3 flex items-center gap-3">
                      {iconSrc ? (
                         <img src={iconSrc} alt={label} className="w-5 h-5 object-contain" />
                      ) : (
                         <LinkIcon size={16} className="text-muted-foreground" />
                      )}
                      <span className="text-sm font-semibold text-foreground">{label}</span>
                    </div>
                    <div className="col-span-7">
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary truncate block w-full">
                        {url}
                      </a>
                    </div>
                    <div className="col-span-2 flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                        <Camera size={14} /> {/* Placeholder for edit if they want it later */}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveSocialLink(key)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-6 text-sm text-muted-foreground border border-dashed border-border rounded-lg bg-muted/10">
                  No social links added yet.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      <ImageCropperModal
        isOpen={cropOpen}
        onClose={() => setCropOpen(false)}
        imageSrc={cropSrc}
        aspectRatio={cropType === "favicon" ? 1 : cropType === "campus" ? 0.75 : undefined}
        circularCrop={cropType === "favicon"}
        title={`Crop ${cropType}`}
        onCropComplete={(blob) => uploadToR2(blob, cropType)}
      />
    </div>
  );
}
