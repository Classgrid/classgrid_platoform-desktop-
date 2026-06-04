import { ActivityFeed, StatTile, TablePanel } from "@/components/dashboard/DashboardWidgets";

export function AttendanceDashboardPage() {
  return (
    <div className="cg-page">
      <div className="cg-page__header cg-page__header--split">
        <div>
          <h1>Attendance Department Dashboard</h1>
          <p>Track attendance across classes and generate compliance reports.</p>
        </div>
        <div className="cg-page__meta">
          <span className="cg-page__meta-label">Today</span>
          <strong>87% Present</strong>
        </div>
      </div>

      <section className="cg-stats-grid">
        <StatTile label="Today Present %" value="87%" meta="Across all classes" />
        <StatTile label="Low Attendance" value="63 students" meta="Below 75% threshold" />
        <StatTile label="Sessions Today" value="42" meta="Lectures conducted" />
        <StatTile label="Avg Monthly %" value="84%" meta="This month's average" />
      </section>

      <section className="cg-two-col">
        <TablePanel
          title="Class-wise Attendance Table"
          actions={["Search", "Filter", "Export"]}
          columns={[
            { key: "className", label: "Class" },
            { key: "present", label: "Present" },
            { key: "absent", label: "Absent" },
            { key: "percentage", label: "%" }
          ]}
          rows={[
            { className: "FYBSc A", present: "38", absent: "7", percentage: "84%" },
            { className: "SYBCom B", present: "42", absent: "3", percentage: "93%" },
            { className: "TYBA C", present: "29", absent: "11", percentage: "72%" }
          ]}
        />
        <div style={{ display: "grid", gap: "0.8rem" }}>
          <ActivityFeed
            title="Low Attendance Alerts"
            entries={[
              { label: "FYBSc A dropped to 72% attendance", time: "9m ago" },
              { label: "Parent notice sent to Rahul S.", time: "36m ago" }
            ]}
          />
          <article className="cg-panel cg-panel--stack">
            <div className="cg-panel__title-row"><h3>Daily Trend</h3></div>
            <p className="cg-panel__text">Mon: <strong>82%</strong></p>
            <p className="cg-panel__text">Tue: <strong>85%</strong></p>
            <p className="cg-panel__text">Wed: <strong>83%</strong></p>
            <p className="cg-panel__text">Thu: <strong>86%</strong></p>
            <p className="cg-panel__text">Fri: <strong>87%</strong></p>
          </article>
        </div>
      </section>
    </div>
  );
}
