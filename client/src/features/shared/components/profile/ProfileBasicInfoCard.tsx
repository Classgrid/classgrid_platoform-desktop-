import React from "react";
import { User as UserIcon } from "lucide-react";
import { Input } from "@/components/shadcn/input";
import { CgFieldGroup } from "@/components/classgrid/CgFieldGroup";
import { ProfileData } from "../../queries/useUserProfile";
import { CgSelect } from "@/components/classgrid/Select";

type ProfileBasicInfoCardProps = {
  form: ProfileData;
  onChange: (field: keyof ProfileData, value: string) => void;
  errors?: Record<string, string>;
};

export function ProfileBasicInfoCard({ form, onChange, errors = {} }: ProfileBasicInfoCardProps) {
  return (
    <div className="cg-bento-card">
      <div className="cg-bento-header">
        <h3 className="cg-bento-title"><UserIcon size={18} /> Basic Information</h3>
        <p className="cg-bento-desc">Standard identification details across the platform.</p>
      </div>
      <div className="flex flex-col gap-5">
        <CgFieldGroup label="Full Display Name" error={errors.name} required>
          <Input 
            value={form.name} 
            onChange={(e) => onChange("name", e.target.value)} 
            placeholder="Enter full name" 
          />
        </CgFieldGroup>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <CgFieldGroup label="Phone Connectivity">
            <Input 
              value={form.phoneNumber || ""} 
              onChange={(e) => onChange("phoneNumber", e.target.value)} 
              placeholder="+91 " 
            />
          </CgFieldGroup>

          <CgFieldGroup label="Alternate Email">
            <Input 
              value={form.alternateEmail || ""} 
              onChange={(e) => onChange("alternateEmail", e.target.value)} 
              placeholder="Backup email address" 
            />
          </CgFieldGroup>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <CgFieldGroup label="Date of Birth">
            <Input 
              type="date"
              value={form.dob ? form.dob.split("T")[0] : ""} 
              onChange={(e) => onChange("dob", e.target.value)} 
            />
          </CgFieldGroup>

          <CgFieldGroup label="Gender">
             <CgSelect 
              value={form.gender || ""} 
              onValueChange={(value) => onChange("gender", value)}
              placeholder="Select gender"
              options={[
                { label: "Male", value: "male" },
                { label: "Female", value: "female" },
                { label: "Other", value: "other" },
                { label: "Prefer not to say", value: "prefer_not_to_say" }
              ]}
            />
          </CgFieldGroup>
        </div>

        <CgFieldGroup label="Bio / Address">
            <Input 
              value={form.address || ""} 
              onChange={(e) => onChange("address", e.target.value)} 
              placeholder="Short bio or current address" 
            />
        </CgFieldGroup>
      </div>
    </div>
  );
}
