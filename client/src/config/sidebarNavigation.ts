import { DashboardRole } from "@/components/layout/DashboardLayout";

export interface NavigationLink {
  title: string;
  url: string;
  icon: string;
  badge?: number;
}

export interface NavigationSection {
  label: string;
  items: NavigationLink[];
}

export interface RoleSidebarConfig {
  logo: string;
  subtitle?: string;
  sections: NavigationSection[];
}

export const sidebarNavigation: Record<DashboardRole, RoleSidebarConfig> = {
  super_admin: {
    logo: "Classgrid",
    subtitle: "Super Admin",
    sections: [
      {
        label: "OVERVIEW",
        items: [
          { title: "Dashboard", url: "/superadmin/dashboard", icon: "LayoutDashboard" },
          { title: "Analytics", url: "/superadmin/analytics", icon: "TrendingUp" },
          { title: "Alerts", url: "/superadmin/alerts", icon: "Bell" },
        ],
      },
      {
        label: "ORGANIZATIONS",
        items: [
          { title: "All Organizations", url: "/superadmin/orgs", icon: "Building2" },
          { title: "Onboard New Org", url: "/superadmin/onboard", icon: "PlusCircle" },
          { title: "Demo Leads", url: "/superadmin/leads", icon: "ClipboardList" },
          { title: "Plans & Billing", url: "/superadmin/billing", icon: "CreditCard" },
        ],
      },
      {
        label: "PLATFORM",
        items: [
          { title: "Users & Roles", url: "/superadmin/users", icon: "Users" },
          { title: "Platform Team", url: "/superadmin/team", icon: "UserCircle" },
          { title: "Audit Logs", url: "/superadmin/audit", icon: "Shield" },
          { title: "Announcements", url: "/superadmin/announcements", icon: "Megaphone" },
          { title: "System Config", url: "/superadmin/config", icon: "Settings" },
        ],
      },
      {
        label: "SUPPORT",
        items: [
          { title: "Platform Chat", url: "/chat", icon: "MessageSquare" },
          { title: "Classgrid Talk", url: "/superadmin/classgrid-talk", icon: "MessageCircle" },
          { title: "Support Tickets", url: "/superadmin/support", icon: "Ticket" },
        ],
      },
      {
        label: "FINANCE",
        items: [
          { title: "Revenue", url: "/superadmin/revenue", icon: "IndianRupee" },
          { title: "Transactions", url: "/superadmin/transactions", icon: "CreditCard" },
          { title: "Failed Payments", url: "/superadmin/failed-payments", icon: "AlertTriangle" },
        ],
      },
    ],
  },
  org_admin: {
    logo: "Classgrid",
    subtitle: "Org Admin",
    sections: [
      {
        label: "OVERVIEW",
        items: [
          { title: "Dashboard", url: "/org/dashboard", icon: "LayoutDashboard" },
          { title: "Announcements", url: "/org/announcements", icon: "Megaphone" },
          { title: "Chat", url: "/chat", icon: "MessageSquare" },
        ],
      },
      {
        label: "ACADEMICS",
        items: [
          { title: "Students", url: "/org/students", icon: "Users" },
          { title: "Faculty", url: "/org/faculty", icon: "GraduationCap" },
          { title: "Classrooms", url: "/org/classrooms", icon: "BookOpen" },
          { title: "Timetable", url: "/org/timetable", icon: "CalendarDays" },
          { title: "Academic Calendar", url: "/org/calendar", icon: "Calendar" },
          { title: "Curriculum", url: "/org/curriculum", icon: "BookType" },
        ],
      },
      {
        label: "MANAGEMENT",
        items: [
          { title: "Admissions", url: "/org/admissions", icon: "UserPlus" },
          { title: "Fees & Payments", url: "/org/fees", icon: "IndianRupee" },
          { title: "Examinations", url: "/org/examinations", icon: "FileEdit" },
          { title: "Marks & Results", url: "/org/results", icon: "BarChart3" },
          { title: "Attendance", url: "/org/attendance", icon: "ClipboardCheck" },
          { title: "Leave Management", url: "/org/leaves", icon: "CalendarX2" },
        ],
      },
      {
        label: "FACILITIES",
        items: [
          { title: "Library", url: "/org/library", icon: "Library" },
          { title: "Hostel", url: "/org/hostel", icon: "Home" },
          { title: "Canteen", url: "/org/canteen", icon: "Coffee" },
          { title: "Transport", url: "/org/transport", icon: "Bus" },
        ],
      },
      {
        label: "COMPLIANCE",
        items: [
          { title: "NBA / NAAC", url: "/org/compliance/nba-naac", icon: "Award" },
          { title: "SARAL / DTE Reports", url: "/org/compliance/reports", icon: "FileUp" },
          { title: "Audit Trail", url: "/org/audit", icon: "Search" },
        ],
      },
      {
        label: "ENGAGEMENT",
        items: [
          { title: "Events & Seminars", url: "/org/events", icon: "CalendarCheck" },
          { title: "Alumni & Placements", url: "/org/alumni", icon: "GraduationCap" },
          { title: "Feedback", url: "/org/feedback", icon: "MessageSquare" },
          { title: "Org Chat", url: "/org/chat", icon: "MessageCircle" },
        ],
      },
      {
        label: "AI & TOOLS",
        items: [
          { title: "Classgrid AI", url: "/org/ai", icon: "Bot" },
          { title: "Analytics", url: "/org/analytics", icon: "PieChart" },
          { title: "College Website", url: "/org/website", icon: "Globe" },
          { title: "Certificates", url: "/org/certificates", icon: "ScrollText" },
        ],
      },
    ],
  },
  admission: {
    logo: "Classgrid",
    subtitle: "Admission Dept",
    sections: [
      {
        label: "ADMISSIONS",
        items: [
          { title: "Dashboard", url: "/dept/admissions/dashboard", icon: "LayoutDashboard" },
          { title: "Chat", url: "/chat", icon: "MessageSquare" },
          { title: "All Applications", url: "/dept/admissions/applications", icon: "Files" },
          { title: "New Application", url: "/dept/admissions/new", icon: "FilePlus" },
          { title: "Document Verification", url: "/dept/admissions/documents", icon: "FolderCheck" },
          { title: "Merit Lists", url: "/dept/admissions/merit", icon: "ListOrdered" },
          { title: "Enrollment", url: "/dept/admissions/enroll", icon: "CheckSquare" },
        ],
      },
      {
        label: "CONFIGURATION",
        items: [
          { title: "Admission Config", url: "/dept/admissions/config", icon: "Settings2" },
          { title: "Fee Structure", url: "/dept/admissions/fees", icon: "Receipt" },
          { title: "Schedule & Rounds", url: "/dept/admissions/schedule", icon: "CalendarClock" },
          { title: "Form Builder", url: "/dept/admissions/form-builder", icon: "FormInput" },
        ],
      },
      {
        label: "REPORTS",
        items: [
          { title: "Analytics", url: "/dept/admissions/analytics", icon: "TrendingUp" },
          { title: "Export Data", url: "/dept/admissions/export", icon: "Download" },
          { title: "CET / DTE Reports", url: "/dept/admissions/cet-dte", icon: "FileBarChart" },
        ],
      },
      {
        label: "CRM",
        items: [
          { title: "Lead Tracking", url: "/dept/admissions/crm", icon: "PhoneCall" },
          { title: "Communication", url: "/dept/admissions/comm", icon: "Mail" },
          { title: "Bulk SMS / WhatsApp", url: "/dept/admissions/bulk", icon: "MessageSquareShare" },
        ],
      },
    ],
  },
  fees: {
    logo: "Classgrid",
    subtitle: "Fees & Accounts",
    sections: [
      {
        label: "FEES",
        items: [
          { title: "Dashboard", url: "/dept/fees/dashboard", icon: "LayoutDashboard" },
          { title: "Chat", url: "/chat", icon: "MessageSquare" },
          { title: "Collect Payment", url: "/dept/fees/collect", icon: "CreditCard" },
          { title: "All Transactions", url: "/dept/fees/transactions", icon: "ArrowRightLeft" },
          { title: "Defaulters List", url: "/dept/fees/defaulters", icon: "AlertOctagon" },
          { title: "Receipts", url: "/dept/fees/receipts", icon: "ReceiptText" },
        ],
      },
      {
        label: "CONFIGURATION",
        items: [
          { title: "Fee Structure", url: "/dept/fees/structure", icon: "Settings2" },
          { title: "Installment Plans", url: "/dept/fees/installments", icon: "CalendarDays" },
          { title: "Scholarships & Waivers", url: "/dept/fees/scholarships", icon: "TicketPercent" },
          { title: "Late Fee Rules", url: "/dept/fees/late-rules", icon: "ClockAlert" },
        ],
      },
      {
        label: "REPORTS",
        items: [
          { title: "Collection Analytics", url: "/dept/fees/analytics", icon: "PieChart" },
          { title: "Export Reports", url: "/dept/fees/export", icon: "Download" },
          { title: "Class-wise Summary", url: "/dept/fees/summary", icon: "BarChart4" },
          { title: "Bank Reconciliation", url: "/dept/fees/reconciliation", icon: "Landmark" },
        ],
      },
    ],
  },
  exams: {
    logo: "Classgrid",
    subtitle: "Examination Cell",
    sections: [
      {
        label: "EXAMS",
        items: [
          { title: "Dashboard", url: "/dept/exams/dashboard", icon: "LayoutDashboard" },
          { title: "Chat", url: "/chat", icon: "MessageSquare" },
          { title: "Exam Schedule", url: "/dept/exams/schedule", icon: "CalendarClock" },
          { title: "Create Exam", url: "/dept/exams/create", icon: "FilePlus2" },
          { title: "Online Exams", url: "/dept/exams/online", icon: "MonitorPlay" },
          { title: "Hall Tickets", url: "/dept/exams/hall-tickets", icon: "Ticket" },
        ],
      },
      {
        label: "RESULTS",
        items: [
          { title: "Marks Entry", url: "/dept/exams/marks", icon: "PenLine" },
          { title: "Results Processing", url: "/dept/exams/results", icon: "Settings" },
          { title: "Grade Sheets", url: "/dept/exams/grades", icon: "FileSpreadsheet" },
          { title: "Internal Assessment", url: "/dept/exams/internal", icon: "FileCheck2" },
        ],
      },
      {
        label: "QUESTION BANK",
        items: [
          { title: "Question Pool", url: "/dept/exams/questions", icon: "Database" },
          { title: "AI Paper Generator", url: "/dept/exams/ai-paper", icon: "Bot" },
          { title: "Past Papers", url: "/dept/exams/past-papers", icon: "History" },
        ],
      },
      {
        label: "REPORTS",
        items: [
          { title: "Performance Analytics", url: "/dept/exams/analytics", icon: "TrendingUp" },
          { title: "Export", url: "/dept/exams/export", icon: "Download" },
          { title: "Toppers & Awards", url: "/dept/exams/toppers", icon: "Trophy" },
        ],
      },
    ],
  },
  library: {
    logo: "Classgrid",
    subtitle: "Library",
    sections: [
      {
        label: "LIBRARY",
        items: [
          { title: "Dashboard", url: "/dept/library/dashboard", icon: "LayoutDashboard" },
          { title: "Chat", url: "/chat", icon: "MessageSquare" },
          { title: "All Books", url: "/dept/library/books", icon: "Library" },
          { title: "Add Book", url: "/dept/library/add", icon: "BookPlus" },
          { title: "Search Catalog", url: "/dept/library/search", icon: "Search" },
        ],
      },
      {
        label: "CIRCULATION",
        items: [
          { title: "Issue Book", url: "/dept/library/issue", icon: "BookUp" },
          { title: "Return Book", url: "/dept/library/return", icon: "BookDown" },
          { title: "Overdue Books", url: "/dept/library/overdue", icon: "AlertTriangle" },
          { title: "Issue History", url: "/dept/library/history", icon: "History" },
        ],
      },
      {
        label: "DIGITAL",
        items: [
          { title: "E-Books", url: "/dept/library/ebooks", icon: "TabletSmartphone" },
          { title: "Journal Subscriptions", url: "/dept/library/journals", icon: "Newspaper" },
          { title: "Notes Marketplace", url: "/dept/library/notes", icon: "Store" },
        ],
      },
      {
        label: "REPORTS",
        items: [
          { title: "Usage Analytics", url: "/dept/library/analytics", icon: "TrendingUp" },
          { title: "Stock Report", url: "/dept/library/stock", icon: "Package" },
        ],
      },
    ],
  },
  attendance: {
    logo: "Classgrid",
    subtitle: "Attendance",
    sections: [
      {
        label: "ATTENDANCE",
        items: [
          { title: "Dashboard", url: "/dept/attendance/dashboard", icon: "LayoutDashboard" },
          { title: "Chat", url: "/chat", icon: "MessageSquare" },
          { title: "Mark Attendance", url: "/dept/attendance/mark", icon: "CheckCircle" },
          { title: "Daily Report", url: "/dept/attendance/daily", icon: "CalendarRange" },
          { title: "Monthly Report", url: "/dept/attendance/monthly", icon: "CalendarDays" },
        ],
      },
      {
        label: "TRACKING",
        items: [
          { title: "Low Attendance (< 75%)", url: "/dept/attendance/low", icon: "AlertTriangle" },
          { title: "Parent Notifications", url: "/dept/attendance/notify", icon: "MailWarning" },
          { title: "Class-wise Summary", url: "/dept/attendance/classwise", icon: "BarChart3" },
        ],
      },
      {
        label: "REPORTS",
        items: [
          { title: "Analytics", url: "/dept/attendance/analytics", icon: "TrendingUp" },
          { title: "Export", url: "/dept/attendance/export", icon: "Download" },
          { title: "SARAL Compliance", url: "/dept/attendance/saral", icon: "ShieldCheck" },
        ],
      },
    ],
  },
  hr: {
    logo: "Classgrid",
    subtitle: "HR & Payroll",
    sections: [
      {
        label: "STAFF",
        items: [
          { title: "Dashboard", url: "/dept/hr/dashboard", icon: "LayoutDashboard" },
          { title: "Chat", url: "/chat", icon: "MessageSquare" },
          { title: "All Staff", url: "/dept/hr/staff", icon: "Users" },
          { title: "Add Staff", url: "/dept/hr/add-staff", icon: "UserPlus" },
          { title: "Departments", url: "/dept/hr/departments", icon: "Building" },
        ],
      },
      {
        label: "LEAVE",
        items: [
          { title: "Leave Requests", url: "/dept/hr/leave-requests", icon: "CalendarClock" },
          { title: "Leave Policy", url: "/dept/hr/leave-policy", icon: "FileText" },
          { title: "Leave Balance", url: "/dept/hr/leave-balance", icon: "Scale" },
          { title: "Holiday Calendar", url: "/dept/hr/holidays", icon: "CalendarHeart" },
        ],
      },
      {
        label: "PAYROLL",
        items: [
          { title: "Salary Processing", url: "/dept/hr/payroll", icon: "Banknote" },
          { title: "Pay Slips", url: "/dept/hr/payslips", icon: "Receipt" },
          { title: "Payroll Reports", url: "/dept/hr/payroll-reports", icon: "FileBarChart" },
        ],
      },
    ],
  },
  hostel: {
    logo: "Classgrid",
    subtitle: "Hostel & Transport",
    sections: [
      {
        label: "HOSTEL",
        items: [
          { title: "Dashboard", url: "/dept/hostel/dashboard", icon: "LayoutDashboard" },
          { title: "Chat", url: "/chat", icon: "MessageSquare" },
          { title: "Room Allocation", url: "/dept/hostel/rooms", icon: "BedDouble" },
          { title: "Residents", url: "/dept/hostel/residents", icon: "Users" },
          { title: "Complaints", url: "/dept/hostel/complaints", icon: "MessageSquareWarning" },
          { title: "Mess Menu", url: "/dept/hostel/mess", icon: "Utensils" },
        ],
      },
      {
        label: "TRANSPORT",
        items: [
          { title: "Routes & Buses", url: "/dept/transport/routes", icon: "Map" },
          { title: "Passengers", url: "/dept/transport/passengers", icon: "UsersRound" },
          { title: "Fee Collection", url: "/dept/transport/fees", icon: "Wallet" },
        ],
      },
    ],
  },
  faculty: {
    logo: "Classgrid",
    subtitle: "Faculty",
    sections: [
      {
        label: "CORE",
        items: [
          { title: "Home", url: "/classrooms", icon: "Home" },
          { title: "Work", url: "/work", icon: "BookOpen" },
          { title: "Schedule", url: "/tools", icon: "Calendar" },
        ],
      },
      {
        label: "CONNECT",
        items: [
          { title: "Messages", url: "/chat", icon: "MessageCircle", badge: 2 },
          { title: "Notifications", url: "/notifications", icon: "Bell", badge: 3 },
          { title: "Forum", url: "/forum", icon: "Users" },
        ],
      },
      {
        label: "TOOLS",
        items: [
          { title: "Classgrid AI", url: "/classgrid-ai", icon: "Bot" },
          { title: "Google Drive", url: "/drive", icon: "HardDrive" },
          { title: "Virtual ID", url: "/virtual-id", icon: "IdCard" },
        ],
      },
      {
        label: "",
        items: [
          { title: "Requests", url: "/join-requests", icon: "UserPlus", badge: 5 },
          { title: "What's New", url: "/whats-new", icon: "Sparkles" },
          { title: "Organization", url: "/organization", icon: "Building2" },
          { title: "Platform Feedback", url: "/platform-feedback", icon: "Bug" },
          { title: "Marketplace", url: "/marketplace", icon: "Store" },
        ],
      },
    ],
  },
  student: {
    logo: "Classgrid",
    subtitle: "Student",
    sections: [
      {
        label: "CORE",
        items: [
          { title: "Home", url: "/classrooms", icon: "Home" },
          { title: "Work", url: "/work", icon: "BookOpen" },
          { title: "Schedule", url: "/tools", icon: "Calendar" },
        ],
      },
      {
        label: "CONNECT",
        items: [
          { title: "Messages", url: "/chat", icon: "MessageCircle", badge: 2 },
          { title: "Notifications", url: "/notifications", icon: "Bell", badge: 3 },
          { title: "Forum", url: "/forum", icon: "Users" },
        ],
      },
      {
        label: "TOOLS",
        items: [
          { title: "Classgrid AI", url: "/classgrid-ai", icon: "Bot" },
          { title: "Virtual ID", url: "/virtual-id", icon: "IdCard" },
          { title: "Marketplace", url: "/marketplace", icon: "Store" },
        ],
      },
      {
        label: "",
        items: [
          { title: "My Requests", url: "/my-requests", icon: "FileClock" },
          { title: "What's New", url: "/whats-new", icon: "Sparkles" },
          { title: "Organization", url: "/organization", icon: "Building2" },
          { title: "Platform Feedback", url: "/platform-feedback", icon: "Bug" },
        ],
      },
    ],
  },
};
