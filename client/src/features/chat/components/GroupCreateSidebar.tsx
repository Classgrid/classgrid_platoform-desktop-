import { useState, useMemo } from "react";
import { ArrowLeft, ArrowRight, Search, Check, Camera, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Spinner } from "@/components/marketing_ui/spinner";
import { toast } from "sonner";
import type { OrgUser } from "../services/chatApi";

interface GroupCreateSidebarProps {
  onClose: () => void;
  onBack: () => void;
  users: OrgUser[];
  currentUserId: string;
  onCreateGroup: (name: string, memberIds: string[], photo: File | null) => Promise<void>;
  isLoading: boolean;
}

function getInitials(name: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function GroupCreateSidebar({
  onClose,
  onBack,
  users,
  currentUserId,
  onCreateGroup,
  isLoading,
}: GroupCreateSidebarProps) {
  const [stage, setStage] = useState<"select" | "details">("select");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [groupName, setGroupName] = useState("");
  const [groupPhoto, setGroupPhoto] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const selectedUsersList = useMemo(() => {
    return users.filter(u => selectedIds.has(u._id));
  }, [users, selectedIds]);

  const toggleUser = (userId: string) => {
    const next = new Set(selectedIds);
    if (next.has(userId)) {
      next.delete(userId);
    } else {
      if (next.size >= 50) {
        toast.error("You can only add up to 50 members to a group.");
        return;
      }
      next.add(userId);
    }
    setSelectedIds(next);
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selectedIds.size === 0) return;
    setIsSubmitting(true);
    try {
      await onCreateGroup(groupName.trim(), Array.from(selectedIds), groupPhoto);
      setGroupName("");
      setGroupPhoto(null);
      setSelectedIds(new Set());
      setStage("select");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setGroupPhoto(e.target.files[0]);
    }
  };

  return (
    <motion.div
      initial={{ x: "-100%" }}
      animate={{ x: 0 }}
      exit={{ x: "-100%" }}
      transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
      className="absolute inset-0 z-50 flex flex-col bg-white dark:bg-black overflow-hidden"
    >
      <AnimatePresence mode="wait">
        {stage === "select" ? (
          <motion.div
            key="select-stage"
            initial={{ x: "-20%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-20%", opacity: 0 }}
            transition={{ type: "tween", duration: 0.2 }}
            className="flex flex-col w-full h-full"
          >
            {/* Header */}
            <div className="h-16 shrink-0 flex items-center px-4 gap-4 border-b border-border bg-white dark:bg-black">
              <button
                onClick={onBack}
                className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-foreground"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex flex-col">
                <h2 className="text-lg font-bold text-foreground leading-tight">Add group members</h2>
                <span className="text-xs text-muted-foreground">{selectedIds.size} of 50 selected</span>
              </div>
            </div>

            {/* Selected Chips & Search Area */}
            <div className="p-3 border-b border-border bg-white dark:bg-black flex flex-col gap-3">
              {selectedUsersList.length > 0 && (
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {selectedUsersList.map(user => (
                    <div key={user._id} className="flex items-center gap-1.5 bg-muted rounded-full pl-1 pr-2 py-1 border border-border">
                      <div className="w-5 h-5 rounded-full bg-primary/20 text-primary font-bold text-[9px] flex items-center justify-center shrink-0">
                        {user.profilePicture ? (
                          <img src={user.profilePicture} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          getInitials(user.name)
                        )}
                      </div>
                      <span className="text-xs font-medium truncate max-w-[100px]">{user.name}</span>
                      <button onClick={() => toggleUser(user._id)} className="p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="relative">
                <Search className="absolute left-1 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={selectedIds.size === 0 ? "Search name or role" : ""}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 text-sm bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/70"
                />
              </div>
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto min-h-0 bg-[#fafafa] dark:bg-[#0f0f0f] relative">
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <Spinner className="w-6 h-6 text-primary" />
                </div>
              ) : (
                <div className="flex flex-col py-2 pb-24">
                  {filteredAndSortedUsers.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground text-sm">
                      No contacts found matching "{search}"
                    </div>
                  ) : (
                    filteredAndSortedUsers.map((user, index) => {
                      const isSelected = selectedIds.has(user._id);
                      return (
                        <button
                          key={user._id}
                          onClick={() => toggleUser(user._id)}
                          className="w-full flex items-center gap-4 px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left group relative"
                        >
                          <div className={`relative shrink-0 transition-opacity duration-200 ${isSelected ? 'opacity-60' : 'opacity-100'}`}>
                            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center overflow-hidden">
                              {user.profilePicture ? (
                                <img
                                  src={user.profilePicture}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                getInitials(user.name)
                              )}
                            </div>
                            {isSelected && (
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center border-2 border-background shadow-sm">
                                <Check className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                          <div className={`flex-1 min-w-0 pb-3 pt-1 ${index !== filteredAndSortedUsers.length - 1 ? 'border-b border-border' : ''}`}>
                            <p className={`text-[17px] truncate transition-opacity duration-200 ${isSelected ? 'text-muted-foreground' : 'text-foreground'}`}>
                              {user.name}
                            </p>
                            <p className="text-[13px] text-muted-foreground truncate mt-0.5">
                              {user.role}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Floating Next Button */}
            <AnimatePresence>
              {selectedIds.size > 0 && (
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  onClick={() => setStage("details")}
                  className="absolute bottom-6 right-6 w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors z-20"
                >
                  <ArrowRight className="w-6 h-6" />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            key="details-stage"
            initial={{ x: "20%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "20%", opacity: 0 }}
            transition={{ type: "tween", duration: 0.2 }}
            className="flex flex-col w-full h-full bg-[#fafafa] dark:bg-[#0f0f0f]"
          >
            {/* Header */}
            <div className="h-16 shrink-0 flex items-center px-4 gap-4 border-b border-border bg-white dark:bg-black">
              <button
                onClick={() => setStage("select")}
                className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-foreground"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-bold text-foreground">New group</h2>
            </div>

            {/* Group Icon & Name */}
            <div className="flex flex-col items-center pt-8 px-6 pb-4">
              <label className="w-48 h-48 rounded-full bg-accent flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:bg-muted transition-colors group relative overflow-hidden mb-8">
                {groupPhoto ? (
                  <img src={URL.createObjectURL(groupPhoto)} alt="Group" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera className="w-10 h-10 mb-2 opacity-70 group-hover:opacity-100 transition-opacity" />
                    <span className="text-xs uppercase tracking-wider font-semibold opacity-70 group-hover:opacity-100 text-center px-4 leading-tight">Add group<br/>icon</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </label>
              
              <div className="w-full relative">
                <input
                  type="text"
                  placeholder="Group subject (optional)"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full bg-transparent border-b-2 border-emerald-500 py-2 text-foreground outline-none placeholder:text-muted-foreground/70"
                  autoFocus
                />
              </div>
            </div>

            {/* Settings toggles can go here */}
            <div className="mt-4 px-6 flex flex-col gap-6 text-sm">
              <div className="flex items-center justify-between cursor-not-allowed opacity-60">
                <span className="font-medium">Disappearing messages</span>
                <span className="text-muted-foreground">Off &gt;</span>
              </div>
              <div className="flex items-center justify-between cursor-not-allowed opacity-60">
                <span className="font-medium">Group permissions</span>
                <span className="text-muted-foreground">&gt;</span>
              </div>
            </div>

            {/* Floating Create Button */}
            <AnimatePresence>
              {groupName.trim() && (
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  onClick={handleCreate}
                  disabled={isSubmitting}
                  className="absolute bottom-6 right-6 w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors z-20 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <Spinner className="w-6 h-6 text-white" />
                  ) : (
                    <Check className="w-7 h-7" />
                  )}
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
