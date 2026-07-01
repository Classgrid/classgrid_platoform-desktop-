import React from "react";
import { ContextualProfile } from "@/features/shared/components/ContextualProfile";

export default function SandboxProfilePage() {
  return (
    <div className="min-h-screen bg-muted/20 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile Stepper Sandbox</h1>
          <p className="text-muted-foreground mt-2">
            Testing the ContextualProfile stepper (Vertical Stepper) based on the profile-strategy-selector.
          </p>
        </div>

        {/* Example: A Student viewing their OWN profile */}
        <div className="border rounded-xl bg-background shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">Example: Student (Self View)</h2>
          <p className="text-sm text-muted-foreground">
            This simulates an engineering student viewing their own profile. They can see all fields assigned to them.
          </p>
          <ContextualProfile 
            targetRole="student" 
            viewerRole="student" 
            orgType="engineering" 
            structureType="engineering_with_div" 
            isSelfView={true} 
          />
        </div>

        {/* Example: A Faculty viewing a Student profile */}
        <div className="border rounded-xl bg-background shadow-sm p-6 space-y-4 mt-8">
          <h2 className="text-xl font-semibold border-b pb-2">Example: Faculty viewing a Student</h2>
          <p className="text-sm text-muted-foreground">
            This simulates a faculty member viewing an engineering student's profile. Notice how the restricted fields are hidden by the strategy selector!
          </p>
          <ContextualProfile 
            targetRole="student" 
            viewerRole="faculty" 
            orgType="engineering" 
            structureType="engineering_with_div" 
            isSelfView={false} 
          />
        </div>

        {/* Example: Super Admin */}
        <div className="border rounded-xl bg-background shadow-sm p-6 space-y-4 mt-8">
          <h2 className="text-xl font-semibold border-b pb-2">Example: Super Admin (Self View)</h2>
          <p className="text-sm text-muted-foreground">
            A Super Admin has a very specific set of fields. They do not have Academic Placement or Education details mapped.
          </p>
          <ContextualProfile 
            targetRole="super_admin" 
            viewerRole="super_admin" 
            orgType="engineering" 
            structureType="engineering" 
            isSelfView={true} 
          />
        </div>

        {/* Example: Org Admin */}
        <div className="border rounded-xl bg-background shadow-sm p-6 space-y-4 mt-8">
          <h2 className="text-xl font-semibold border-b pb-2">Example: Org Admin (Self View)</h2>
          <p className="text-sm text-muted-foreground">
            An Org Admin profile, including Experience Details but no Academic Placements.
          </p>
          <ContextualProfile 
            targetRole="org_admin" 
            viewerRole="org_admin" 
            orgType="engineering" 
            structureType="engineering" 
            isSelfView={true} 
          />
        </div>

        {/* Example: Department Admin */}
        <div className="border rounded-xl bg-background shadow-sm p-6 space-y-4 mt-8">
          <h2 className="text-xl font-semibold border-b pb-2">Example: Department Admin (Self View)</h2>
          <p className="text-sm text-muted-foreground">
            Department Admin profile, explicitly configured based on your request.
          </p>
          <ContextualProfile 
            targetRole="department_admin" 
            viewerRole="department_admin" 
            orgType="engineering" 
            structureType="engineering" 
            isSelfView={true} 
          />
        </div>

      </div>
    </div>
  );
}
