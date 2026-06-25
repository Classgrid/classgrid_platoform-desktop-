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
    <section className="">
      {modules.map((module) => (
        <Link key={module.route} className="" to={module.route}>
          <span>{module.label}</span>
        </Link>
      ))}
    </section>
  );
}
