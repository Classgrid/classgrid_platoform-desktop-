import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Camera, Users, Shield, Trash2, UserPlus, LogOut, Search, Crown, FileBox, ChevronRight } from "lucide-react";
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
import { SharedProfilePage } from "../../shared/pages/SharedProfilePage";
import { SharedMediaView } from "../../shared/components/SharedMediaView";
import { DEFAULT_USER_AVATAR } from "@/lib/constants";
import { Spinner } from "@/components/marketing_ui/spinner";
import { Switch } from "@/components/marketing_ui/switch";
import { Button } from "@/components/marketing_ui/button";
import { useOnlineUsers } from "../context/PresenceContext";
import { useCurrentUser } from "@/features/auth/queries/useCurrentUser";

import { Input } from "@/components/marketing_ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/marketing_ui/select";

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
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const onlineUsers = useOnlineUsers();

  // ── Local UI State ──
  const [showAddMember, setShowAddMember] = useState(initialShowAddMember || false);
  const [addSearch, setAddSearch] = useState("");
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"settings" | "shared-media">("settings");

  // ── Data: Group Info ──
  const { data, isLoading, isError, error } = useQuery({
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
  const { mutateAsync: handleUpload, isPending: isUploading } = useMutation({
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

  const onlineMembersCount = data?.members?.filter(m => onlineUsers?.has(m.userId)).length || 0;

  return (
    <div className="absolute inset-0 z-50 bg-slate-50 dark:bg-background overflow-hidden animate-in fade-in duration-200 flex flex-col">
      {/* Breadcrumb Header */}
      <div className="shrink-0 z-50 w-full h-14 bg-background/95 backdrop-blur border-b border-border flex items-center justify-center px-4 md:px-6">
        <div className="flex items-center text-sm text-muted-foreground">
          <button className="cursor-pointer hover:text-foreground hover:underline transition-colors focus:outline-none" onClick={onClose}>Chat</button>
          <span className="mx-2 opacity-50">/</span>
          <button className="cursor-pointer hover:text-foreground hover:underline transition-colors focus:outline-none" onClick={() => setActiveView("settings")}>{data?.group?.name || "Group"}</button>
          <span className="mx-2 opacity-50">/</span>
          {activeView === "shared-media" ? (
            <span className="font-semibold text-foreground">Media, Links & Docs</span>
          ) : (
            <span className="font-semibold text-foreground">Settings</span>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto w-full relative">
        <div className="min-h-full flex flex-col pb-12">
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
            {activeView === "shared-media" ? (
              <div className="pt-6">
                <SharedMediaView threadId={data.thread?.id} />
              </div>
            ) : (
              <>
                {/* ═══════════════════════════════════════════════ */}
                {/* Media & Docs Button                            */}
                {/* ═══════════════════════════════════════════════ */}
                <div className="w-full max-w-[1000px] mx-auto mt-6 relative group px-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/40 to-blue-500/40 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveView("shared-media")}
                    className="w-full sm:w-auto relative flex items-center justify-between gap-4 py-6 px-6 border-border/50 bg-background/50 dark:bg-muted/10 backdrop-blur-xl hover:bg-muted/50 dark:hover:bg-white/5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-primary/10 text-primary">
                        <FileBox size={18} />
                      </div>
                      <span className="font-semibold text-foreground/90 tracking-wide">Media, Links & Docs</span>
                    </div>
                    <ChevronRight size={18} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </Button>
                </div>

                {/* ═══════════════════════════════════════════════ */}
                {/* Members Section                                */}
                {/* ═══════════════════════════════════════════════ */}
                <div className="w-full max-w-[1000px] mx-auto bg-muted/20 rounded-xl p-4 border border-border mt-4">
                  <div className="flex items-center justify-between pb-3 mb-2 border-b border-border">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      Group Members
                      {onlineMembersCount > 0 && (
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          {onlineMembersCount} online
                        </span>
                      )}
                    </h4>
                {/* Add Member Button — Controlled by Policy */}
                {(() => {
                  const policy = data.group.add_member_policy || 'admin_only';
                  const isOrgAdmin = user?.role === 'super_admin' || user?.role === 'org_admin';
                  const isFaculty = user?.role === 'faculty';
                  const isAdmin = data.myRole === 'admin' || isOrgAdmin;
                  
                  let canAddMember = false;
                  if (policy === 'org_admin_only') canAddMember = isOrgAdmin;
                  else if (policy === 'admin_only') canAddMember = isAdmin;
                  else if (policy === 'admin_faculty') canAddMember = isAdmin || isFaculty;

                  return canAddMember && (
                    <button
                      onClick={() => setShowAddMember(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Add Member
                    </button>
                  );
                })()}
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
                                  <div className="relative">
                                    {member.profilePicture ? (
                                      <img
                                        src={member.profilePicture}
                                        className="w-10 h-10 rounded-full object-cover bg-primary/10 border border-border shrink-0 cursor-pointer"
                                        alt=""
                                      />
                                    ) : (
                                      <img
                                        src={DEFAULT_USER_AVATAR}
                                        className="w-10 h-10 rounded-full object-cover bg-primary/10 border border-border shrink-0 cursor-pointer"
                                        alt=""
                                      />
                                    )}
                                    {onlineUsers?.has(member.userId) && (
                                      <span 
                                        title="Online"
                                        className="absolute bottom-0 right-0 z-10 block w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
                                      />
                                    )}
                                  </div>
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Message Approval */}
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border md:col-span-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full text-primary">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">Require Message Approval</span>
                        <span className="text-xs text-muted-foreground">Student messages must be approved by an admin before others can see them</span>
                      </div>
                    </div>
                    <Switch
                      checked={data.group.require_message_approval}
                      disabled={isUpdatingPermissions}
                      onCheckedChange={(checked) => {
                        handleUpdatePermissions({ require_message_approval: checked });
                      }}
                    />
                  </div>

                  {/* Send Messages Policy */}
                  <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-lg border border-border">
                     <span className="text-sm font-medium text-foreground">Who can send messages?</span>
                     <Select 
                        value={data.group.send_message_policy || data.group.send_messages_policy || 'all'}
                        disabled={isUpdatingPermissions}
                        onValueChange={(value) => handleUpdatePermissions({ send_message_policy: value })}
                     >
                        <SelectTrigger className="w-full bg-background border border-border rounded-md px-3 text-sm h-9">
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="all">Everyone</SelectItem>
                           <SelectItem value="admin_faculty">Admins & Faculty</SelectItem>
                           <SelectItem value="admin_only">Only Admins</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>

                  {/* Reply Policy */}
                  <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-lg border border-border">
                     <span className="text-sm font-medium text-foreground">Who can reply to messages?</span>
                     <Select 
                        value={data.group.reply_policy || 'all'}
                        disabled={isUpdatingPermissions}
                        onValueChange={(value) => handleUpdatePermissions({ reply_policy: value })}
                     >
                        <SelectTrigger className="w-full bg-background border border-border rounded-md px-3 text-sm h-9">
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="all">Everyone</SelectItem>
                           <SelectItem value="admin_faculty">Admins & Faculty</SelectItem>
                           <SelectItem value="admin_only">Only Admins</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>

                  {/* Send Attachments Policy */}
                  <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-lg border border-border">
                     <span className="text-sm font-medium text-foreground">Who can send attachments?</span>
                     <Select 
                        value={data.group.send_attachments_policy || 'all'}
                        disabled={isUpdatingPermissions}
                        onValueChange={(value) => handleUpdatePermissions({ send_attachments_policy: value })}
                     >
                        <SelectTrigger className="w-full bg-background border border-border rounded-md px-3 text-sm h-9">
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="all">Everyone</SelectItem>
                           <SelectItem value="admin_faculty">Admins & Faculty</SelectItem>
                           <SelectItem value="admin_only">Only Admins</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>

                  {/* Add Member Policy */}
                  <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-lg border border-border">
                     <span className="text-sm font-medium text-foreground">Who can add members?</span>
                     <Select 
                        value={data.group.add_member_policy || 'admin_only'}
                        disabled={isUpdatingPermissions}
                        onValueChange={(value) => handleUpdatePermissions({ add_member_policy: value })}
                     >
                        <SelectTrigger className="w-full bg-background border border-border rounded-md px-3 text-sm h-9">
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="admin_only">Only Admins</SelectItem>
                           <SelectItem value="admin_faculty">Admins & Faculty</SelectItem>
                           <SelectItem value="org_admin_only">Only Org Admins</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>

                  {/* Edit Info Policy */}
                  <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-lg border border-border">
                     <span className="text-sm font-medium text-foreground">Who can edit group info?</span>
                     <Select 
                        value={data.group.edit_info_policy || 'admin_only'}
                        disabled={isUpdatingPermissions}
                        onValueChange={(value) => handleUpdatePermissions({ edit_info_policy: value })}
                     >
                        <SelectTrigger className="w-full bg-background border border-border rounded-md px-3 text-sm h-9">
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="admin_only">Group Admins</SelectItem>
                           <SelectItem value="org_admin_only">Only Org Admins</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>

                  {/* Group Type */}
                  <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-lg border border-border">
                     <span className="text-sm font-medium text-foreground">Group Type</span>
                     <Select 
                        value={data.group.group_type || 'general'}
                        disabled={isUpdatingPermissions}
                        onValueChange={(value) => handleUpdatePermissions({ group_type: value })}
                     >
                        <SelectTrigger className="w-full bg-background border border-border rounded-md px-3 text-sm h-9">
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="general">General</SelectItem>
                           <SelectItem value="announcement">Announcement</SelectItem>
                           <SelectItem value="class">Class</SelectItem>
                           <SelectItem value="department">Department</SelectItem>
                           <SelectItem value="subject">Subject</SelectItem>
                           <SelectItem value="exam">Exam</SelectItem>
                           <SelectItem value="fees">Fees</SelectItem>
                           <SelectItem value="admission">Admission</SelectItem>
                           <SelectItem value="faculty">Faculty</SelectItem>
                           <SelectItem value="parent">Parent</SelectItem>
                           <SelectItem value="transport">Transport</SelectItem>
                           <SelectItem value="hostel">Hostel</SelectItem>
                           <SelectItem value="library">Library</SelectItem>
                           <SelectItem value="event">Event</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>

                  {/* Is Official Toggle */}
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">Official Group</span>
                        <span className="text-xs text-muted-foreground">Mark this group as official</span>
                      </div>
                    </div>
                    <Switch
                      checked={data.group.is_official}
                      disabled={isUpdatingPermissions}
                      onCheckedChange={(checked) => {
                        handleUpdatePermissions({ is_official: checked });
                      }}
                    />
                  </div>
                  
                  {/* Require Join Approval Toggle */}
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border md:col-span-2">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">Require Join Approval</span>
                        <span className="text-xs text-muted-foreground">New members must request to join and be approved by an admin</span>
                      </div>
                    </div>
                    <Switch
                      checked={data.group.require_join_approval}
                      disabled={isUpdatingPermissions}
                      onCheckedChange={(checked) => {
                        handleUpdatePermissions({ require_join_approval: checked });
                      }}
                    />
                  </div>

                  {/* Auto-Add Roles */}
                  <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-lg border border-border md:col-span-2">
                    <span className="text-sm font-medium text-foreground">Auto-Add Members by Role</span>
                    <span className="text-xs text-muted-foreground mb-2">Users with these roles will be automatically added as regular members.</span>
                    <div className="flex flex-wrap gap-2">
                      {['student', 'faculty', 'hod', 'principal', 'vice_principal', 'exam_controller', 'fee_manager', 'coordinator', 'teacher'].map(role => {
                        const currentRoles = data.group.auto_add_roles || [];
                        const isSelected = currentRoles.includes(role);
                        return (
                          <button
                            key={role}
                            disabled={isUpdatingPermissions}
                            onClick={() => {
                              const newRoles = isSelected
                                ? currentRoles.filter((r: string) => r !== role)
                                : [...currentRoles, role];
                              handleUpdatePermissions({ auto_add_roles: newRoles });
                            }}
                            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                              isSelected 
                                ? 'bg-primary text-primary-foreground border-primary' 
                                : 'bg-background text-foreground border-border hover:border-primary/50'
                            }`}
                          >
                            {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Auto-Grant Admin Roles */}
                  <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-lg border border-border md:col-span-2">
                    <span className="text-sm font-medium text-foreground">Auto-Grant Admin by Role</span>
                    <span className="text-xs text-muted-foreground mb-2">Users with these roles will be automatically granted Admin access in this group.</span>
                    <div className="flex flex-wrap gap-2">
                      {['student', 'faculty', 'hod', 'principal', 'vice_principal', 'exam_controller', 'fee_manager', 'coordinator', 'teacher'].map(role => {
                        const currentRoles = data.group.admin_roles || [];
                        const isSelected = currentRoles.includes(role);
                        return (
                          <button
                            key={role}
                            disabled={isUpdatingPermissions}
                            onClick={() => {
                              const newRoles = isSelected
                                ? currentRoles.filter((r: string) => r !== role)
                                : [...currentRoles, role];
                              handleUpdatePermissions({ admin_roles: newRoles });
                            }}
                            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                              isSelected 
                                ? 'bg-primary text-primary-foreground border-primary' 
                                : 'bg-background text-foreground border-border hover:border-primary/50'
                            }`}
                          >
                            {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Actions Row */}
                  <div className="flex items-center gap-3 mt-2 md:col-span-2">
                     <button
                        className="flex-1 py-2 rounded bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
                        onClick={() => {
                          onClose();
                          if (user?.role === 'super_admin') {
                            navigate('/superadmin/audit'); 
                          } else if (user?.role === 'org_admin') {
                            navigate('/org/audit');
                          } else {
                            navigate('/audit'); 
                          }
                        }}
                     >
                        Audit Logs
                     </button>
                     <button
                        className="flex-1 py-2 rounded bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
                        onClick={() => {
                          onClose();
                          navigate(`/join-requests/${groupId}`);
                        }}
                     >
                        Join Requests
                     </button>
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
            </>
            )}
          </SharedProfilePage>
        )}
        </div>
      </div>
      <AnimatePresence>
        {isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50">
            <Spinner className="w-8 h-8" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-destructive/10 text-destructive text-sm font-medium px-4 py-3 rounded-lg border border-destructive/20">
              {error instanceof Error ? error.message : "An error occurred"}
            </div>
          </div>
        )}
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
