import React from "react";

type CgFieldGroupProps = {
  label: string;
  children: React.ReactNode;
  hint?: string;
  error?: string;
  required?: boolean;
};

export function CgFieldGroup({ label, children, hint, error, required }: CgFieldGroupProps) {
  return (
    <div className="cg-field-group">
      <label className="cg-field-label">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  );
}
