import React from "react";

type CgSwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

export function CgSwitch({ checked, onChange, disabled }: CgSwitchProps) {
  return (
    <label className={`cg-switch ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <div className="cg-switch-track">
        <div className="cg-switch-thumb"></div>
      </div>
    </label>
  );
}
