import { ActivityFeed, StatTile, TablePanel } from "@/components/dashboard/DashboardWidgets";

export function HostelDashboardPage() {
  return (
    <div className="cg-page">
      <div className="cg-page__header cg-page__header--split">
        <div>
          <h1>Hostel &amp; Transport Dashboard</h1>
          <p>Manage rooms, residents, transport routes, and complaints.</p>
        </div>
        <div className="cg-page__meta">
          <span className="cg-page__meta-label">Occupancy</span>
          <strong>142 rooms</strong>
        </div>
      </div>

      <section className="cg-stats-grid">
        <StatTile label="Total Residents" value="386" meta="Across all blocks" />
        <StatTile label="Rooms Occupied" value="142" meta="Out of 180 total" />
        <StatTile label="Open Complaints" value="17" meta="Pending resolution" />
        <StatTile label="Bus Routes" value="9" meta="Active routes" />
      </section>

      <section className="cg-two-col">
        <TablePanel
          title="Room Allocation Table"
          actions={["Search", "Filter", "Export"]}
          columns={[
            { key: "block", label: "Block" },
            { key: "floor", label: "Floor" },
            { key: "occupied", label: "Occupied" },
            { key: "vacant", label: "Vacant" }
          ]}
          rows={[
            { block: "Block A", floor: "Ground", occupied: "24", vacant: "4" },
            { block: "Block A", floor: "First", occupied: "26", vacant: "2" },
            { block: "Block B", floor: "Ground", occupied: "22", vacant: "6" }
          ]}
        />
        <div style={{ display: "grid", gap: "0.8rem" }}>
          <ActivityFeed
            title="Recent Complaints"
            entries={[
              { label: "Water issue in Block B room 204", time: "11m ago" },
              { label: "Bus 3 delayed on Route C this morning", time: "58m ago" }
            ]}
          />
          <article className="cg-panel cg-panel--stack">
            <div className="cg-panel__title-row"><h3>Transport Routes Summary</h3></div>
            <p className="cg-panel__text">Route A: <strong>3 buses | 142 students</strong></p>
            <p className="cg-panel__text">Route B: <strong>2 buses | 96 students</strong></p>
            <p className="cg-panel__text">Route C: <strong>4 buses | 188 students</strong></p>
            <p className="cg-panel__text">1 delay reported today</p>
          </article>
        </div>
      </section>
    </div>
  );
}
