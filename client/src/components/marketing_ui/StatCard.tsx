type StatCardProps = {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
};

export function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <article className="flex items-center justify-between p-6 bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
        <strong className="text-3xl font-extrabold text-foreground">{value}</strong>
      </div>
      {icon && (
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
      )}
    </article>
  );
}