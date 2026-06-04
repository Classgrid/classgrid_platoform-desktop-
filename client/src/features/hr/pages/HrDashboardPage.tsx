import { ActivityFeed, StatTile, TablePanel } from "@/components/dashboard/DashboardWidgets";

export function HrDashboardPage() {
  return (
    <div className="cg-page">
      <div className="cg-page__header cg-page__header--split">
        <div>
          <h1>HR &amp; Payroll Dashboard</h1>
          <p>Manage staff, leaves, and payroll processing.</p>
        </div>
        <div className="cg-page__meta">
          <span className="cg-page__meta-label">Payroll Run</span>
          <strong>30th of month</strong>
        </div>
      </div>

      <section className="cg-stats-grid">
        <StatTile label="Total Staff" value="214" meta="Active employees" />
        <StatTile label="On Leave Today" value="12" meta="Across departments" />
        <StatTile label="Pending Requests" value="9" meta="Leave approvals" />
        <StatTile label="Payroll Status" value="82% Processed" meta="For this cycle" />
      </section>

      <section className="cg-two-col">
        <TablePanel
          title="Leave Requests Table"
          actions={["Search", "Filter", "Export"]}
          columns={[
            { key: "staff", label: "Staff" },
            { key: "type", label: "Type" },
            { key: "from", label: "From" },
            { key: "to", label: "To" },
            { key: "status", label: "Status" }
          ]}
          rows={[
            { staff: "Meera Joshi", type: "Casual", from: "2 May", to: "4 May", status: "Pending" },
            { staff: "Rajesh K.", type: "Sick", from: "28 Apr", to: "29 Apr", status: "Approved" },
            { staff: "Anita P.", type: "Earned", from: "5 May", to: "10 May", status: "Pending" }
          ]}
        />
        <div style={{ display: "grid", gap: "0.8rem" }}>
          <article className="cg-panel cg-panel--stack">
            <div className="cg-panel__title-row"><h3>Payroll Summary</h3></div>
            <p className="cg-panel__text">Processed: <strong>176 staff</strong></p>
            <p className="cg-panel__text">Pending: <strong>38 staff</strong></p>
            <p className="cg-panel__text">Payroll run date: <strong>30th</strong></p>
          </article>
          <ActivityFeed
            title="Recent Activity"
            entries={[
              { label: "Casual leave approved for Meera", time: "7m ago" },
              { label: "Payroll batch processed", time: "41m ago" },
              { label: "New staff added", time: "2h ago" }
            ]}
          />
        </div>
      </section>
    </div>
  );
}
