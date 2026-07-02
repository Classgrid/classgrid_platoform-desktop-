import { useState, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Camera, Users, Shield, Trash2, UserPlus, LogOut, Search, Crown } from "lucide-react";
import {
  fetchGroupInfo,
  uploadGroupPhoto,
  fetchOrgUsers,
  addGroupMember,
  removeGroupMember,
  exitGroup,
  toggleAdminRole,
  updateGroupPermissions,
  updateGroupInfo,
  type OrgUser,
} from "../services/chatApi";
import { toast } from "sonner";
import FilePreviewModal from "@/app/support/components/FilePreviewModal";
import { Megaphone, BadgeCheck, Building2 } from "lucide-react";
import { AddGroupMemberSidebar } from "./AddGroupMemberSidebar";
import { SharedProfilePage } from "@/features/shared/pages/SharedProfilePage";
import { Spinner } from "@/components/marketing_ui/spinner";
import { Switch } from "@/components/marketing_ui/switch";

import { Input } from "@/components/marketing_ui/input";

interface GroupSettingsModalProps {
  groupId: string;
  onClose: () => void;
  onLeaveGroup?: () => void;
  onUserClick?: (userId: string) => void;
  initialShowAddMember?: boolean;
}

export function GroupSettingsModal({ groupId, onClose, onLeaveGroup, onUserClick, initialShowAddMember }: GroupSettingsModalProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Local UI State ──
  const [showAddMember, setShowAddMember] = useState(initialShowAddMember || false);
  const [addSearch, setAddSearch] = useState("");
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  // ── Data: Group Info ──
  const { data, isLoading, isError } = useQuery({
    queryKey: ["group-info", groupId],
    queryFn: () => fetchGroupInfo(groupId),
  });

  // ── Data: Org Users (for Add Member) ──
  const { data: orgUsersData } = useQuery({
    queryKey: ["org-users"],
    queryFn: fetchOrgUsers,
    enabled: showAddMember, // only fetch when "Add Member" panel is open
  });

  // ── Mutation: Upload Group Photo ──
  const { mutate: handleUpload, isPending: isUploading } = useMutation({
    mutationFn: ({ file, type }: { file: File, type: "avatar" | "banner" }) => uploadGroupPhoto(groupId, file, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-threads"] });
      queryClient.invalidateQueries({ queryKey: ["group-info", groupId] });
      toast.success("Group photo updated!");
    },
    onError: () => {
      toast.error("Failed to upload photo");
    },
  });

  // ── Mutation: Add Members ──
  const { mutateAsync: handleAddMembers, isPending: isAdding } = useMutation({
    mutationFn: async (userIds: string[]) => {
      const promises = userIds.map(id => addGroupMember(groupId, id));
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-info", groupId] });
      queryClient.invalidateQueries({ queryKey: ["chat-threads"] });
      toast.success("Members added successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Failed to add members");
    },
  });

  // ── Mutation: Remove Member ──
  const { mutate: handleRemoveMember } = useMutation({
    mutationFn: (userId: string) => removeGroupMember(groupId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-info", groupId] });
      queryClient.invalidateQueries({ queryKey: ["chat-threads"] });
      toast.success("Member removed");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Failed to remove member");
    },
  });

  // ── Mutation: Leave Group ──
  const { mutate: handleLeaveGroup, isPending: isLeaving } = useMutation({
    mutationFn: () => exitGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-threads"] });
      toast.success("You left the group");
      onClose();
      onLeaveGroup?.();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Failed to leave group");
    },
  });

  // ── Mutation: Toggle Admin Role ──
  const { mutate: handleToggleAdmin } = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'admin' | 'member' }) =>
      toggleAdminRole(groupId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-info", groupId] });
      toast.success("Role updated successfully");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Failed to update role");
    },
  });

  // ── Mutation: Update Permissions ──
  const { mutate: handleUpdatePermissions, isPending: isUpdatingPermissions } = useMutation({
    mutationFn: (permissions: any) => updateGroupPermissions(groupId, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-info", groupId] });
      toast.success("Group permissions updated");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Failed to update permissions");
    },
  });

  // ── Mutation: Update Info (Name, Description) ──
  const { mutateAsync: handleUpdateGroupInfo } = useMutation({
    mutationFn: (updates: { name: string, description: string }) => updateGroupInfo(groupId, updates.name, updates.description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-threads"] });
      queryClient.invalidateQueries({ queryKey: ["group-info", groupId] });
      toast.success("Group info updated");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Failed to update group info");
    }
  });

  // ── Handlers ──
  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload({ file: e.target.files[0], type: "avatar" });
    }
  };

  const confirmRemove = (userId: string, name: string) => {
    if (window.confirm(`Remove ${name} from this group?`)) {
      handleRemoveMember(userId);
    }
  };

  const confirmLeave = () => {
    if (window.confirm("Are you sure you want to leave this group?")) {
      handleLeaveGroup();
    }
  };

  const confirmToggleAdmin = (userId: string, name: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "member" : "admin";
    const action = newRole === "admin" ? "Promote" : "Demote";
    if (window.confirm(`${action} ${name} to ${newRole}?`)) {
      handleToggleAdmin({ userId, role: newRole });
    }
  };

  // ── Derived: Available users to add (exclude already-members) ──
  const memberIds = new Set(data?.members?.map((m) => m.userId) || []);
  const availableUsers = (orgUsersData || []).filter(
    (u: OrgUser) => !memberIds.has(u._id) && u.name.toLowerCase().includes(addSearch.toLowerCase())
  );
  // ── Fullscreen Photo Viewer ──
  if (viewingPhoto) {
    return (
      <FilePreviewModal
        file={{ src: viewingPhoto, name: data?.group?.name || "Group Photo" }}
        onClose={() => setViewingPhoto(null)}
      />
    );
  }

  return (
    <div className="absolute inset-0 z-50 bg-background overflow-y-auto animate-in fade-in duration-200">
      {/* Breadcrumb Header */}
      <div className="sticky top-0 z-50 w-full h-14 bg-background/95 backdrop-blur border-b border-border flex items-center justify-center px-4 md:px-6">
        <div className="flex items-center text-sm text-muted-foreground">
          <button className="cursor-pointer hover:text-foreground hover:underline transition-colors focus:outline-none" onClick={onClose}>Chat</button>
          <span className="mx-2 opacity-50">/</span>
          <button className="cursor-pointer hover:text-foreground hover:underline transition-colors focus:outline-none" onClick={onClose}>{data?.group?.name || "Group"}</button>
          <span className="mx-2 opacity-50">/</span>
          <span className="font-semibold text-foreground">Settings</span>
        </div>
      </div>

      <div className="w-full">
        {isLoading ? (
          <div className="flex-1 flex justify-center items-center h-full min-h-[200px]">
            <Spinner className="w-8 h-8 text-primary" />
          </div>
        ) : isError || !data ? (
          <div className="text-red-500 text-sm py-8 px-4 max-w-2xl mx-auto">Failed to load group info</div>
        ) : (
          <SharedProfilePage
            mode="group"
            groupData={data}
            onClose={onClose}
            onUpdateGroup={async (updates) => {
              await handleUpdateGroupInfo(updates);
            }}
            onUpdateGroupPhoto={async (blob, type) => {
              const file = new File([blob], `${type}.jpg`, { type: blob.type });
              await handleUpload({ file, type });
            }}
          >
            {/* ═══════════════════════════════════════════════ */}
            {/* Members Section                                */}
            {/* ═══════════════════════════════════════════════ */}
            <div className="w-full max-w-[1000px] mx-auto bg-muted/20 rounded-xl p-4 border border-border mt-4">
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-border">
                <h4 className="text-sm font-semibold text-foreground">Group Members</h4>
                {/* Add Member Button — Admin Only */}
                {data.myRole === "admin" && (
                  <button
                    onClick={() => setShowAddMember(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Add Member
                  </button>
                )}
              </div>

              {/* ── Member List ── */}
              <div className="space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar pr-2 pt-2">
                {(() => {
                  const creator = data.members.find((m) => m.userId === data.group.created_by);
                  const admins = data.members.filter((m) => m.role === "admin" && m.userId !== data.group.created_by);
                  const regularMembers = data.members.filter((m) => m.role === "member" && m.userId !== data.group.created_by);
                  
                  const renderMemberGroup = (title: string, membersList: any[], emptyMsg?: string) => {
                    if (membersList.length === 0 && !emptyMsg) return null;
                    return (
                      <div className="mb-4">
                        <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-2">{title}</h5>
                        <div className="space-y-0.5">
                          {membersList.length === 0 && emptyMsg && (
                            <p className="text-xs text-muted-foreground px-2 py-1">{emptyMsg}</p>
                          )}
                          {membersList.map((member) => {
                            const isCreator = member.userId === data.group.created_by;
                            const canRemove = data.myRole === "admin" && !isCreator;
                            
                            return (
                              <div
                                key={member.userId}
                                className="flex items-center justify-between p-2 rounded-lg hover:bg-background/80 transition-colors group/member cursor-pointer"
                                onClick={() => onUserClick?.(member.userId)}
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  {member.profilePicture ? (
                                    <img
                                      src={member.profilePicture}
                                      className="w-10 h-10 rounded-full object-cover border border-border shrink-0 cursor-pointer"
                                      alt=""
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold border border-border shrink-0">
                                      {member.name[0]?.toUpperCase()}
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <span className="text-sm font-medium text-foreground block truncate group-hover/member:underline">
                                      {member.name}
                                    </span>
                                    {member.userRole && (
                                      <span className="text-[10px] text-muted-foreground block truncate">
                                        {member.userRole === 'super_admin' ? 'Super Admin' : member.userRole === 'org_admin' ? 'Org Admin' : member.userRole.charAt(0).toUpperCase() + member.userRole.slice(1)}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {/* Role Badge */}
                                  {isCreator ? (
                                    <span className="text-[10px] font-bold bg-warning/10 text-warning px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                                      <Crown className="w-3 h-3" /> Owner
                                    </span>
                                  ) : member.role === "admin" ? (
                                    <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-full uppercase tracking-wider shadow-sm">
                                      Admin
                                    </span>
                                  ) : null}

                                  {/* Actions — Admin only, not for creator */}
                                  {canRemove && (
                                    <div className="flex items-center opacity-0 group-hover/member:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                      <button
                                        onClick={() => confirmToggleAdmin(member.userId, member.name, member.role)}
                                        className="p-1.5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer mr-1"
                                        title={member.role === "admin" ? `Demote ${member.name} to member` : `Promote ${member.name} to admin`}
                                      >
                                        {member.role === "admin" ? <Shield className="w-4 h-4 text-primary opacity-50" /> : <Shield className="w-4 h-4" />}
                                      </button>
                                      <button
                                        onClick={() => confirmRemove(member.userId, member.name)}
                                        className="p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                                        title={`Remove ${member.name}`}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  };

                  return (
                    <>
                      {creator && renderMemberGroup("Owner", [creator])}
                      {renderMemberGroup("Admins", admins)}
                      {renderMemberGroup("Members", regularMembers, "No other members")}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* ═══════════════════════════════════════════════ */}
            {/* Admin Settings Section                         */}
            {/* ═══════════════════════════════════════════════ */}
            {data.myRole === "admin" && (
              <div className="w-full max-w-[1000px] mx-auto mt-2">
                <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
                  <h4 className="text-sm font-semibold text-foreground">Group Settings</h4>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full text-primary">
                        <Megaphone className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">Announcement Mode</span>
                        <span className="text-xs text-muted-foreground">Only admins can send messages</span>
                      </div>
                    </div>
                    
                    {/* Toggle Switch */}
                    <Switch
                      checked={data.group.send_messages_policy === 'admin_only'}
                      disabled={isUpdatingPermissions}
                      onCheckedChange={(checked) => {
                        handleUpdatePermissions({ send_messages: checked ? 'admin_only' : 'all' });
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full text-primary">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">Restrict Info Edits</span>
                        <span className="text-xs text-muted-foreground">Only admins can edit group info & photo</span>
                      </div>
                    </div>
                    
                    {/* Toggle Switch */}
                    <Switch
                      checked={data.group.edit_info_policy === 'admin_only'}
                      disabled={isUpdatingPermissions}
                      onCheckedChange={(checked) => {
                        handleUpdatePermissions({ edit_info: checked ? 'admin_only' : 'all' });
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════ */}
            {/* Leave Group Button                             */}
            {/* ═══════════════════════════════════════════════ */}
            <div className="w-full max-w-[1000px] mx-auto mt-2 pt-4 border-t border-border">
              <button
                onClick={confirmLeave}
                disabled={isLeaving}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isLeaving ? (
                  <Spinner className="w-4 h-4" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
                Leave Group
              </button>
            </div>
          </SharedProfilePage>
        )}
      </div>
      <AnimatePresence>
        {showAddMember && data?.myRole === "admin" && (
          <AddGroupMemberSidebar
            onClose={() => setShowAddMember(false)}
            onBack={() => setShowAddMember(false)}
            users={orgUsersData || []}
            currentUserId={data.myRole === 'admin' ? '' : ''} // Pass a valid user ID if needed, but we rely on existingMemberIds
            onAddMembers={handleAddMembers}
            isLoading={isAdding}
            existingMemberIds={Array.from(memberIds)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
