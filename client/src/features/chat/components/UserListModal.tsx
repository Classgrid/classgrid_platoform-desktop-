import { useState, useMemo } from "react";
import { Search, X, MessageSquarePlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/marketing_ui/dialog";
import { Spinner } from "@/components/marketing_ui/spinner";
import type { OrgUser } from "../services/chatApi";

import { Input } from "@/components/marketing_ui/input";

interface UserListModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: OrgUser[];
  currentUserId: string;
  onSelectUser: (userId: string) => void;
  isLoading: boolean;
}

function getInitials(name: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserListModal({
  isOpen,
  onClose,
  users,
  currentUserId,
  onSelectUser,
  isLoading,
}: UserListModalProps) {
  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => u._id !== currentUserId)
      .filter((u) => {
        const query = search.toLowerCase();
        return (
          u.name.toLowerCase().includes(query) ||
          (u.email && u.email.toLowerCase().includes(query)) ||
          (u.role && u.role.toLowerCase().includes(query))
        );
      });
  }, [users, search, currentUserId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden flex flex-col h-[80vh] sm:h-[600px]">
        <DialogHeader className="p-4 border-b border-border bg-card">
          <DialogTitle className="flex items-center gap-2">
            <MessageSquarePlus className="w-5 h-5" />
            New Conversation
          </DialogTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, email, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-muted border border-border rounded-lg outline-none focus:ring-1 focus:ring-ring text-foreground"
            />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Spinner className="w-6 h-6 text-primary" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              No users found matching "{search}"
            </div>
          ) : (
            <div className="space-y-1">
              {filteredUsers.map((user) => (
                <button
                  key={user._id}
                  onClick={() => {
                    onSelectUser(user._id);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-accent rounded-lg transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt=""
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      getInitials(user.name)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.role} {user.email ? `• ${user.email}` : ""}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
