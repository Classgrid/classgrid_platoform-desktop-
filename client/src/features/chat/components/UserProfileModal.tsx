import { X, Mail, Phone, BadgeInfo, Info } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/marketing_ui/avatar";
import { Badge } from "@/components/marketing_ui/badge";
import type { OrgUser } from "../services/chatApi";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: OrgUser | null;
}

export function UserProfileModal({ isOpen, onClose, user }: UserProfileModalProps) {
  if (!isOpen || !user) return null;

  const hasBanner = user.profileBanner && typeof user.profileBanner === "string" && user.profileBanner.startsWith("http");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-background border border-border rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner */}
        <div 
          className="h-32 relative bg-muted"
          style={hasBanner ? { backgroundImage: `url(${user.profileBanner})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/70 rounded-full text-white backdrop-blur-md transition-all z-10"
          >
            <X size={16} />
          </button>
        </div>

        {/* Profile Content */}
        <div className="px-6 pb-6 relative">
          {/* Avatar */}
          <div className="-mt-12 mb-4">
            <Avatar className="w-24 h-24 border-4 border-background shadow-xl bg-card">
              <AvatarImage src={user.profilePicture || undefined} alt={user.name} className="object-cover" />
              <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Name & Role */}
          <div className="flex flex-col gap-1 mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-foreground tracking-tight">{user.name}</h2>
              {user.role && (
                <Badge variant="info" className="uppercase text-[10px] tracking-wider font-bold h-6">
                  {user.role.replace("platform_", "")}
                </Badge>
              )}
            </div>
            {user.prn && (
              <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
                <BadgeInfo size={14} /> PRN: {user.prn}
              </p>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col gap-4">
            {user.bio && (
              <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
                <p className="text-sm text-foreground/90 italic">"{user.bio}"</p>
              </div>
            )}
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium p-2 bg-background border border-border rounded-lg">
                <div className="p-2 bg-primary/10 rounded-md text-primary shrink-0">
                  <Mail size={16} />
                </div>
                <span className="truncate">{user.email || "No email provided"}</span>
              </div>
              
              <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium p-2 bg-background border border-border rounded-lg">
                <div className="p-2 bg-success/10 rounded-md text-success shrink-0">
                  <Phone size={16} />
                </div>
                <span className="truncate">{user.phoneNumber || "No phone provided"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
