import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Image as ImageIcon, Globe, Shield, Trash2 } from "lucide-react";
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
            className="relative cursor-pointer group rounded-xl overflow-hidden border-2 border-dashed border-border w-[200px] h-[100px] flex items-center justify-center bg-muted/30"
            onClick={() => fileInputRef.current?.click()}
          >
            {data?.logo_url ? (
              <img src={data.logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Camera size={24} />
                <span className="text-xs font-medium">Upload Logo</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-xs font-semibold">Change Logo</span>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
          </div>
          {data?.logo_url && (
            <div className="flex items-center gap-2 mt-1 w-[200px]">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRemoveBg} 
                isLoading={isRemovingBg}
                className="flex-1 text-xs font-semibold"
              >
                Remove BG
              </Button>
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
              data?.has_custom_domain ? "cursor-pointer group hover:border-primary/50" : "opacity-50 cursor-not-allowed"
            }`}
            onClick={() => data?.has_custom_domain && faviconInputRef.current?.click()}
          >
            {data?.favicon_url ? (
              <img src={data.favicon_url} alt="Favicon" className="w-full h-full object-contain p-2" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Globe size={24} />
                <span className="text-[10px] font-medium text-center px-2">Upload PNG</span>
              </div>
            )}
            {data?.has_custom_domain && (
              <>
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-semibold text-center leading-tight">Change<br/>Favicon</span>
                </div>
                <input type="file" ref={faviconInputRef} className="hidden" accept="image/png, image/jpeg" onChange={handleFaviconUpload} />
              </>
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
              size="sm" 
              className="w-[100px] text-xs text-danger hover:text-danger hover:bg-danger/10 mt-1"
              onClick={() => handleDelete("favicon")}
            >
              <Trash2 size={12} className="mr-1" /> Clear
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
    </div>
  );
}
