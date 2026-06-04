type StatTileProps = {
  label: string;
  value: string;
  meta?: string;
};

type TableColumn = {
  key: string;
  label: string;
};

type TablePanelProps = {
  title: string;
  actions?: string[];
  columns: TableColumn[];
  rows: Record<string, string>[];
};

type ActivityEntry = {
  label: string;
  time?: string;
  detail?: string;
};

type ActivityFeedProps = {
  title: string;
  entries: Array<string | ActivityEntry>;
  cta?: string;
};

export function StatTile({ label, value, meta }: StatTileProps) {
  return (
    <article className="cg-panel cg-panel--stat">
      <p className="cg-panel__eyebrow">{label}</p>
      <strong className="cg-panel__value">{value}</strong>
      {meta ? <small className="cg-panel__meta">{meta}</small> : null}
    </article>
  );
}

export function TablePanel({ title, actions = [], columns, rows }: TablePanelProps) {
  return (
    <article className="cg-panel">
      <div className="cg-panel__title-row">
        <div>
          <h3>{title}</h3>
          {actions.length > 0 ? (
            <div className="cg-inline-actions">
              {actions.map((action) => (
                <span key={action} className="cg-inline-actions__item">
                  {action}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <table className="cg-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={`${title}-${rowIdx}`}>
              {columns.map((column) => (
                <td key={`${rowIdx}-${column.key}`}>{row[column.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}

export function ActivityFeed({ title, entries, cta }: ActivityFeedProps) {
  return (
    <article className="cg-panel">
      <div className="cg-panel__title-row">
        <h3>{title}</h3>
        {cta ? <small className="cg-panel__cta">{cta}</small> : null}
      </div>

      <ul className="cg-activity-list">
        {entries.map((entry) => {
          const item =
            typeof entry === "string"
              ? { label: entry }
              : entry;

          return (
            <li key={`${item.label}-${item.time ?? "item"}`} className="cg-activity-list__item">
              <div className="cg-activity-list__copy">
                <span>{item.label}</span>
                {item.detail ? <small>{item.detail}</small> : null}
              </div>
              {item.time ? <small className="cg-activity-list__time">{item.time}</small> : null}
            </li>
          );
        })}
      </ul>
    </article>
  );
}
