import type { LucideIcon } from "lucide-react";

export type DashboardRole =
  | "super_admin"
  | "org_admin"
  | "admission_dept"
  | "fees_dept"
  | "exam_dept"
  | "library_dept"
  | "attendance_dept"
  | "hr_dept"
  | "hostel_dept"
  | "faculty"
  | "student";

export type SidebarItem = {
  label: string;
  to: string;
  icon?: LucideIcon;
  badge?: number;
  restrictedToEmail?: string;
  hasNestedNav?: boolean;
};

export type SidebarSection = {
  label?: string;
  items: SidebarItem[];
};

export type DashboardIdentity = {
  name: string;
  subtitle: string;
  email?: string;
  cardTitle?: string;
  cardSubtitle?: string;
  menuItems?: DashboardMenuItem[];
};

export type ModuleSwitcherItem = {
  label: string;
  id: string;
  icon?: LucideIcon;
};

export type DashboardMenuItem = {
  label: string;
  icon: LucideIcon;
  to?: string;
  dividerBefore?: boolean;
};

export type DashboardConfig = {
  role: DashboardRole;
  logo: string;
  brandIcon?: LucideIcon;
  subtitle?: string;
  mobileMode?: "responsive" | "desktop-only";
  switcher?: {
    current: ModuleSwitcherItem;
    items: ModuleSwitcherItem[];
    subtext?: string;
  };
  sections: SidebarSection[];
  identity: DashboardIdentity;
};
