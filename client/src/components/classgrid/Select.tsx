import * as RadixSelect from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

type SelectOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

type CgSelectProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

/**
 * CgSelect — Dropdown select menu using Radix UI.
 *
 * Usage:
 *   <CgSelect
 *     options={[
 *       { label: "All Statuses", value: "all" },
 *       { label: "Verified", value: "verified" },
 *       { label: "Pending", value: "pending" }
 *     ]}
 *     placeholder="Filter by status"
 *   />
 */
export function CgSelect({
  value,
  defaultValue,
  onValueChange,
  options,
  placeholder = "Select...",
  className = "",
  disabled = false,
}: CgSelectProps) {
  return (
    <RadixSelect.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <RadixSelect.Trigger className={`cg-select__trigger ${className}`.trim()}>
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon className="cg-select__icon">
          <ChevronDown size={14} />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          className="cg-select__content data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
          position="popper"
          sideOffset={4}
        >
          <RadixSelect.Viewport className="cg-select__viewport">
            {options.map((opt) => (
              <RadixSelect.Item
                key={opt.value}
                className="cg-select__item transition-colors hover:bg-muted/50 focus:bg-muted focus:text-foreground active:scale-[0.98] cursor-pointer"
                value={opt.value}
                disabled={opt.disabled}
              >
                <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator className="cg-select__indicator">
                  <Check size={14} />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
