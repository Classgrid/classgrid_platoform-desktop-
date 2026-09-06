/**
 * ==============================================================================
 * 🚨 AI AGENT WARNING: BREADCRUMB POLICY 🚨
 * ==============================================================================
 * NEVER hardcode "Super Admin Dashboard /" as a breadcrumb on any deep dive page.
 * Deep dive pages or sub-pages MUST accurately reflect the actual parent pages 
 * they were opened from (e.g., Organizations / [Name] / Configuration / ...).
 * DO NOT use generic dashboard text for breadcrumbs.
 * ==============================================================================
 */

import React, { useState, useEffect } from "react";
import { Button } from "@/components/marketing_ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/marketing_ui/dialog";
import { Checkbox } from "@/components/marketing_ui/checkbox";
import { orgDetailApi } from "../../services/superAdminApi";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface EditOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  currentOnboarding: Record<string, any>;
}

const ONBOARDING_STEPS = [
  { key: "tenant_created", label: "Tenant Created" },
  { key: "branding_configured", label: "Branding Configured" },
  { key: "academic_hierarchy_set", label: "Academic Hierarchy Set" },
  { key: "staff_imported", label: "Staff Imported" },
  { key: "students_imported", label: "Students Imported" },
  { key: "fee_structure_configured", label: "Fee Structure Configured" },
  { key: "admission_form_configured", label: "Admission Form Configured" },
  { key: "first_login_completed", label: "First Login Completed" }
];

export function EditOnboardingModal({ isOpen, onClose, orgId, currentOnboarding }: EditOnboardingModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && currentOnboarding) {
      const initialData: Record<string, boolean> = {};
      ONBOARDING_STEPS.forEach(step => {
        initialData[step.key] = !!currentOnboarding[step.key];
      });
      setFormData(initialData);
    }
  }, [isOpen, currentOnboarding]);

  const handleToggle = (key: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [key]: checked }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await orgDetailApi.updateOrganizationOnboarding(orgId, formData);
      toast.success("Onboarding progress updated successfully!");
      // Invalidate query to refresh the OrgConfigurationTab
      queryClient.invalidateQueries({ queryKey: ["orgDetail", orgId] });
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to update onboarding progress");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Onboarding Progress</DialogTitle>
          <DialogDescription>
            Manually override the onboarding progress for this organization.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {ONBOARDING_STEPS.map((step) => (
            <div key={step.key} className="flex items-center space-x-2">
              <Checkbox
                id={step.key}
                checked={formData[step.key] || false}
                onCheckedChange={(checked) => handleToggle(step.key, checked as boolean)}
              />
              <label
                htmlFor={step.key}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {step.label}
              </label>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
