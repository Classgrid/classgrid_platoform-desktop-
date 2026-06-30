import { useState, useMemo } from "react";
import { Search, Users, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/marketing_ui/dialog";
import { Button } from "@/components/marketing_ui/button";
import { Spinner } from "@/components/marketing_ui/spinner";
import type { OrgUser } from "../services/chatApi";

interface GroupCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: OrgUser[];
  currentUserId: string;
  onCreateGroup: (name: string, memberIds: string[]) => Promise<void>;
  isLoading: boolean;
}

function getInitials(name: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function GroupCreateModal({
  isOpen,
  onClose,
  users,
  currentUserId,
  onCreateGroup,
  isLoading,
}: GroupCreateModalProps) {
  const [groupName, setGroupName] = useState("");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const toggleUser = (userId: string) => {
    const next = new Set(selectedIds);
    if (next.has(userId)) next.delete(userId);
    else next.add(userId);
    setSelectedIds(next);
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selectedIds.size === 0) return;
    setIsSubmitting(true);
    try {
      await onCreateGroup(groupName.trim(), Array.from(selectedIds));
      setGroupName("");
      setSelectedIds(new Set());
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden flex flex-col h-[85vh] sm:h-[650px]">
        <DialogHeader className="p-4 border-b border-border bg-card">
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Create New Group
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto flex flex-col p-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Group Name</label>
            <Input
              type="text"
              placeholder="e.g. Faculty Announcement, Study Group..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg outline-none focus:ring-1 focus:ring-ring text-foreground"
            />
          </div>

          <div className="flex flex-col flex-1 min-h-0">
            <label className="block text-sm font-medium mb-1 flex items-center justify-between">
              <span>Select Members</span>
              <span className="text-muted-foreground text-xs font-normal">
                {selectedIds.size} selected
              </span>
            </label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search to add..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-muted border border-border rounded-lg outline-none focus:ring-1 focus:ring-ring text-foreground"
              />
            </div>

            <div className="flex-1 overflow-y-auto border border-border rounded-lg bg-card p-1 space-y-1">
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <Spinner className="w-6 h-6 text-primary" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  No users found.
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <Button
                    key={user._id}
                    onClick={() => toggleUser(user._id)}
                    className="w-full flex items-center gap-3 p-2 hover:bg-accent rounded-md transition-colors text-left group"
                  >
                    <div className="relative shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center">
                        {user.profilePicture ? (
                          <img src={user.profilePicture} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          getInitials(user.name)
                        )}
                      </div>
                      {selectedIds.has(user._id) && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary text-primary-foreground rounded-full flex items-center justify-center border-2 border-card">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.role}</p>
                    </div>
                  </Button>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-border bg-card">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={isSubmitting || !groupName.trim() || selectedIds.size === 0}
          >
            {isSubmitting ? <Spinner className="w-4 h-4 mr-2" /> : null}
            Create Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
