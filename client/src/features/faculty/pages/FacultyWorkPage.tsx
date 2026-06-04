import { WorkModuleGrid } from "@/components/dashboard/WorkModuleGrid";
import { facultyWorkModules } from "@/config/workModules";

export function FacultyWorkPage() {
  return (
    <div className="cg-page">
      <div className="cg-page__header">
        <h1>Work & Resources</h1>
        <p>Faculty module launcher based on your wireframe.</p>
      </div>

      <WorkModuleGrid modules={facultyWorkModules} />
    </div>
  );
}
