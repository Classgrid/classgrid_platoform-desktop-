import { CgSectionPanel, CgPageHeader, CgDataTable, CgFilterToolbar, CgSearchableSelect, CgMetricCard, CgBarChart } from "@/components/classgrid";
import { ExternalLink, Mail, MessageSquare } from "lucide-react";
import { CgSectionPanel, CgPageHeader, CgDataTable, CgFilterToolbar, CgSearchableSelect } from "@/components/classgrid";

export function SupportPage() {
  return (
    <div className="cg-page">
      <div className="cg-page__header">
        <div className="cg-page__header-content">
          <h1 className="cg-page__title">Help & Support</h1>
          <p className="cg-page__description">
            Get help, raise support tickets, and track your conversations with the ClassGrid team.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CgSectionPanel title="Support Portal" icon={<MessageSquare size={18} className="text-emerald-600" />}>
            <div className="flex flex-col h-full justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-6">
                  Visit our dedicated support portal to raise new tickets, track the status of existing requests, and communicate directly with our technical team.
                </p>
              </div>
              <a
                href="https://classgrid.in/support/ticket"
                target="_blank"
                rel="noopener noreferrer"
                className="cg-btn cg-btn--primary w-full justify-center"
              >
                Go to Support Portal
                <ExternalLink size={14} className="ml-2 opacity-80" />
              </a>
            </div>
          </CgSectionPanel>

          <CgSectionPanel title="Contact Us" icon={<Mail size={18} className="text-blue-600" />}>
            <div className="flex flex-col h-full space-y-6">
              <p className="text-muted-foreground text-sm">
                For immediate assistance, billing inquiries, or general questions, you can always reach out to us directly via email or phone.
              </p>
              
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg border border-border">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Email Support
                  </div>
                  <div className="flex flex-col space-y-1">
                    <a href="mailto:support@classgrid.in" className="text-sm font-medium text-foreground hover:text-emerald-600 transition-colors">
                      support@classgrid.in
                    </a>
                    <a href="mailto:nikhil.shinde@classgrid.in" className="text-sm font-medium text-foreground hover:text-emerald-600 transition-colors">
                      nikhil.shinde@classgrid.in
                    </a>
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg border border-border">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Phone Support
                  </div>
                  <div className="flex flex-col space-y-1">
                    <a href="tel:+918623947038" className="text-sm font-medium text-foreground hover:text-emerald-600 transition-colors">
                      +91 8623947038
                    </a>
                    <a href="tel:+918149277038" className="text-sm font-medium text-foreground hover:text-emerald-600 transition-colors">
                      +91 8149277038
                    </a>
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg border border-border">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Headquarters
                  </div>
                  <a 
                    href="https://www.google.com/maps?q=Akurdi+Railway+Station+Road,+Sector+No.+26,+Pradhikaran,+Nigdi,+Pimpri-Chinchwad,+Maharashtra+411044" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-foreground leading-relaxed hover:text-emerald-600 transition-colors block"
                  >
                    Akurdi Railway Station Road, Sector No. 26,<br />
                    Pradhikaran, Nigdi, Pimpri-Chinchwad,<br />
                    Maharashtra 411044
                  </a>
                </div>
              </div>
            </div>
          </CgSectionPanel>
        </div>
      </div>
    </div>
  );
}
