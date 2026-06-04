import { useLocation } from "react-router-dom";

import { resolveDashboardPageTitle } from "@/config/sidebar";

type GenericPageProps = {
  title?: string;
};

export function GenericPage({ title }: GenericPageProps) {
  const location = useLocation();
  const resolvedTitle = title ?? resolveDashboardPageTitle(location.pathname);

  return (
    <div className="cg-page">
      <div className="cg-page__header">
        <h1>{resolvedTitle}</h1>
        <p>This module is wired into the dashboard shell and ready for detailed implementation.</p>
      </div>
      <section className="cg-panel">
        <p>
          The route <code>{location.pathname}</code> is active. API integration, forms, tables, and
          workflow actions can be added on top of this shell next.
        </p>
      </section>
    </div>
  );
}
