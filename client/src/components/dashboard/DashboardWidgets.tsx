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
    <article className=" ">
      <p className="">{label}</p>
      <strong className="">{value}</strong>
      {meta ? <small className="">{meta}</small> : null}
    </article>
  );
}

export function TablePanel({ title, actions = [], columns, rows }: TablePanelProps) {
  return (
    <article className="">
      <div className="">
        <div>
          <h3>{title}</h3>
          {actions.length > 0 ? (
            <div className="">
              {actions.map((action) => (
                <span key={action} className="">
                  {action}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <table className="">
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
    <article className="">
      <div className="">
        <h3>{title}</h3>
        {cta ? <small className="">{cta}</small> : null}
      </div>

      <ul className="">
        {entries.map((entry) => {
          const item =
            typeof entry === "string"
              ? { label: entry }
              : entry;

          return (
            <li key={`${item.label}-${item.time ?? "item"}`} className="">
              <div className="">
                <span>{item.label}</span>
                {item.detail ? <small>{item.detail}</small> : null}
              </div>
              {item.time ? <small className="">{item.time}</small> : null}
            </li>
          );
        })}
      </ul>
    </article>
  );
}
