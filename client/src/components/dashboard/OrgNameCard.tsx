import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { apiClient } from "@/lib/apiClient";
import { Button } from "@/components/marketing_ui/button";
import { Spinner } from "@/components/marketing_ui/spinner";
import { SectionPanel } from "@/components/marketing_ui/SectionPanel";

type BrandingData = {
  name: string;
  sidebar_name: string;
};

function FieldEditor({ 
  label, 
  value, 
  onSave, 
  isSaving,
  placeholder, 
  maxLength 
}: { 
  label: string;
  value: string;
  onSave: (val: string) => void;
  isSaving: boolean;
  placeholder: string;
  maxLength?: number;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleSave = () => {
    onSave(localValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalValue(value);
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-[10px] uppercase font-bold text-muted-foreground">{label}</label>
      </div>

      <div className="flex flex-col gap-3">
        {isEditing ? (
          <input
            type="text"
            value={localValue}
            onChange={(e) => {
              const val = maxLength ? e.target.value.slice(0, maxLength) : e.target.value;
              setLocalValue(val);
            }}
            maxLength={maxLength}
            placeholder={placeholder}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        ) : (
          <div className="w-full bg-muted/20 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground min-h-[38px] flex items-center">
            {value ? value : <span className="text-muted-foreground italic">Not set</span>}
          </div>
        )}

        {isEditing ? (
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              onClick={handleSave} 
              disabled={isSaving || !localValue.trim()} 
              className="flex-1"
            >
              {isSaving ? <Spinner size="sm" className="mr-2" /> : "Save"}
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleCancel} 
              disabled={isSaving} 
              className="px-3"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setIsEditing(true)} 
            className="w-full text-xs font-medium mt-1"
          >
            Edit
          </Button>
        )}
      </div>
    </div>
  );
}

export function OrgNameCard() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<BrandingData>({
    queryKey: ["org-branding"],
    queryFn: async () => {
      const res = await apiClient.get("/org-admin/branding");
      return res.data;
    },
  });

  const updateBranding = useMutation({
    mutationFn: async (variables: Partial<BrandingData>) => {
      const res = await apiClient.patch("/org-admin/branding", variables);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-branding"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      toast.success("Organization name updated successfully");
    },
  });

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          <div>
            <h3 className="text-lg font-bold text-foreground">Organization Name</h3>
            <p className="text-sm text-muted-foreground mt-1">Set your official name and a short name for the sidebar.</p>
          </div>
          
          <FieldEditor
            label="Full Name"
            value={data?.name || ""}
            placeholder="e.g. Greenfield University"
            isSaving={updateBranding.isPending}
            onSave={(name) => updateBranding.mutate({ name })}
          />
        </div>

        {/* Right Column */}
        <div className="flex flex-col justify-end">
          <FieldEditor
            label="Sidebar Name (Max 22 chars)"
            value={data?.sidebar_name || ""}
            placeholder="e.g. Greenfield Uni"
            maxLength={22}
            isSaving={updateBranding.isPending}
            onSave={(sidebar_name) => updateBranding.mutate({ sidebar_name })}
          />
        </div>

      </div>
    </div>
  );
}
