import { WorkModuleGrid } from "@/components/dashboard/WorkModuleGrid";
import { studentWorkModules } from "@/config/workModules";

export function StudentWorkPage() {
  return (
    <div className="cg-page">
      <div className="cg-page__header">
        <h1>Work & Resources</h1>
        <p>Student module launcher based on your wireframe.</p>
      </div>

      <WorkModuleGrid modules={studentWorkModules} />
    </div>
  );
}
