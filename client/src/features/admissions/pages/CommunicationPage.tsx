import { ResponsiveSelect } from "@/components/marketing_ui/responsive-select";
import { useState } from "react";
import { Loader2, Mail } from "lucide-react";

import { useMutation } from "@tanstack/react-query";
import { sendNotification } from "../api";

export function CommunicationPage() {
  const [trigger, setTrigger] = useState("reminder_fee");
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "danger"; text: string } | null>(null);

  const notify = useMutation({
    mutationFn: (triggerKey: string) => sendNotification([], triggerKey),
    onSuccess: (data) => setStatusMsg({ type: "success", text: "Notifications queued successfully." }),
    onError: () => setStatusMsg({ type: "danger", text: "Failed to send notifications." })
  });

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Communication</h1>
          <p className="text-muted-foreground mt-1">Send transactional emails and SMS to applicants.</p>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-md border ${statusMsg.type === "success" ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-red-100 text-red-800 border-red-200"}`}>
          <strong>{statusMsg.type === "success" ? "Success" : "Error"}</strong>
          <br/>{statusMsg.text}
        </div>
      )}

      <div className="bg-card border border-border rounded-xl shadow-sm">
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-bold">Send Bulk Notifications</h2>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <label className="text-sm font-medium text-foreground">Notification Trigger</label>
          <ResponsiveSelect 
            value={trigger} 
            onChange={(e) => setTrigger(e.target.value)}
            className="flex h-10 w-full md:max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="reminder_fee">Fee Payment Reminder</option>
            <option value="reminder_docs">Document Verification Pending</option>
            <option value="merit_generated">Merit List Generated</option>
          </ResponsiveSelect>
          <button 
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 py-2 self-start mt-2"
            disabled={notify.isPending}
            onClick={() => notify.mutate(trigger)}
          >
            {notify.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : <Mail size={16} className="mr-2" />}
            Dispatch Notifications
          </button>
        </div>
      </div>
    </div>
  );
}
