import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { CgPageShell, CgSectionPanel, CgAlert, CgSelect } from "@/components/classgrid";
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
    <CgPageShell
      title="Communication"
      description="Send transactional emails and SMS to applicants."
      breadcrumbs={[
        { label: "Admissions", to: "/dept/admissions/dashboard" },
        { label: "Communication" }
      ]}
    >
      {statusMsg && <CgAlert variant={statusMsg.type} title={statusMsg.type === "success" ? "Success" : "Error"}>{statusMsg.text}</CgAlert>}

      <CgSectionPanel title="Send Bulk Notifications">
        <div className="cg-flex-col">
          <label className="cg-text-detail cg-text-muted">Notification Trigger</label>
          <CgSelect 
            value={trigger} 
            onValueChange={setTrigger}
            options={[
              { label: "Fee Payment Reminder", value: "reminder_fee" },
              { label: "Document Verification Pending", value: "reminder_docs" },
              { label: "Merit List Generated", value: "merit_generated" }
            ]} 
          />
          <button 
            className="cg-btn cg-btn--primary cg-self-start"
            disabled={notify.isPending}
            onClick={() => notify.mutate(trigger)}
          >
            {notify.isPending ? <Loader2 size={14} className="cg-spin" /> : <Mail size={14} />}
            Dispatch Notifications
          </button>
        </div>
      </CgSectionPanel>
    </CgPageShell>
  );
}
