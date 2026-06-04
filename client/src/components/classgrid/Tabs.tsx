import * as RadixTabs from "@radix-ui/react-tabs";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useState } from "react";

/* ── Root ── */
type CgTabsProps = {
  defaultValue?: string;
  value?: string;
  activeTab?: string;
  children?: ReactNode;
  className?: string;
  onValueChange?: (value: string) => void;
  onTabChange?: (value: string) => void;
  tabs?: { id: string; label: string; icon?: ReactNode }[];
};

export function CgTabs({
  defaultValue,
  value,
  activeTab,
  children,
  className = "",
  onValueChange,
  onTabChange,
  tabs,
}: CgTabsProps) {
  const initialValue = value ?? activeTab ?? defaultValue ?? tabs?.[0]?.id ?? "";
  const [internalTab, setInternalTab] = useState(initialValue);
  const controlledValue = value ?? activeTab;
  const currentValue = controlledValue ?? internalTab;
  const handleChange = (val: string) => {
    setInternalTab(val);
    onValueChange?.(val);
    onTabChange?.(val);
  };

  return (
    <RadixTabs.Root
      className={`cg-tabs ${className}`.trim()}
      defaultValue={controlledValue ? undefined : initialValue}
      value={controlledValue ? currentValue : undefined}
      onValueChange={handleChange}
    >
      {/* We pass down the activeTab to children so Triggers can read it without Context if we want,
          but actually Radix handles the active state via data-[state=active]. 
          We just need framer-motion inside the trigger. */}
      {tabs ? (
        <CgTabList>
          {tabs.map((tab) => (
            <CgTabTrigger key={tab.id} value={tab.id} icon={tab.icon}>
              {tab.label}
            </CgTabTrigger>
          ))}
        </CgTabList>
      ) : children}
    </RadixTabs.Root>
  );
}

/* ── Tab List (the row of triggers) ── */
type CgTabListProps = {
  children: ReactNode;
  className?: string;
};

export function CgTabList({ children, className = "" }: CgTabListProps) {
  return (
    <RadixTabs.List className={`cg-tabs__list relative flex items-center border-b border-border ${className}`.trim()}>
      {children}
    </RadixTabs.List>
  );
}

/* ── Tab Trigger (individual tab button) ── */
type CgTabTriggerProps = {
  value: string;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
};

export function CgTabTrigger({ value, children, icon, className = "" }: CgTabTriggerProps) {
  return (
    <RadixTabs.Trigger
      className={`cg-tabs__trigger relative flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-surface-1 active:scale-[0.98] data-[state=active]:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`.trim()}
      value={value}
    >
      {icon ? <span className="cg-tabs__trigger-icon">{icon}</span> : null}
      {children}
      
      {/* framer-motion layout indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden rounded-t-full">
        <div className="h-full w-full bg-transparent group-data-[state=active]:bg-primary transition-colors" />
      </div>
    </RadixTabs.Trigger>
  );
}

/* ── Tab Content (panel shown when tab is active) ── */
type CgTabContentProps = {
  value: string;
  children: ReactNode;
  className?: string;
};

export function CgTabContent({ value, children, className = "" }: CgTabContentProps) {
  return (
    <RadixTabs.Content
      className={`cg-tabs__content mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`.trim()}
      value={value}
    >
      {children}
    </RadixTabs.Content>
  );
}
