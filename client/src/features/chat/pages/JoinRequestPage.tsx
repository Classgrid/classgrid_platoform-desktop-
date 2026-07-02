import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJoinRequests, processJoinRequest, JoinRequest, fetchGroupInfo } from "../services/chatApi";
import { ArrowLeft, Check, X } from "lucide-react";
import { toast } from "sonner";
import { DEFAULT_USER_AVATAR } from "@/lib/constants";
import { Spinner } from "@/components/marketing_ui/spinner";
import { useCurrentUser } from "@/features/auth/queries/useCurrentUser";

export function JoinRequestPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();

  const { data: groupData, isLoading: isGroupLoading } = useQuery({
    queryKey: ["group-info", groupId],
    queryFn: () => fetchGroupInfo(groupId!),
    enabled: !!groupId,
  });

  const { data: requests, isLoading: isRequestsLoading } = useQuery({
    queryKey: ["join-requests", groupId],
    queryFn: () => fetchJoinRequests(groupId!),
    enabled: !!groupId,
  });

  const { mutate: processRequest, isPending: isProcessing } = useMutation({
    mutationFn: ({ requestId, status }: { requestId: string; status: 'approved' | 'rejected' }) => 
      processJoinRequest(groupId!, requestId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["join-requests", groupId] });
      toast.success(`Request ${variables.status}`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Failed to process request");
    }
  });

  if (isGroupLoading || isRequestsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="w-8 h-8 text-primary" />
      </div>
    );
  }

  const isAdmin = groupData?.myRole === 'admin' || user?.role === 'super_admin' || user?.role === 'org_admin';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-4">
          <div>
            <h1 className="font-bold text-lg">Join Requests</h1>
            <p className="text-xs text-muted-foreground">{groupData?.group?.name || 'Group'}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 py-8">
        {!requests || requests.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-xl border border-border border-dashed">
            <p className="text-muted-foreground">No join requests found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div key={req.id} className="flex items-center justify-between p-4 bg-muted/20 border border-border rounded-xl">
                <div className="flex items-center gap-4">
                  <img 
                    src={req.user_avatar || DEFAULT_USER_AVATAR} 
                    alt={req.user_name} 
                    className="w-12 h-12 rounded-full object-cover bg-primary/10 border border-border"
                  />
                  <div>
                    <h3 className="font-semibold text-sm">{req.user_name}</h3>
                    <p className="text-xs text-muted-foreground">Requested on {new Date(req.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Status Badge */}
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    req.status === 'pending' ? 'bg-warning/10 text-warning' :
                    req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
                    'bg-destructive/10 text-destructive'
                  }`}>
                    {req.status}
                  </span>

                  {/* Admin Actions */}
                  {isAdmin && req.status === 'pending' && (
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => processRequest({ requestId: req.id, status: 'approved' })}
                        disabled={isProcessing}
                        className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-full transition-colors disabled:opacity-50"
                        title="Approve Request"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => processRequest({ requestId: req.id, status: 'rejected' })}
                        disabled={isProcessing}
                        className="p-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-full transition-colors disabled:opacity-50"
                        title="Reject Request"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
