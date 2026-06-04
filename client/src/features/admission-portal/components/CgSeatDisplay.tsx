// ═══════════════════════════════════════════════════════════════
// CgSeatDisplay — Shows seat availability per stream/course/standard
//
// Data from GET /api/admission/direct/seat-availability
// Schema follows SeatConfig.model.js:
//   { stream_or_course, total_seats, filled_seats, waitlist_count }
//
// Used inside the form engine when selecting stream/course
// to inform the student whether seats are available.
// ═══════════════════════════════════════════════════════════════

type SeatEntry = {
  stream_or_course: string;
  total_seats: number;
  filled_seats: number;
  waitlist_count: number;
  category_seats?: Record<string, number>;
};

type CgSeatDisplayProps = {
  seats: SeatEntry[];
  selectedValue?: string;
  onSelect?: (value: string) => void;
  label?: string;
};

export function CgSeatDisplay({ seats, selectedValue, onSelect, label }: CgSeatDisplayProps) {
  if (!seats || seats.length === 0) return null;

  return (
    <div className="cg-seat-display__container">
      {label && (
        <div className="cg-seat-display__label">
          {label}
        </div>
      )}
      <div className="cg-seat-display__grid">
        {seats.map((entry) => {
          const available = entry.total_seats - entry.filled_seats;
          const isFull = available <= 0;
          const isSelected = selectedValue === entry.stream_or_course;
          const fillRate = entry.total_seats > 0 ? (entry.filled_seats / entry.total_seats) * 100 : 0;

          let topBarClass = "cg-seat-display__top-bar";
          if (isFull) topBarClass += " cg-seat-display__top-bar--full";
          else if (fillRate > 80) topBarClass += " cg-seat-display__top-bar--warning";
          else topBarClass += " cg-seat-display__top-bar--success";

          let itemClass = "cg-seat-display__item";
          if (isSelected) itemClass += " cg-seat-display__item--selected";
          if (isFull) itemClass += " cg-seat-display__item--full";

          return (
            <div
              key={entry.stream_or_course}
              onClick={() => {
                if (!isFull && onSelect) onSelect(entry.stream_or_course);
              }}
              className={itemClass}
              style={{ cursor: isFull ? "not-allowed" : onSelect ? "pointer" : "default" }}
            >
              {/* Top bar */}
              <div className={topBarClass} />

              <div className="cg-seat-display__title">
                {entry.stream_or_course}
              </div>

              <div className="cg-seat-display__stats">
                <div>Total: <strong style={{ color: "hsl(var(--foreground))" }}>{entry.total_seats}</strong></div>
                <div>Filled: <strong style={{ color: "hsl(var(--foreground))" }}>{entry.filled_seats}</strong></div>
                <div>
                  Available:{" "}
                  <strong style={{ color: isFull ? "hsl(var(--destructive))" : "hsl(var(--success))" }}>
                    {available > 0 ? available : "FULL"}
                  </strong>
                </div>
                {entry.waitlist_count > 0 && (
                  <div>
                    Waitlist: <strong style={{ color: "hsl(var(--warning))" }}>{entry.waitlist_count}</strong>
                  </div>
                )}
              </div>

              {isFull && (
                <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", fontWeight: 600, color: "hsl(var(--destructive))" }}>
                  No seats — application goes to waitlist
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
