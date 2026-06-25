

export function LeadTrackingPage() {
    return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lead Tracking (CRM)</h1>
          <p className="text-muted-foreground mt-1">Track potential leads, inquiries, and follow-ups.</p>
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl shadow-sm mb-6 p-6">
        <div className="text-center p-8 text-muted-foreground">
          <h2 className="text-lg font-bold text-foreground mb-2">CRM Module Upcoming</h2>
          <p>Lead tracking and pre-admission inquiry management is coming soon.</p>
        </div>
      </div>
    </div>
  );
}
