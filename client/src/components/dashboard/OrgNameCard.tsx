import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import api from "@/lib/api";
import { Button } from "@/components/marketing_ui/button";
import { Spinner } from "@/components/marketing_ui/spinner";
import { SectionPanel } from "@/components/dashboard/SectionPanel";

type BrandingData = {
  name: string;
  sidebar_name: string;
};

export function OrgNameCard() {
  const queryClient = useQueryClient();
  const [localName, setLocalName] = useState("");
  const [localSidebarName, setLocalSidebarName] = useState("");
  const [isEditingNames, setIsEditingNames] = useState(false);

  const { data, isLoading } = useQuery<BrandingData>({
    queryKey: ["org-branding"],
    queryFn: async () => {
      const res = await api.get("/org-admin/branding");
      return res.data;
    },
  });

  const updateBranding = useMutation({
    mutationFn: async (variables: Partial<BrandingData>) => {
      const res = await api.patch("/org-admin/branding", variables);
      return res.data;
    },
    onSuccess: (updatedData, variables) => {
      queryClient.invalidateQueries({ queryKey: ["org-branding"] });
      // Invalidate user profile so sidebar updates
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      toast.success("Organization names updated successfully");
      setIsEditingNames(false);
    },
  });

  useEffect(() => {
    if (data) {
      setLocalName(data.name || "");
      setLocalSidebarName(data.sidebar_name || "");
    }
  }, [data]);

  return (
    <SectionPanel
      title="Organization Name"
      description="Set your official name and a short name for the sidebar."
      loading={isLoading}
      actions={
        isEditingNames ? (
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                setIsEditingNames(false);
                setLocalName(data?.name || "");
                setLocalSidebarName(data?.sidebar_name || "");
              }}
            >
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={() => updateBranding.mutate({ name: localName, sidebar_name: localSidebarName })}
              disabled={updateBranding.isPending || !localName.trim()}
            >
              {updateBranding.isPending ? <Spinner size="sm" className="mr-2" /> : null} Save Names
            </Button>
          </div>
        ) : (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setIsEditingNames(true)}
          >
            Edit Names
          </Button>
        )
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-2">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase font-bold text-muted-foreground">Full Name</label>
          <input
            type="text"
            value={isEditingNames ? localName : (data?.name || "")}
            onChange={(e) => setLocalName(e.target.value)}
            disabled={!isEditingNames}
            placeholder="e.g. Ambiguity Engineering College"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm disabled:opacity-70 disabled:bg-muted/30 focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase font-bold text-muted-foreground">Sidebar Name (Max 22 chars)</label>
          <input
            type="text"
            value={isEditingNames ? localSidebarName : (data?.sidebar_name || "")}
            onChange={(e) => setLocalSidebarName(e.target.value.slice(0, 22))}
            disabled={!isEditingNames}
            maxLength={22}
            placeholder="e.g. Ambiguity Engg."
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm disabled:opacity-70 disabled:bg-muted/30 focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>
      </div>
    </SectionPanel>
  );
}
