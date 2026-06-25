export interface NavigationItem {
  title: string;
  url: string;
  icon: string;
  section: string;
}

export const SUPER_ADMIN_MENU: NavigationItem[] = [
  { title: "Dashboard", url: "/superadmin/dashboard", icon: "LayoutDashboard", section: "OVERVIEW" },
  { title: "Analytics", url: "/superadmin/analytics", icon: "TrendingUp", section: "OVERVIEW" },
  { title: "Alerts", url: "/superadmin/alerts", icon: "Bell", section: "OVERVIEW" },
  
  { title: "All Organizations", url: "/superadmin/orgs", icon: "Building2", section: "ORGANIZATIONS" },
  { title: "Onboard New Org", url: "/superadmin/onboard", icon: "PlusCircle", section: "ORGANIZATIONS" },
  { title: "Demo Leads", url: "/superadmin/leads", icon: "ClipboardList", section: "ORGANIZATIONS" },
  { title: "Plans & Billing", url: "/superadmin/billing", icon: "CreditCard", section: "ORGANIZATIONS" },
  
  { title: "Users & Roles", url: "/superadmin/users", icon: "Users", section: "PLATFORM" },
  { title: "Audit Logs", url: "/superadmin/audit", icon: "Shield", section: "PLATFORM" },
  { title: "Announcements", url: "/superadmin/announcements", icon: "Megaphone", section: "PLATFORM" },
  { title: "Changelog", url: "/superadmin/changelog", icon: "FileText", section: "PLATFORM" },
  { title: "System Config", url: "/superadmin/config", icon: "Settings", section: "PLATFORM" },
  
  { title: "Support Tickets", url: "/superadmin/support", icon: "Ticket", section: "SUPPORT" },
  { title: "Feedback", url: "/superadmin/feedback", icon: "MessageSquare", section: "SUPPORT" },
  { title: "NPS / Reviews", url: "/superadmin/reviews", icon: "Star", section: "SUPPORT" },
];

export const ORG_ADMIN_MENU: NavigationItem[] = [
  { title: "Dashboard", url: "/org/dashboard", icon: "LayoutDashboard", section: "OVERVIEW" },
  { title: "Announcements", url: "/org/announcements", icon: "Megaphone", section: "OVERVIEW" },
  
  { title: "Students", url: "/org/students", icon: "Users", section: "ACADEMICS" },
  { title: "Faculty", url: "/org/faculty", icon: "GraduationCap", section: "ACADEMICS" },
  { title: "Classrooms", url: "/org/classrooms", icon: "BookOpen", section: "ACADEMICS" },
  { title: "Timetable", url: "/org/timetable", icon: "CalendarDays", section: "ACADEMICS" },
  { title: "Academic Calendar", url: "/org/calendar", icon: "Calendar", section: "ACADEMICS" },
  { title: "Curriculum", url: "/org/curriculum", icon: "BookType", section: "ACADEMICS" },
  
  { title: "Admissions", url: "/org/admissions", icon: "UserPlus", section: "MANAGEMENT" },
  { title: "Fees & Payments", url: "/org/fees", icon: "IndianRupee", section: "MANAGEMENT" },
  { title: "Examinations", url: "/org/examinations", icon: "FileEdit", section: "MANAGEMENT" },
  { title: "Marks & Results", url: "/org/results", icon: "BarChart3", section: "MANAGEMENT" },
  { title: "Attendance", url: "/org/attendance", icon: "ClipboardCheck", section: "MANAGEMENT" },
  { title: "Leave Management", url: "/org/leaves", icon: "CalendarX2", section: "MANAGEMENT" },
  
  { title: "Library", url: "/org/library", icon: "Library", section: "FACILITIES" },
  { title: "Hostel", url: "/org/hostel", icon: "Home", section: "FACILITIES" },
  { title: "Canteen", url: "/org/canteen", icon: "Coffee", section: "FACILITIES" },
  { title: "Transport", url: "/org/transport", icon: "Bus", section: "FACILITIES" },
  
  { title: "NBA / NAAC", url: "/org/compliance/nba-naac", icon: "Award", section: "COMPLIANCE" },
  { title: "SARAL / DTE Reports", url: "/org/compliance/reports", icon: "FileUp", section: "COMPLIANCE" },
  { title: "Audit Trail", url: "/org/audit", icon: "Search", section: "COMPLIANCE" },
  
  { title: "Events & Seminars", url: "/org/events", icon: "CalendarStar", section: "ENGAGEMENT" },
  { title: "Alumni & Placements", url: "/org/alumni", icon: "GraduationCap", section: "ENGAGEMENT" },
  { title: "Feedback", url: "/org/feedback", icon: "MessageSquare", section: "ENGAGEMENT" },
  { title: "Org Chat", url: "/org/chat", icon: "MessageCircle", section: "ENGAGEMENT" },
  
  { title: "Classgrid AI", url: "/org/ai", icon: "Bot", section: "AI & TOOLS" },
  { title: "Analytics", url: "/org/analytics", icon: "PieChart", section: "AI & TOOLS" },
  { title: "College Website", url: "/org/website", icon: "Globe", section: "AI & TOOLS" },
  { title: "Certificates", url: "/org/certificates", icon: "ScrollText", section: "AI & TOOLS" },
];

export const ADMISSION_MENU: NavigationItem[] = [
  { title: "Dashboard", url: "/dept/admissions/dashboard", icon: "LayoutDashboard", section: "ADMISSIONS" },
  { title: "All Applications", url: "/dept/admissions/applications", icon: "Files", section: "ADMISSIONS" },
  { title: "New Application", url: "/dept/admissions/new", icon: "FilePlus", section: "ADMISSIONS" },
  { title: "Document Verification", url: "/dept/admissions/documents", icon: "FolderCheck", section: "ADMISSIONS" },
  { title: "Merit Lists", url: "/dept/admissions/merit", icon: "ListOrdered", section: "ADMISSIONS" },
  { title: "Enrollment", url: "/dept/admissions/enroll", icon: "CheckSquare", section: "ADMISSIONS" },
  
  { title: "Admission Config", url: "/dept/admissions/config", icon: "Settings2", section: "CONFIGURATION" },
  { title: "Fee Structure", url: "/dept/admissions/fees", icon: "Receipt", section: "CONFIGURATION" },
  { title: "Schedule & Rounds", url: "/dept/admissions/schedule", icon: "CalendarClock", section: "CONFIGURATION" },
  { title: "Form Builder", url: "/dept/admissions/form-builder", icon: "FormInput", section: "CONFIGURATION" },
  
  { title: "Analytics", url: "/dept/admissions/analytics", icon: "TrendingUp", section: "REPORTS" },
  { title: "Export Data", url: "/dept/admissions/export", icon: "Download", section: "REPORTS" },
  { title: "CET / DTE Reports", url: "/dept/admissions/cet-dte", icon: "FileBarChart", section: "REPORTS" },
  
  { title: "Lead Tracking", url: "/dept/admissions/crm", icon: "PhoneCall", section: "CRM" },
  { title: "Communication", url: "/dept/admissions/comm", icon: "Mail", section: "CRM" },
  { title: "Bulk SMS / WhatsApp", url: "/dept/admissions/bulk", icon: "MessageSquareShare", section: "CRM" },
];

export const FEES_MENU: NavigationItem[] = [
  { title: "Dashboard", url: "/dept/fees/dashboard", icon: "LayoutDashboard", section: "FEES" },
  { title: "Collect Payment", url: "/dept/fees/collect", icon: "CreditCard", section: "FEES" },
  { title: "All Transactions", url: "/dept/fees/transactions", icon: "ArrowRightLeft", section: "FEES" },
  { title: "Defaulters List", url: "/dept/fees/defaulters", icon: "AlertOctagon", section: "FEES" },
  { title: "Receipts", url: "/dept/fees/receipts", icon: "ReceiptText", section: "FEES" },
  
  { title: "Fee Structure", url: "/dept/fees/structure", icon: "Settings2", section: "CONFIGURATION" },
  { title: "Installment Plans", url: "/dept/fees/installments", icon: "CalendarDays", section: "CONFIGURATION" },
  { title: "Scholarships & Waivers", url: "/dept/fees/scholarships", icon: "TicketPercent", section: "CONFIGURATION" },
  { title: "Late Fee Rules", url: "/dept/fees/late-rules", icon: "ClockAlert", section: "CONFIGURATION" },
  
  { title: "Collection Analytics", url: "/dept/fees/analytics", icon: "PieChart", section: "REPORTS" },
  { title: "Export Reports", url: "/dept/fees/export", icon: "Download", section: "REPORTS" },
  { title: "Class-wise Summary", url: "/dept/fees/summary", icon: "BarChart4", section: "REPORTS" },
  { title: "Bank Reconciliation", url: "/dept/fees/reconciliation", icon: "Landmark", section: "REPORTS" },
];

export const EXAM_MENU: NavigationItem[] = [
  { title: "Dashboard", url: "/dept/exams/dashboard", icon: "LayoutDashboard", section: "EXAMS" },
  { title: "Exam Schedule", url: "/dept/exams/schedule", icon: "CalendarClock", section: "EXAMS" },
  { title: "Create Exam", url: "/dept/exams/create", icon: "FilePlus2", section: "EXAMS" },
  { title: "Online Exams", url: "/dept/exams/online", icon: "MonitorPlay", section: "EXAMS" },
  { title: "Hall Tickets", url: "/dept/exams/hall-tickets", icon: "Ticket", section: "EXAMS" },
  
  { title: "Marks Entry", url: "/dept/exams/marks", icon: "PenLine", section: "RESULTS" },
  { title: "Results Processing", url: "/dept/exams/results", icon: "Settings", section: "RESULTS" },
  { title: "Grade Sheets", url: "/dept/exams/grades", icon: "FileSpreadsheet", section: "RESULTS" },
  { title: "Internal Assessment", url: "/dept/exams/internal", icon: "FileCheck2", section: "RESULTS" },
  
  { title: "Question Pool", url: "/dept/exams/questions", icon: "Database", section: "QUESTION BANK" },
  { title: "AI Paper Generator", url: "/dept/exams/ai-paper", icon: "Bot", section: "QUESTION BANK" },
  { title: "Past Papers", url: "/dept/exams/past-papers", icon: "History", section: "QUESTION BANK" },
  
  { title: "Performance Analytics", url: "/dept/exams/analytics", icon: "TrendingUp", section: "REPORTS" },
  { title: "Export", url: "/dept/exams/export", icon: "Download", section: "REPORTS" },
  { title: "Toppers & Awards", url: "/dept/exams/toppers", icon: "Trophy", section: "REPORTS" },
];

export const LIBRARY_MENU: NavigationItem[] = [
  { title: "Dashboard", url: "/dept/library/dashboard", icon: "LayoutDashboard", section: "LIBRARY" },
  { title: "All Books", url: "/dept/library/books", icon: "Library", section: "LIBRARY" },
  { title: "Add Book", url: "/dept/library/add", icon: "BookPlus", section: "LIBRARY" },
  { title: "Search Catalog", url: "/dept/library/search", icon: "Search", section: "LIBRARY" },
  
  { title: "Issue Book", url: "/dept/library/issue", icon: "BookUp", section: "CIRCULATION" },
  { title: "Return Book", url: "/dept/library/return", icon: "BookDown", section: "CIRCULATION" },
  { title: "Overdue Books", url: "/dept/library/overdue", icon: "AlertTriangle", section: "CIRCULATION" },
  { title: "Issue History", url: "/dept/library/history", icon: "History", section: "CIRCULATION" },
  
  { title: "E-Books", url: "/dept/library/ebooks", icon: "TabletSmartphone", section: "DIGITAL" },
  { title: "Journal Subscriptions", url: "/dept/library/journals", icon: "Newspaper", section: "DIGITAL" },
  { title: "Notes Marketplace", url: "/dept/library/notes", icon: "Store", section: "DIGITAL" },
  
  { title: "Usage Analytics", url: "/dept/library/analytics", icon: "TrendingUp", section: "REPORTS" },
  { title: "Stock Report", url: "/dept/library/stock", icon: "Package", section: "REPORTS" },
];

export const ATTENDANCE_MENU: NavigationItem[] = [
  { title: "Dashboard", url: "/dept/attendance/dashboard", icon: "LayoutDashboard", section: "ATTENDANCE" },
  { title: "Mark Attendance", url: "/dept/attendance/mark", icon: "CheckCircle", section: "ATTENDANCE" },
  { title: "Daily Report", url: "/dept/attendance/daily", icon: "CalendarRange", section: "ATTENDANCE" },
  { title: "Monthly Report", url: "/dept/attendance/monthly", icon: "CalendarDays", section: "ATTENDANCE" },
  
  { title: "Low Attendance (< 75%)", url: "/dept/attendance/low", icon: "AlertTriangle", section: "TRACKING" },
  { title: "Parent Notifications", url: "/dept/attendance/notify", icon: "MailWarning", section: "TRACKING" },
  { title: "Class-wise Summary", url: "/dept/attendance/classwise", icon: "BarChart3", section: "TRACKING" },
  
  { title: "Analytics", url: "/dept/attendance/analytics", icon: "TrendingUp", section: "REPORTS" },
  { title: "Export", url: "/dept/attendance/export", icon: "Download", section: "REPORTS" },
  { title: "SARAL Compliance", url: "/dept/attendance/saral", icon: "ShieldCheck", section: "REPORTS" },
];

export const HR_MENU: NavigationItem[] = [
  { title: "Dashboard", url: "/dept/hr/dashboard", icon: "LayoutDashboard", section: "STAFF" },
  { title: "All Staff", url: "/dept/hr/staff", icon: "Users", section: "STAFF" },
  { title: "Add Staff", url: "/dept/hr/add-staff", icon: "UserPlus", section: "STAFF" },
  { title: "Departments", url: "/dept/hr/departments", icon: "Building", section: "STAFF" },
  
  { title: "Leave Requests", url: "/dept/hr/leave-requests", icon: "CalendarClock", section: "LEAVE" },
  { title: "Leave Policy", url: "/dept/hr/leave-policy", icon: "FileText", section: "LEAVE" },
  { title: "Leave Balance", url: "/dept/hr/leave-balance", icon: "Scale", section: "LEAVE" },
  { title: "Holiday Calendar", url: "/dept/hr/holidays", icon: "CalendarHeart", section: "LEAVE" },
  
  { title: "Salary Processing", url: "/dept/hr/payroll", icon: "Banknote", section: "PAYROLL" },
  { title: "Pay Slips", url: "/dept/hr/payslips", icon: "Receipt", section: "PAYROLL" },
  { title: "Payroll Reports", url: "/dept/hr/payroll-reports", icon: "FileBarChart", section: "PAYROLL" },
];

export const HOSTEL_MENU: NavigationItem[] = [
  { title: "Dashboard", url: "/dept/hostel/dashboard", icon: "LayoutDashboard", section: "HOSTEL" },
  { title: "Room Allocation", url: "/dept/hostel/rooms", icon: "BedDouble", section: "HOSTEL" },
  { title: "Residents", url: "/dept/hostel/residents", icon: "Users", section: "HOSTEL" },
  { title: "Complaints", url: "/dept/hostel/complaints", icon: "MessageSquareWarning", section: "HOSTEL" },
  { title: "Mess Menu", url: "/dept/hostel/mess", icon: "Utensils", section: "HOSTEL" },
  
  { title: "Routes & Buses", url: "/dept/transport/routes", icon: "Map", section: "TRANSPORT" },
  { title: "Passengers", url: "/dept/transport/passengers", icon: "UsersRound", section: "TRANSPORT" },
  { title: "Fee Collection", url: "/dept/transport/fees", icon: "Wallet", section: "TRANSPORT" },
];

export const FACULTY_MENU: NavigationItem[] = [
  { title: "Home", url: "/faculty/dashboard", icon: "Home", section: "CORE" },
  { title: "Work", url: "/faculty/work", icon: "Briefcase", section: "CORE" },
  { title: "Schedule", url: "/tools", icon: "Calendar", section: "CORE" },
  
  { title: "Messages", url: "/chat", icon: "MessageCircle", section: "CONNECT" },
  { title: "Notifications", url: "/notifications", icon: "Bell", section: "CONNECT" },
  { title: "Forum", url: "/forum", icon: "Users", section: "CONNECT" },
  
  { title: "Classgrid AI", url: "/classgrid-ai", icon: "Bot", section: "TOOLS" },
  { title: "Google Drive", url: "/drive", icon: "HardDrive", section: "TOOLS" },
  { title: "Virtual ID", url: "/virtual-id", icon: "IdCard", section: "TOOLS" },
  
  { title: "Requests", url: "/join-requests", icon: "UserPlus", section: "OTHER" },
  { title: "What's New", url: "/whats-new", icon: "Sparkles", section: "OTHER" },
  { title: "Organization", url: "/organization", icon: "Building2", section: "OTHER" },
  { title: "Platform Feedback", url: "/platform-feedback", icon: "Bug", section: "OTHER" },
  { title: "Marketplace", url: "/marketplace", icon: "Store", section: "OTHER" },
];

export const STUDENT_MENU: NavigationItem[] = [
  { title: "Home", url: "/student/dashboard", icon: "Home", section: "CORE" },
  { title: "Work", url: "/student/work", icon: "Briefcase", section: "CORE" },
  { title: "Schedule", url: "/tools", icon: "Calendar", section: "CORE" },
  
  { title: "Messages", url: "/chat", icon: "MessageCircle", section: "CONNECT" },
  { title: "Notifications", url: "/notifications", icon: "Bell", section: "CONNECT" },
  { title: "Forum", url: "/forum", icon: "Users", section: "CONNECT" },
  
  { title: "Classgrid AI", url: "/classgrid-ai", icon: "Bot", section: "TOOLS" },
  { title: "Virtual ID", url: "/virtual-id", icon: "IdCard", section: "TOOLS" },
  { title: "Marketplace", url: "/marketplace", icon: "Store", section: "TOOLS" },
  
  { title: "My Requests", url: "/my-requests", icon: "FileClock", section: "OTHER" },
  { title: "What's New", url: "/whats-new", icon: "Sparkles", section: "OTHER" },
  { title: "Organization", url: "/organization", icon: "Building2", section: "OTHER" },
  { title: "Platform Feedback", url: "/platform-feedback", icon: "Bug", section: "OTHER" },
];
