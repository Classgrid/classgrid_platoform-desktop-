import { useState, useMemo } from "react";
import { ArrowLeft, Search, Users } from "lucide-react";
import { motion } from "framer-motion";
import { Spinner } from "@/components/marketing_ui/spinner";
import { Input } from "@/components/marketing_ui/input";
import type { OrgUser } from "../services/chatApi";

interface NewChatSidebarProps {
  onClose: () => void;
  users: OrgUser[];
  currentUserId: string;
  onSelectUser: (userId: string) => void;
  isLoading: boolean;
  onNewGroup: () => void;
}

function getInitials(name: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function NewChatSidebar({
  onClose,
  users,
  currentUserId,
  onSelectUser,
  isLoading,
  onNewGroup,
}: NewChatSidebarProps) {
  const [search, setSearch] = useState("");

  const filteredAndSortedUsers = useMemo(() => {
    let list = users.filter((u) => u._id !== currentUserId);

    if (search.trim()) {
      const query = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(query) ||
          (u.email && u.email.toLowerCase().includes(query)) ||
          (u.role && u.role.toLowerCase().includes(query))
      );
    }

    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [users, search, currentUserId]);

  return (
    <motion.div
      initial={{ x: "-100%" }}
      animate={{ x: 0 }}
      exit={{ x: "-100%" }}
      transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
      className="absolute inset-0 z-50 flex flex-col bg-white dark:bg-black"
    >
      {/* Header */}
      <div className="h-16 shrink-0 flex items-center px-4 gap-4 border-b border-border">
        <button
          onClick={onClose}
          className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-foreground">New chat</h2>
      </div>

      {/* Search */}
      <div className="p-2 border-b border-border bg-white dark:bg-black">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 h-9 text-sm bg-[#fafafa] dark:bg-[#0f0f0f] border-none rounded-lg outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground placeholder:text-muted-foreground/70"
          />
        </div>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-[#fafafa] dark:bg-[#0f0f0f]">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Spinner className="w-6 h-6 text-primary" />
          </div>
        ) : (
          <div className="flex flex-col py-2">
            {/* New Group Button */}
            <button
              onClick={onNewGroup}
              className="w-full flex items-center gap-4 px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0 border-b border-border pb-3 pt-1">
                <p className="text-[17px] font-medium text-foreground">New group</p>
              </div>
            </button>

            {/* Contacts Header */}
            <div className="px-5 py-3 pt-5">
              <p className="text-[14px] font-medium text-emerald-600 uppercase tracking-wide">Contacts on Classgrid</p>
            </div>

            {/* User Items */}
            {filteredAndSortedUsers.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground text-sm">
                No contacts found matching "{search}"
              </div>
            ) : (
              filteredAndSortedUsers.map((user, index) => (
                <button
                  key={user._id}
                  onClick={() => {
                    onSelectUser(user._id);
                    onClose();
                  }}
                  className="w-full flex items-center gap-4 px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left group"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0">
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
                  <div className={`flex-1 min-w-0 pb-3 pt-1 ${index !== filteredAndSortedUsers.length - 1 ? 'border-b border-border' : ''}`}>
                    <p className="text-[17px] text-foreground truncate group-hover:text-foreground/90">{user.name}</p>
                    <p className="text-[13px] text-muted-foreground truncate mt-0.5">
                      {user.role} {user.email ? `• ${user.email}` : ""}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
