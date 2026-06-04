import React from "react";
import { GraduationCap, Lock } from "lucide-react";
import { Input } from "@/components/shadcn/input";
import { CgFieldGroup } from "@/components/classgrid/CgFieldGroup";
import { ProfileData } from "../../queries/useUserProfile";

type ProfileAcademicCardProps = {
  form: ProfileData;
  onChange: (field: keyof ProfileData, value: string) => void;
  originalData?: ProfileData;
};

export function ProfileAcademicCard({ form, onChange, originalData }: ProfileAcademicCardProps) {
  const isStudent = form.role === "student";
  const isFaculty = form.role === "faculty" || form.role === "teacher";
  
  if (!isStudent && !isFaculty) return null;

  // Fields are locked if they already had a value in the original backend data
  const prnLocked = !!originalData?.prn;
  const branchLocked = !!originalData?.branch;
  const batchLocked = !!originalData?.batch;
  const deptLocked = !!originalData?.department;

  return (
    <div className="cg-bento-card">
      <div className="cg-bento-header">
        <h3 className="cg-bento-title"><GraduationCap size={18} /> Academic Profile</h3>
        <p className="cg-bento-desc">Institutional records and academic tracking.</p>
      </div>
      <div className="flex flex-col gap-5">
        
        {isStudent && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <CgFieldGroup label={form.organization_id?.rollNumberLabel || "PRN / Roll Number"} hint={prnLocked ? "Locked by institution" : ""}>
              <div className="relative">
                <Input 
                  value={form.prn || ""} 
                  onChange={(e) => onChange("prn", e.target.value)} 
                  placeholder="Enter academic ID"
                  disabled={prnLocked}
                  className={prnLocked ? "bg-muted/50 text-muted-foreground border-dashed pr-10" : ""}
                />
                {prnLocked && <Lock size={14} className="absolute right-3 top-3 text-muted-foreground" />}
              </div>
            </CgFieldGroup>

            <CgFieldGroup label="Batch / Year" hint={batchLocked ? "Locked by institution" : ""}>
              <div className="relative">
                <Input 
                  value={form.batch || ""} 
                  onChange={(e) => onChange("batch", e.target.value)} 
                  placeholder="e.g. 2024-2028"
                  disabled={batchLocked}
                  className={batchLocked ? "bg-muted/50 text-muted-foreground border-dashed pr-10" : ""}
                />
                {batchLocked && <Lock size={14} className="absolute right-3 top-3 text-muted-foreground" />}
              </div>
            </CgFieldGroup>
          </div>
        )}

        <CgFieldGroup label={isStudent ? "Branch / Course" : "Department"} hint={(isStudent ? branchLocked : deptLocked) ? "Locked by institution" : ""}>
          <div className="relative">
            <Input 
              value={(isStudent ? form.branch : form.department) || ""} 
              onChange={(e) => onChange(isStudent ? "branch" : "department", e.target.value)} 
              placeholder={`Enter your ${isStudent ? 'course' : 'department'}`}
              disabled={isStudent ? branchLocked : deptLocked}
              className={(isStudent ? branchLocked : deptLocked) ? "bg-muted/50 text-muted-foreground border-dashed pr-10" : ""}
            />
            {(isStudent ? branchLocked : deptLocked) && <Lock size={14} className="absolute right-3 top-3 text-muted-foreground" />}
          </div>
        </CgFieldGroup>

        {isFaculty && (
          <CgFieldGroup label="Qualification">
            <Input 
              value={form.qualification || ""} 
              onChange={(e) => onChange("qualification", e.target.value)} 
              placeholder="e.g. Ph.D, M.Tech" 
            />
          </CgFieldGroup>
        )}
      </div>
    </div>
  );
}
