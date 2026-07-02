import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Spinner } from "@/components/marketing_ui/spinner";
import { fetchPollVoters } from "../services/chatApi";
import { OrgUser } from "../../org/services/orgApi";
import { Poll } from "../services/chatApi";
import { toast } from "sonner";

interface ViewPollVotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  poll: Poll | null;
  threadOrGroupId: string;
  isGroup: boolean;
  orgUsers: OrgUser[];
}

export function ViewPollVotesModal({
  isOpen,
  onClose,
  poll,
  threadOrGroupId,
  isGroup,
  orgUsers,
}: ViewPollVotesModalProps) {
  const [voters, setVoters] = useState<{ option_id: string; user_id: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && poll) {
      const loadVoters = async () => {
        setIsLoading(true);
        try {
          const data = await fetchPollVoters(poll.id, threadOrGroupId, isGroup);
          setVoters(data);
        } catch (err: any) {
          toast.error("Failed to load voters");
        } finally {
          setIsLoading(false);
        }
      };
      loadVoters();
    }
  }, [isOpen, poll, threadOrGroupId, isGroup]);

  if (!isOpen || !poll) return null;

  // Group voters by option
  const groupedVoters: Record<string, typeof voters> = {};
  voters.forEach(v => {
    if (!groupedVoters[v.option_id]) groupedVoters[v.option_id] = [];
    groupedVoters[v.option_id].push(v);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-sm flex flex-col border border-border animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="text-lg font-bold text-foreground">Poll Results</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
          {isLoading ? (
            <div className="flex justify-center py-8"><Spinner className="w-6 h-6" /></div>
          ) : (
            poll.options.map((rawOpt, i) => {
              const opt = typeof rawOpt === 'string' ? { id: String.fromCharCode(97 + i), text: rawOpt } : rawOpt;
              const optionVoters = groupedVoters[opt.id] || [];
              const count = optionVoters.length;
              if (count === 0) return null; // Don't show options with 0 votes

              return (
                <div key={opt.id} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">{opt.text}</span>
                    <span className="text-xs font-medium text-muted-foreground">{count} {count === 1 ? 'vote' : 'votes'}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {optionVoters.map((v, idx) => {
                      const user = orgUsers.find(u => u._id === v.user_id);
                      return (
                        <div key={idx} className="flex items-center gap-2">
                          {user?.profilePicture ? (
                            <img src={user.profilePicture} className="w-6 h-6 rounded-full object-cover shrink-0" alt="avatar" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 uppercase">
                              {user?.name?.[0] || '?'}
                            </div>
                          )}
                          <span className="text-sm text-foreground truncate">{user?.name || 'Unknown User'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
