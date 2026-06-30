import { useState, useRef } from "react";
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
  type OrgUser,
} from "../services/chatApi";
import { Spinner } from "@/components/marketing_ui/spinner";
import { Switch } from "@/components/marketing_ui/switch";
import { toast } from "sonner";
import { PhotoViewerModal } from "./PhotoViewerModal";
import { Megaphone } from "lucide-react";

import { Button } from "@/components/marketing_ui/button";
import { Input } from "@/components/marketing_ui/input";

interface GroupSettingsModalProps {
  groupId: string;
  onClose: () => void;
  onLeaveGroup?: () => void;
}

export function GroupSettingsModal({ groupId, onClose, onLeaveGroup }: GroupSettingsModalProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Local UI State ──
  const [showAddMember, setShowAddMember] = useState(false);
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
    mutationFn: (file: File) => uploadGroupPhoto(groupId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-threads"] });
      queryClient.invalidateQueries({ queryKey: ["group-info", groupId] });
      toast.success("Group photo updated!");
    },
    onError: () => {
      toast.error("Failed to upload photo");
    },
  });

  // ── Mutation: Add Member ──
  const { mutate: handleAddMember, isPending: isAdding } = useMutation({
    mutationFn: (userId: string) => addGroupMember(groupId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-info", groupId] });
      queryClient.invalidateQueries({ queryKey: ["chat-threads"] });
      toast.success("Member added!");
      setAddSearch("");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Failed to add member");
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

  // ── Handlers ──
  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
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
      <PhotoViewerModal
        src={viewingPhoto}
        alt={data?.group?.name || "Group Photo"}
        onClose={() => setViewingPhoto(null)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-md flex flex-col max-h-[85vh] border border-border animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
            Group Info
          </h2>
          <Button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 flex flex-col items-center">
            {isLoading ? (
              <div className="flex-1 flex justify-center items-center h-full min-h-[200px]">
                <Spinner className="w-8 h-8 text-primary" />
              </div>
            ) : isError || !data ? (
              <div className="text-red-500 text-sm py-8">Failed to load group info</div>
            ) : (
              <>
                {/* Avatar Section */}
                <div className="relative group mb-4">
                  {data.group.avatar_url ? (
                    <img
                      src={data.group.avatar_url}
                      alt={data.group.name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-md cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setViewingPhoto(data.group.avatar_url!)}
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary border-4 border-background shadow-md">
                      <Users className="w-10 h-10" />
                    </div>
                  )}

                  {/* Admin Upload Overlay */}
                  {data.myRole === "admin" && (
                    <>
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-100 cursor-pointer"
                      >
                        {isUploading ? (
                          <Spinner className="w-6 h-6 text-white" />
                        ) : (
                          <>
                            <Camera className="w-6 h-6 mb-1" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                              Change
                            </span>
                          </>
                        )}
                      </Button>
                      <Input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={onFileSelect}
                      />
                    </>
                  )}
                </div>

                {/* Group Name & Role */}
                <h3 className="text-xl font-bold text-foreground mb-1">{data.group.name}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mb-6">
                  {data.myRole === "admin" && <Shield className="w-3.5 h-3.5 text-primary" />}
                  {data.members.length} {data.members.length === 1 ? "member" : "members"}
                </p>

                {/* ═══════════════════════════════════════════════ */}
                {/* Members Section                                */}
                {/* ═══════════════════════════════════════════════ */}
                <div className="w-full">
                  <div className="flex items-center justify-between border-b border-border pb-2 mb-2">
                    <h4 className="text-sm font-semibold text-foreground">Members</h4>
                    {/* Add Member Button — Admin Only */}
                    {data.myRole === "admin" && (
                      <Button
                        onClick={() => setShowAddMember(!showAddMember)}
                        className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4" />
                        Add Member
                      </Button>
                    )}
                  </div>

                  {/* ── Add Member Panel (Admin Only) ── */}
                  {showAddMember && data.myRole === "admin" && (
                    <div className="mb-3 p-3 bg-muted/50 rounded-lg border border-border animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="relative mb-2">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Search users..."
                          value={addSearch}
                          onChange={(e) => setAddSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
                          autoFocus
                        />
                      </div>
                      <div className="max-h-[160px] overflow-y-auto custom-scrollbar space-y-0.5">
                        {availableUsers.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-3">
                            {addSearch ? "No matching users found" : "No users available to add"}
                          </p>
                        ) : (
                          availableUsers.map((user: OrgUser) => (
                            <Button
                              key={user._id}
                              onClick={() => handleAddMember(user._id)}
                              disabled={isAdding}
                              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-primary/10 transition-colors text-left disabled:opacity-50 cursor-pointer"
                            >
                              {user.profilePicture ? (
                                <img
                                  src={user.profilePicture}
                                  className="w-8 h-8 rounded-full object-cover border border-border"
                                  alt=""
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold border border-border">
                                  {user.name[0]?.toUpperCase()}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium text-foreground block truncate">
                                  {user.name}
                                </span>
                                {user.email && (
                                  <span className="text-[10px] text-muted-foreground block truncate">
                                    {user.email}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                                Add
                              </span>
                            </Button>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── Member List ── */}
                  <div className="space-y-0.5 max-h-[240px] overflow-y-auto custom-scrollbar">
                    {data.members.map((member) => {
                      const isCreator = member.userId === data.group.created_by;
                      const canRemove =
                        data.myRole === "admin" && !isCreator;

                      return (
                        <div
                          key={member.userId}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group/member"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {member.profilePicture ? (
                              <img
                                src={member.profilePicture}
                                className="w-9 h-9 rounded-full object-cover border border-border shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                                alt=""
                                onClick={() => member.profilePicture && setViewingPhoto(member.profilePicture)}
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold border border-border shrink-0">
                                {member.name[0]?.toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <span className="text-sm font-medium text-foreground block truncate">
                                {member.name}
                              </span>
                              {member.email && (
                                <span className="text-[10px] text-muted-foreground block truncate">
                                  {member.email}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Role Badge */}
                            {isCreator ? (
                              <span className="text-[10px] font-bold bg-warning/10 text-warning px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                <Crown className="w-3 h-3" /> Creator
                              </span>
                            ) : member.role === "admin" ? (
                              <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Admin
                              </span>
                            ) : null}

                            {/* Actions — Admin only, not for creator */}
                            {canRemove && (
                              <div className="flex items-center opacity-0 group-hover/member:opacity-100 transition-opacity">
                                <Button
                                  onClick={() => confirmToggleAdmin(member.userId, member.name, member.role)}
                                  className="p-1.5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer mr-1"
                                  title={member.role === "admin" ? `Demote ${member.name} to member` : `Promote ${member.name} to admin`}
                                >
                                  {member.role === "admin" ? <Shield className="w-4 h-4 text-primary opacity-50" /> : <Shield className="w-4 h-4" />}
                                </Button>
                                <Button
                                  onClick={() => confirmRemove(member.userId, member.name)}
                                  className="p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                                  title={`Remove ${member.name}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ═══════════════════════════════════════════════ */}
                {/* Admin Settings Section                         */}
                {/* ═══════════════════════════════════════════════ */}
                {data.myRole === "admin" && (
                  <div className="w-full mt-6">
                    <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
                      <h4 className="text-sm font-semibold text-foreground">Group Settings</h4>
                    </div>
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
                        checked={data.group.permissions?.send_messages === 'admin_only'}
                        disabled={isUpdatingPermissions}
                        onCheckedChange={(checked) => {
                          handleUpdatePermissions({ send_messages: checked ? 'admin_only' : 'all' });
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* ═══════════════════════════════════════════════ */}
                {/* Leave Group Button                             */}
                {/* ═══════════════════════════════════════════════ */}
                <div className="w-full mt-6 pt-4 border-t border-border">
                  <Button
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
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
