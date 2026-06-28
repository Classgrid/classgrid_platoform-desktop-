import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Image as ImageIcon, Globe, Shield, Trash2, Eye, Upload, Check, X } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { Button } from "@/components/marketing_ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/marketing_ui/avatar";
import { Spinner } from "@/components/marketing_ui/spinner";
import { Badge } from "@/components/marketing_ui/badge";
import { ImageCropperModal } from "@/components/marketing_ui/ImageCropperModal";
import { toast } from "react-hot-toast";

type BrandingData = {
  logo_url: string;
  favicon_url: string;
  has_custom_domain: boolean;
};

export function OrgBrandingCard() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState("");
  const [cropType, setCropType] = useState<"logo" | "favicon">("logo");
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [hasRemovedBg, setHasRemovedBg] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const { data, isLoading } = useQuery<BrandingData>({
    queryKey: ["org-branding"],
    queryFn: () => apiClient.get("/api/org-admin/branding").then((r) => r.data),
  });

  const updateBranding = useMutation({
    mutationFn: (updates: Partial<BrandingData>) => apiClient.patch("/api/org-admin/branding", updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-branding"] });
    },
  });

  // Dynamically update the favicon in the browser tab
  React.useEffect(() => {
    if (data?.favicon_url) {
      localStorage.setItem("org_favicon", data.favicon_url);
      
      const link1 = document.getElementById('favicon-32') as HTMLLinkElement;
      const link2 = document.getElementById('favicon-16') as HTMLLinkElement;
      const link3 = document.getElementById('favicon-ico') as HTMLLinkElement;
      
      if (link1) link1.href = data.favicon_url;
      if (link2) link2.href = data.favicon_url;
      if (link3) link3.href = data.favicon_url;
    } else if (data && !data.favicon_url) {
      localStorage.removeItem("org_favicon");
    }
  }, [data?.favicon_url]);

  const openCropper = (file: File, type: "logo" | "favicon") => {
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

  const uploadToR2 = async (blob: Blob, type: "logo" | "favicon") => {
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

      const payload = type === "logo" 
        ? { logo_url: data.publicUrl } 
        : { favicon_url: data.publicUrl };

      await updateBranding.mutateAsync(payload);
      
      toast.success(`${type === "logo" ? "College Logo" : "Favicon"} updated successfully!`, { id: loadingToast });
      setCropOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to upload ${type}`, { id: loadingToast });
    }
  };

  const handleRemoveBg = async () => {
    if (!data?.logo_url) return;
    setIsRemovingBg(true);
    const loadingToast = toast.loading("AI is removing background... (This might take a moment)");
    
    try {
      // Dynamically import @imgly to prevent Vercel Rollup AST parse errors on the heavy WASM files
      const imgly = await import("@imgly/background-removal");
      const removeBackground = imgly.default || imgly.removeBackground;
      
      const transparentBlob = await removeBackground(data.logo_url);
      await uploadToR2(transparentBlob, "logo");
      setHasRemovedBg(true);
      toast.success("Background removed successfully!", { id: loadingToast });
    } catch (error) {
      console.error("BG Removal Error:", error);
      toast.error("Failed to remove background. Please try again.", { id: loadingToast });
    } finally {
      setIsRemovingBg(false);
    }
  };

  const handleDelete = async (type: "logo" | "favicon") => {
    const loadingToast = toast.loading(`Removing ${type}...`);
    try {
      const payload = type === "logo" ? { logo_url: "" } : { favicon_url: "" };
      await updateBranding.mutateAsync(payload);
      toast.success(`${type === "logo" ? "College Logo" : "Favicon"} removed successfully!`, { id: loadingToast });
    } catch (error) {
      toast.error(`Failed to remove ${type}`, { id: loadingToast });
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
          Upload your college logo and custom favicon to white-label the platform.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
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
              </div>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
          </div>
          {data?.logo_url && (
            <div className="flex items-center gap-2 mt-1 w-[200px]">
              {hasRemovedBg ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 text-xs font-semibold text-green-500 border-green-500/30 cursor-default bg-green-500/5 hover:bg-green-500/5 hover:text-green-500"
                >
                  <Check size={14} className="mr-1" /> Removed
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRemoveBg} 
                  isLoading={isRemovingBg}
                  className="flex-1 text-xs font-semibold"
                >
                  Remove BG
                </Button>
              )}
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 flex-shrink-0 text-danger hover:text-danger hover:bg-danger/10"
                onClick={() => handleDelete("logo")}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          )}
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
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
                <Button size="icon" variant="secondary" className="h-7 w-7 rounded-full" onClick={() => setPreviewImage(data.favicon_url)}>
                  <Eye size={12} />
                </Button>
                <Button size="icon" variant="default" className="h-7 w-7 rounded-full" onClick={() => faviconInputRef.current?.click()}>
                  <Upload size={12} />
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
          {data?.favicon_url && (
            <Button 
              variant="outline" 
              size="icon" 
              className="w-[100px] h-8 text-danger hover:text-danger hover:bg-danger/10 mt-1"
              onClick={() => handleDelete("favicon")}
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>

      </div>

      <ImageCropperModal
        isOpen={cropOpen}
        onClose={() => setCropOpen(false)}
        imageSrc={cropSrc}
        aspectRatio={cropType === "favicon" ? 1 : undefined} // Favicon is forced 1:1, Logo is free
        title={cropType === "favicon" ? "Crop Favicon (Square PNG)" : "Crop College Logo"}
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
