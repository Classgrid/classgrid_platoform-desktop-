type StatCardProps = {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
};

export function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <article className="ui-card flex items-center justify-between p-6">
      <div>
        <p className="ui-stat__label text-muted-foreground text-sm font-medium">{title}</p>
        <strong className="ui-stat__value text-2xl font-bold">{value}</strong>
      </div>
      {icon && <div className="text-muted-foreground opacity-50">{icon}</div>}
    </article>
  );
}