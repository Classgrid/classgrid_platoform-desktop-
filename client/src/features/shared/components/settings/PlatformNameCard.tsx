import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { Button } from "@/components/marketing_ui/button";
import { Spinner } from "@/components/marketing_ui/spinner";
import { toast } from "sonner";

export function PlatformNameCard() {
  const queryClient = useQueryClient();
  const [localName, setLocalName] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const { data: profileData, isLoading } = useQuery({
    queryKey: ["global-profile"],
    queryFn: () => apiClient.get("/api/user/profile").then((r) => r.data),
  });

  useEffect(() => {
    if (profileData?.user?.name) {
      setLocalName(profileData.user.name);
    }
  }, [profileData]);

  const updateProfile = useMutation({
    mutationFn: (updates: { name: string }) => apiClient.put("/api/user/update", updates),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ["global-profile"] });
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      setIsEditing(false);
      toast.success("Platform Sidebar Name updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update name.");
    }
  });

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-6 shadow-sm hover:shadow-md transition-all">
      <div className="border-b border-border pb-4 flex flex-col gap-2">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Building2 size={18} /> Platform Sidebar Name
        </h3>
        <p className="text-sm text-muted-foreground mt-1 opacity-80">
          This is the name that appears at the top of the sidebar.
        </p>
      </div>

      <div className="flex flex-col gap-3 max-w-md">
        <div className="relative">
          <input
            type="text"
            value={isEditing ? localName : (profileData?.user?.name || "Classgrid Platform")}
            onChange={(e) => setLocalName(e.target.value)}
            disabled={!isEditing}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm disabled:opacity-70 disabled:bg-muted/30 focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>
        
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              onClick={() => updateProfile.mutate({ name: localName })}
              disabled={updateProfile.isPending || !localName.trim()}
              className="flex-1"
            >
              {updateProfile.isPending ? <Spinner /> : "Save"}
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                setIsEditing(false);
                setLocalName(profileData?.user?.name || "Classgrid Platform");
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
            onClick={() => setIsEditing(true)}
            className="w-full text-xs font-medium"
          >
            Edit Sidebar Name
          </Button>
        )}
      </div>
    </div>
  );
}
