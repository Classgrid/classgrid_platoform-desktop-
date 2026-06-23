type StatCardProps = {
  label: string;
  value: string;
};

export function StatCard({ label, value }: StatCardProps) {
  return (
    <article className="ui-card">
      <p className="ui-stat__label">{label}</p>
      <strong className="ui-stat__value">{value}</strong>
    </article>
  );
}
