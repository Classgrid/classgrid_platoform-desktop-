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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111b21] rounded-2xl shadow-2xl w-full max-w-md flex flex-col border border-black/10 dark:border-white/10 animate-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-black/5 dark:border-white/5 shrink-0 bg-gray-50/50 dark:bg-white/5">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Poll Results</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 flex flex-col gap-2 overflow-y-auto max-h-[70vh] custom-scrollbar">
          {isLoading ? (
            <div className="flex justify-center py-10"><Spinner className="w-8 h-8 text-[#00a884]" /></div>
          ) : (
            poll.options.map((rawOpt, i) => {
              const opt = typeof rawOpt === 'string' ? { id: String.fromCharCode(97 + i), text: rawOpt } : rawOpt;
              const optionVoters = groupedVoters[opt.id] || [];
              const count = optionVoters.length;
              if (count === 0) return null; 

              const totalVotes = voters.length;
              const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;

              return (
                <div key={opt.id} className="flex flex-col gap-3 p-4 bg-white dark:bg-[#182229] rounded-xl border border-black/5 dark:border-white/5 transition-colors">
                  
                  {/* Option Header */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-[15px] font-bold text-gray-900 dark:text-gray-100 leading-snug">{opt.text}</span>
                      <span className="text-xs font-bold text-[#00a884] shrink-0 bg-[#00a884]/10 dark:bg-[#00a884]/20 px-2.5 py-1 rounded-full uppercase tracking-wide">
                        {count} {count === 1 ? 'vote' : 'votes'}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden mt-1">
                       <div className="h-full bg-[#00a884] rounded-full transition-all duration-500 ease-out" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>

                  {/* Voters List */}
                  <div className="flex flex-col gap-3 mt-3">
                    {optionVoters.map((v, idx) => {
                      const user = orgUsers.find(u => u._id === v.user_id);
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          {user?.profilePicture ? (
                            <img src={user.profilePicture} className="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-white dark:ring-[#111b21]" alt="avatar" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-[#005c4b]/30 text-[#005c4b] dark:text-[#34d399] flex items-center justify-center text-xs font-bold shrink-0 uppercase ring-2 ring-white dark:ring-[#111b21]">
                              {user?.name?.[0] || '?'}
                            </div>
                          )}
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{user?.name || 'Unknown User'}</span>
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
