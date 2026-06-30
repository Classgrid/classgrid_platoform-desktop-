import { X, Mail, Phone, Shield } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/marketing_ui/avatar";
import type { OrgUser } from "../services/chatApi";

interface ChatUserProfileSidebarProps {
  user: OrgUser | undefined;
  onClose: () => void;
}

export function ChatUserProfileSidebar({ user, onClose }: ChatUserProfileSidebarProps) {
  if (!user) return null;

  return (
    <div className="flex flex-col h-full w-full bg-background border-l border-border animate-in slide-in-from-right-8 duration-200">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-sm font-bold text-foreground">Contact Info</h2>
        <Button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
        <Avatar className="w-32 h-32 mb-4 border-4 border-background shadow-md">
          <AvatarImage src={user.profilePicture || user.photoURL || undefined} alt={user.name} className="object-cover" />
          <AvatarFallback className="text-4xl font-bold bg-primary/10 text-primary">
            {user.name?.charAt(0)?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        
        <h3 className="text-xl font-bold text-foreground text-center">{user.name}</h3>
        <p className="text-sm font-medium text-emerald-600 mt-1">{user.role?.replace("_", " ").toUpperCase() || "USER"}</p>
        
        <div className="w-full mt-8 space-y-4">
          {user.email && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                <Mail className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-muted-foreground">Email</span>
                <span className="text-sm font-medium text-foreground truncate">{user.email}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
