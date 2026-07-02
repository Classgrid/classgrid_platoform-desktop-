import { useState, useEffect } from "react";
import { Clock, Calendar, Edit2, Trash2, X, AlertCircle } from "lucide-react";
import { fetchScheduledMessages, cancelScheduledMessage, editScheduledMessage, ScheduledMessage } from "../services/chatApi";
import { format } from "date-fns";
import { Spinner } from "@/components/marketing_ui/spinner";
import { useQueryClient } from "@tanstack/react-query";
import { NikhilTimeCalendar } from "@/components/marketing_ui/nikhil_time_calendar";

interface ScheduledMessagesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  threadId: string;
}

export function ScheduledMessagesDrawer({ isOpen, onClose, threadId }: ScheduledMessagesDrawerProps) {
  const [messages, setMessages] = useState<ScheduledMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMessageText, setEditMessageText] = useState("");
  const [editDate, setEditDate] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadMessages();
    }
  }, [isOpen, threadId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchScheduledMessages(threadId);
      setMessages(data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load scheduled messages.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (msgId: string) => {
    if (!window.confirm("Are you sure you want to cancel this scheduled message?")) return;
    try {
      await cancelScheduledMessage(threadId, msgId);
      setMessages(messages.filter(m => m.id !== msgId));
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to cancel message");
    }
  };

  const handleEditClick = (msg: ScheduledMessage) => {
    setEditingId(msg.id);
    setEditMessageText(msg.message);
    const date = new Date(msg.scheduled_for);
    // Format to YYYY-MM-DDThh:mm
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setEditDate(localDate);
  };

  const handleSaveEdit = async (msgId: string) => {
    try {
      setSavingId(msgId);
      const isoDate = new Date(editDate).toISOString();
      const updated = await editScheduledMessage(threadId, msgId, editMessageText, isoDate);
      setMessages(messages.map(m => m.id === msgId ? updated : m));
      setEditingId(null);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to edit message");
    } finally {
      setSavingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-card h-full shadow-2xl flex flex-col border-l border-border animate-in slide-in-from-right duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            <h2 className="font-semibold text-lg text-foreground">Scheduled Messages</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-full text-muted-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
              <Spinner className="w-6 h-6" />
              <p>Loading scheduled messages...</p>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 text-red-500 p-4 rounded-xl flex items-center gap-2 text-sm border border-red-500/20">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{error}</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-foreground mb-1">No scheduled messages</h3>
              <p className="text-sm text-muted-foreground">Any messages you schedule for later will appear here.</p>
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className="bg-background border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                {editingId === msg.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editMessageText}
                      onChange={(e) => setEditMessageText(e.target.value)}
                      className="w-full min-h-[80px] text-sm bg-accent/50 border border-border rounded-lg p-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 resize-none"
                    />
                    <div className="w-full">
                      <NikhilTimeCalendar 
                        value={editDate ? new Date(editDate) : undefined}
                        onChange={(d) => {
                          if (d) {
                            // Format to local ISO string (YYYY-MM-DDThh:mm)
                            const localDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                            setEditDate(localDate);
                          } else {
                            setEditDate("");
                          }
                        }}
                        popDirection="bottom"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-sm font-medium hover:bg-accent rounded-lg text-muted-foreground transition-colors">
                        Cancel
                      </button>
                      <button 
                        onClick={() => handleSaveEdit(msg.id)} 
                        disabled={savingId === msg.id}
                        className="px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                      >
                        {savingId === msg.id ? <Spinner className="w-3 h-3" /> : null}
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(msg.scheduled_for), 'MMM d, yyyy • h:mm a')}
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEditClick(msg)} className="p-1.5 hover:bg-accent rounded-md text-muted-foreground transition-colors" title="Edit">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleCancel(msg.id)} className="p-1.5 hover:bg-red-500/10 text-red-500 rounded-md transition-colors" title="Cancel Message">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-sm text-foreground whitespace-pre-wrap">{msg.message}</p>
                    
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-3 text-xs text-muted-foreground font-medium flex items-center gap-1">
                        📎 {msg.attachments.length} attachment(s)
                      </div>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
