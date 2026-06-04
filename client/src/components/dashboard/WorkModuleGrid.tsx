import { Link } from "react-router-dom";

type WorkModule = {
  label: string;
  route: string;
};

type WorkModuleGridProps = {
  modules: WorkModule[];
};

export function WorkModuleGrid({ modules }: WorkModuleGridProps) {
  return (
    <section className="cg-module-grid">
      {modules.map((module) => (
        <Link key={module.route} className="cg-module-card" to={module.route}>
          <span>{module.label}</span>
        </Link>
      ))}
    </section>
  );
}
