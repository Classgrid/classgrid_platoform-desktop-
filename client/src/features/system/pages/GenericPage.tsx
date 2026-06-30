import { useLocation } from "react-router-dom";

import { resolveDashboardPageTitle } from "@/config/sidebar";

type GenericPageProps = {
  title?: string;
};

export function GenericPage({ title }: GenericPageProps) {
  const location = useLocation();
  const resolvedTitle = title ?? resolveDashboardPageTitle(location.pathname);

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <h1>{resolvedTitle}</h1>
        <p>This module is wired into the dashboard shell and ready for detailed implementation.</p>
      </div>
      <section >
        <p>
          The route <code>{location.pathname}</code> is active. API integration, forms, tables, and
          workflow actions can be added on top of this shell next.
        </p>
      </section>
    </div>
  );
}
