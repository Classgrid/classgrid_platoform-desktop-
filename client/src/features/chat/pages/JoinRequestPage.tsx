import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchUnifiedRequests, processJoinRequest } from "../services/chatApi";
import { ArrowLeft, Check, X, Users, Search, Clock, Shield } from "lucide-react";
import { toast } from "sonner";
import { DEFAULT_USER_AVATAR } from "@/lib/constants";
import { Spinner } from "@/components/marketing_ui/spinner";
import { useCurrentUser } from "@/features/auth/queries/useCurrentUser";

export function JoinRequestPage() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');

  const { data, isLoading } = useQuery({
    queryKey: ["join-requests", "unified"],
    queryFn: fetchUnifiedRequests,
  });

  const { mutate: processRequest, isPending: isProcessing } = useMutation({
    mutationFn: ({ groupId, requestId, status }: { groupId: string; requestId: string; status: 'approved' | 'rejected' }) => 
      processJoinRequest(groupId, requestId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["join-requests", "unified"] });
      toast.success(`Request ${variables.status}`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Failed to process request");
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="w-8 h-8 text-primary" />
      </div>
    );
  }

  const isStudent = user?.role === 'student';
  // Force student to see outgoing if somehow they end up on incoming
  const currentTab = isStudent ? 'outgoing' : activeTab;

  const incomingRequests = data?.incoming || [];
  const outgoingRequests = data?.outgoing || [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Requests</h1>
              <p className="text-xs text-muted-foreground">Manage your group join requests</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 py-8 w-full flex-1">
        
        {/* Tabs */}
        {!isStudent && (
          <div className="flex gap-4 border-b border-border mb-8">
            <button
              onClick={() => setActiveTab('incoming')}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 relative ${
                currentTab === 'incoming' ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-foreground hover:border-border'
              }`}
            >
              Incoming Requests
              {incomingRequests.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center bg-primary text-primary-foreground text-[10px] font-bold w-4 h-4 rounded-full">
                  {incomingRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('outgoing')}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                currentTab === 'outgoing' ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-foreground hover:border-border'
              }`}
            >
              My Requests
            </button>
          </div>
        )}

        {isStudent && (
          <div className="mb-6">
            <h2 className="text-lg font-bold">My Requests</h2>
          </div>
        )}

        {/* Content */}
        {currentTab === 'incoming' && (
          <div className="space-y-4">
            {incomingRequests.length === 0 ? (
              <div className="text-center py-20 bg-muted/20 rounded-xl border border-border border-dashed">
                <Shield className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium">All caught up</h3>
                <p className="text-muted-foreground text-sm mt-1">You have no pending requests to approve.</p>
              </div>
            ) : (
              incomingRequests.map((req) => (
                <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-card border border-border rounded-xl shadow-sm gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <img 
                      src={req.user_avatar || DEFAULT_USER_AVATAR} 
                      alt={req.user_name} 
                      className="w-12 h-12 rounded-full object-cover bg-primary/10 border border-border shrink-0"
                    />
                    <div>
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        {req.user_name}
                      </h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> Requested to join <strong className="text-foreground">{req.group?.name}</strong> on {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <button
                      onClick={() => processRequest({ groupId: req.group_id, requestId: req.id, status: 'approved' })}
                      disabled={isProcessing}
                      className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg transition-colors disabled:opacity-50 text-sm font-medium shadow-sm"
                    >
                      <Check className="w-4 h-4" /> Accept
                    </button>
                    <button
                      onClick={() => processRequest({ groupId: req.group_id, requestId: req.id, status: 'rejected' })}
                      disabled={isProcessing}
                      className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
                    >
                      <X className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {currentTab === 'outgoing' && (
          <div className="space-y-4">
            {outgoingRequests.length === 0 ? (
              <div className="text-center py-20 bg-muted/20 rounded-xl border border-border border-dashed">
                <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium">No requests sent</h3>
                <p className="text-muted-foreground text-sm mt-1">You haven't requested to join any groups recently.</p>
              </div>
            ) : (
              outgoingRequests.map((req) => (
                <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-card border border-border rounded-xl shadow-sm gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 overflow-hidden">
                       {req.group?.avatar ? (
                          <img src={req.group.avatar} alt={req.group.name} className="w-full h-full object-cover" />
                       ) : (
                          <Users className="w-5 h-5 text-primary" />
                       )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{req.group?.name || 'Unknown Group'}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Requested on {new Date(req.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center self-start sm:self-center">
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider ${
                      req.status === 'pending' ? 'bg-warning/10 text-warning' :
                      req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
                      'bg-destructive/10 text-destructive'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}
