import { Navigate, Route, Routes } from "react-router-dom";
import { CandidatePortalPage } from "@/features/admission-portal/pages/CandidatePortalPage";
import { ParentTrackerPage } from "@/features/admission-portal/pages/ParentTrackerPage";

import { DashboardHomePage } from "@/features/superadmin/pages/DashboardHomePage";
import { LeadsPage } from "@/features/superadmin/pages/LeadsPage";
import { SupportTicketsPage } from "@/features/superadmin/pages/SupportTicketsPage";
import { ReviewsPage } from "@/features/superadmin/pages/ReviewsPage";
import { ChangelogPage } from "@/features/superadmin/pages/ChangelogPage";
import { AuditPage } from "@/features/superadmin/pages/AuditPage";
import { ActivityLogPage } from "@/features/superadmin/pages/ActivityLogPage";
import { ConfigPage } from "@/features/superadmin/pages/ConfigPage";
import { UsersPage } from "@/features/superadmin/pages/UsersPage";
import { GlobalUsersPage } from "@/features/superadmin/pages/GlobalUsersPage";
import { GdprPage } from "@/features/superadmin/pages/GdprPage";
import { BackupPage } from "@/features/superadmin/pages/BackupPage";
import { AnalyticsPage } from "@/features/superadmin/pages/AnalyticsPage";
import { AlertsPage } from "@/features/superadmin/pages/AlertsPage";
import { OnboardPage } from "@/features/superadmin/pages/OnboardPage";
import { DirectOnboardPage } from "@/features/superadmin/pages/DirectOnboardPage";
import { HelpdeskPage } from "@/features/superadmin/pages/HelpdeskPage";
import { TeamPage } from "@/features/superadmin/pages/TeamPage";
import { BillingPage } from "@/features/superadmin/pages/BillingPage";
import { RevenuePage } from "@/features/superadmin/pages/RevenuePage";
import { FeedbackPage } from "@/features/superadmin/pages/FeedbackPage";
import { SubscribersPage } from "@/features/superadmin/pages/SubscribersPage";
import { SystemHealthPage } from "@/features/superadmin/pages/SystemHealthPage";
import { FeatureFlagsPage } from "@/features/superadmin/pages/FeatureFlagsPage";
import { TransactionsPage } from "@/features/superadmin/pages/TransactionsPage";
import { FailedPaymentsPage } from "@/features/superadmin/pages/FailedPaymentsPage";
import { RollbackPage } from "@/features/superadmin/pages/RollbackPage";
import { ContentModerationPage } from "@/features/superadmin/pages/ContentModerationPage";
import { NotificationEnginePage } from "@/features/superadmin/pages/NotificationEnginePage";
import { OrganizationsPage } from "@/features/superadmin/pages/OrganizationsPage";
import { OrgDetailPage } from "@/features/superadmin/pages/OrgDetailPage";
import { PlatformAnnouncementsPage } from "@/features/superadmin/pages/PlatformAnnouncementsPage";
import { SharedProfilePage } from "@/features/shared/pages/SharedProfilePage";
import { SharedSettingsPage } from "@/features/shared/pages/SharedSettingsPage";
import { OrgAdminDashboardRouter } from "@/features/org/pages/OrgAdminDashboardRouter";
import { OrgAnnouncementsPage } from "@/features/org/pages/OrgAnnouncementsPage";
import { OrgStudentsPage } from "@/features/org/pages/OrgStudentsPage";
import { OrgFacultyPage } from "@/features/org/pages/OrgFacultyPage";
import { StudentDashboardPage } from "@/features/student/pages/StudentDashboardPage";
import { StudentWorkPage } from "@/features/student/pages/StudentWorkPage";
import { FacultyWorkPage } from "@/features/faculty/pages/FacultyWorkPage";
import { AdmissionDashboardRouter } from "@/features/admission/pages/AdmissionDashboardRouter";
import { AllApplicationsPage } from "@/features/admission/pages/AllApplicationsPage";
import { ApplicationDetailsPage } from "@/features/admission/pages/ApplicationDetailsPage";
import { DocumentVerificationPage } from "@/features/admission/pages/DocumentVerificationPage";
import { MeritListPage } from "@/features/admissions/pages/MeritListPage"; // Keep old placeholder if I didn't build it
import { EnrollmentPage } from "@/features/admission/pages/EnrollmentPage";
import { AdmissionConfigPage } from "@/features/admissions/pages/AdmissionConfigPage";
import { NewApplicationPage } from "@/features/admissions/pages/NewApplicationPage";
import { AdmissionSchedulePage } from "@/features/admissions/pages/AdmissionSchedulePage";
import { FeeStructurePage } from "@/features/admissions/pages/FeeStructurePage";
import AdmissionAnalyticsPage from "@/features/admission/pages/AdmissionAnalyticsPage";
import { ExportDataPage } from "@/features/admission/pages/ExportDataPage";
import { CETReportsPage } from "@/features/admission/pages/CETReportsPage";
import { FormBuilderPage } from "@/features/admissions/pages/FormBuilderPage";
import { CETImportPage } from "@/features/admissions/pages/CETImportPage";
import { RLAReportingPage } from "@/features/admissions/pages/RLAReportingPage";
import { CAPUpgradePage } from "@/features/admissions/pages/CAPUpgradePage";
import { VacancyTrackerPage } from "@/features/admissions/pages/VacancyTrackerPage";
import { LeadTrackingPage } from "@/features/admissions/pages/LeadTrackingPage";
import { CommunicationPage } from "@/features/admissions/pages/CommunicationPage";
import { BulkSmsPage } from "@/features/admissions/pages/BulkSmsPage";
import { FeesDashboardRouter } from "@/features/fees/pages/FeesDashboardRouter";
import { ExamsDashboardRouter } from "@/features/exams/pages/ExamsDashboardRouter";
import { LibraryDashboardRouter } from "@/features/library/pages/LibraryDashboardRouter";
import { AttendanceDashboardRouter } from "@/features/attendance/pages/AttendanceDashboardRouter";
import { HRDashboardRouter } from "@/features/hr/pages/HRDashboardRouter";
import { HostelDashboardPage } from "@/features/hostel/pages/HostelDashboardPage";
import { SupportPage } from "@/features/support/pages/SupportPage";
import { GenericPage } from "@/features/system/pages/GenericPage";
import { GlobeDemoPage } from "@/features/system/pages/GlobeDemoPage";
import { NotFoundPage } from "@/features/system/pages/NotFoundPage";
import { InstitutionAdminLoginPage } from "@/features/auth/pages/InstitutionAdminLoginPage";
import { InstitutionUserLoginPage } from "@/features/auth/pages/InstitutionUserLoginPage";
import { PlatformLoginPage } from "@/features/auth/pages/PlatformLoginPage";
import { ForgotPasswordPage } from "@/features/auth/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "@/features/auth/pages/ResetPasswordPage";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { getRedirectPath } from "@/features/auth/auth-helpers";
import { useCurrentUser } from "@/features/auth/queries/useCurrentUser";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export function AppRouter() {
  // ── SUBDOMAIN DETECTION ──
  const hostname = window.location.hostname;
  const subdomain = hostname.split(".")[0];
  const isSuperAdmin = subdomain === "superadmin";

  return (
    <Routes>
      {/* ── DYNAMIC AUTH ROUTES (Based on Subdomain) ── */}
      <Route 
        path="/login" 
        element={isSuperAdmin ? <PlatformLoginPage /> : <InstitutionUserLoginPage />} 
      />
      <Route path="/auth/user" element={<InstitutionUserLoginPage />} />
      <Route path="/student/login" element={<InstitutionUserLoginPage preferredRole="student" />} />
      <Route path="/faculty/login" element={<InstitutionUserLoginPage preferredRole="teacher" />} />
      <Route path="/admin-login" element={<InstitutionAdminLoginPage />} />
      <Route path="/admin/login" element={<InstitutionAdminLoginPage />} />
      <Route path="/org/login" element={<InstitutionAdminLoginPage />} />
      <Route path="/auth/admin" element={<InstitutionAdminLoginPage />} />
      <Route path="/superadmin" element={<PlatformLoginPage />} />
      <Route path="/superadmin/login" element={<PlatformLoginPage />} />
      <Route path="/terms" element={<GenericPage title="Terms of Service" />} />
      <Route path="/privacy" element={<GenericPage title="Privacy Policy" />} />
      <Route path="/privacy-policy" element={<GenericPage title="Privacy Policy" />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/demo/globe" element={<GlobeDemoPage />} />

      {/* ── CANDIDATE PORTAL ROUTES ── */}
      <Route path="/apply/:orgId" element={<CandidatePortalPage />} />
      <Route path="/parent/:orgId" element={<ParentTrackerPage />} />

      {/* ── DASHBOARD ROUTES ── */}
      <Route element={<RequireAuth />}>
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<DefaultDashboardRedirect />} />
        <Route path="/admin/dashboard" element={<Navigate to="/org/dashboard" replace />} />

        {/* 1. Super Admin Dashboard */}
        <Route path="/superadmin/dashboard" element={<DashboardHomePage />} />

        {/* Super Admin — Leads */}
        <Route path="/superadmin/leads" element={<LeadsPage />} />

        {/* Super Admin — Support Tickets */}
        <Route path="/superadmin/support" element={<SupportTicketsPage />} />

        {/* Super Admin — Reviews */}
        <Route path="/superadmin/reviews" element={<ReviewsPage />} />

        {/* Super Admin — All Organizations */}
        <Route path="/superadmin/orgs" element={<OrganizationsPage />} />

        {/* Super Admin — Organization Detail */}
        <Route path="/superadmin/orgs/:id" element={<OrgDetailPage />} />

        {/* Super Admin — Announcements */}
        <Route path="/superadmin/announcements" element={<PlatformAnnouncementsPage />} />

        {/* Super Admin — Changelog */}
        <Route path="/superadmin/changelog" element={<ChangelogPage />} />
        <Route path="/superadmin/subscribers" element={<SubscribersPage />} />

        {/* Super Admin — Audit (NAAC/NBA Compliance — for org data) */}
        <Route path="/superadmin/audit" element={<AuditPage />} />

        {/* Super Admin — Activity Logs (Platform admin action trail) */}
        <Route path="/superadmin/activity-logs" element={<ActivityLogPage />} />

        {/* Super Admin — System */}
        <Route path="/superadmin/config" element={<ConfigPage />} />
        <Route path="/superadmin/system-health" element={<SystemHealthPage />} />
        <Route path="/superadmin/feature-flags" element={<FeatureFlagsPage />} />
        <Route path="/superadmin/rollback" element={<RollbackPage />} />
        <Route path="/superadmin/moderation" element={<ContentModerationPage />} />

        {/* Super Admin — Users */}
        <Route path="/superadmin/users" element={<UsersPage />} />
        <Route path="/superadmin/global-users" element={<GlobalUsersPage />} />
        <Route path="/superadmin/gdpr" element={<GdprPage />} />
        <Route path="/superadmin/backups" element={<BackupPage />} />

        {/* Super Admin — Analytics */}
        <Route path="/superadmin/analytics" element={<AnalyticsPage />} />

        {/* Super Admin — Alerts */}
        <Route path="/superadmin/alerts" element={<AlertsPage />} />

        {/* Super Admin — Onboard */}
        <Route path="/superadmin/onboard" element={<OnboardPage />} />

        {/* Super Admin — Billing */}
        <Route path="/superadmin/billing" element={<BillingPage />} />
        
        {/* Super Admin — Revenue */}
        <Route path="/superadmin/revenue" element={<RevenuePage />} />
        <Route path="/superadmin/transactions" element={<TransactionsPage />} />
        <Route path="/superadmin/failed-payments" element={<FailedPaymentsPage />} />

        {/* Super Admin — Feedback */}
        <Route path="/superadmin/feedback" element={<FeedbackPage />} />

        {/* Super Admin — Notifications Engine */}
        <Route path="/superadmin/notifications" element={<NotificationEnginePage />} />

        {/* Super Admin — Direct Onboard (no demo required) */}
        <Route path="/superadmin/onboard" element={<DirectOnboardPage />} />

        {/* Super Admin — Onboard via pending demo orgs */}
        <Route path="/superadmin/onboard/pending" element={<OnboardPage />} />

        {/* Super Admin — Helpdesk Chat */}
        <Route path="/superadmin/helpdesk" element={<HelpdeskPage />} />

        {/* Super Admin — Platform Team */}
        <Route path="/superadmin/team" element={<TeamPage />} />

        {/* Super Admin — Profile & Settings */}
        <Route path="/superadmin/profile" element={<SharedProfilePage />} />
        <Route path="/superadmin/settings" element={<SharedSettingsPage />} />



        {/* 2. Org Admin Dashboard */}
        <Route path="/org/dashboard" element={<OrgAdminDashboardRouter />} />
        <Route path="/org/announcements" element={<OrgAnnouncementsPage />} />
        <Route path="/org/students" element={<OrgStudentsPage />} />
        <Route path="/org/faculty" element={<OrgFacultyPage />} />
        <Route path="/org/admissions" element={<Navigate to="/dept/admissions/dashboard" replace />} />

        {/* 3. Admissions Department Dashboard */}
        <Route path="/dept/admissions/dashboard" element={<AdmissionDashboardRouter />} />
        <Route path="/dept/admissions/applications" element={<AllApplicationsPage />} />
        <Route path="/dept/admissions/applications/:id" element={<ApplicationDetailsPage />} />
        <Route path="/dept/admissions/new" element={<NewApplicationPage />} />
        <Route path="/dept/admissions/documents" element={<DocumentVerificationPage />} />
        <Route path="/dept/admissions/merit" element={<MeritListPage />} />
        <Route path="/dept/admissions/enroll" element={<EnrollmentPage />} />
        <Route path="/dept/admissions/config" element={<AdmissionConfigPage />} />
        <Route path="/dept/admissions/fees" element={<FeeStructurePage />} />
        <Route path="/dept/admissions/schedule" element={<AdmissionSchedulePage />} />
        <Route path="/dept/admissions/analytics" element={<AdmissionAnalyticsPage />} />
        <Route path="/dept/admissions/export" element={<ExportDataPage />} />
        <Route path="/dept/admissions/cet-dte" element={<CETReportsPage />} />
        <Route path="/dept/admissions/cet-import" element={<CETImportPage />} />
        <Route path="/dept/admissions/rla-reporting" element={<RLAReportingPage />} />
        <Route path="/dept/admissions/cap-upgrade" element={<CAPUpgradePage />} />
        <Route path="/dept/admissions/vacancy-tracker" element={<VacancyTrackerPage />} />
        <Route path="/dept/admissions/form-builder" element={<FormBuilderPage />} />
        <Route path="/dept/admissions/crm" element={<LeadTrackingPage />} />
        <Route path="/dept/admissions/comm" element={<CommunicationPage />} />
        <Route path="/dept/admissions/bulk" element={<BulkSmsPage />} />

        {/* 4. Fees Department Dashboard */}
        <Route path="/dept/fees/dashboard" element={<FeesDashboardRouter />} />

        {/* 5. Examination Department Dashboard */}
        <Route path="/dept/exams/dashboard" element={<ExamsDashboardRouter />} />

        {/* 6. Library Department Dashboard */}
        <Route path="/dept/library/dashboard" element={<LibraryDashboardRouter />} />

        {/* 7. Attendance Department Dashboard */}
        <Route path="/dept/attendance/dashboard" element={<AttendanceDashboardRouter />} />

        {/* 8. HR & Payroll Department Dashboard */}
        <Route path="/dept/hr/dashboard" element={<HRDashboardRouter />} />

        {/* 9. Hostel & Transport Dashboard */}
        <Route path="/dept/hostel/dashboard" element={<HostelDashboardPage />} />

        {/* 10. Faculty Dashboard */}
        <Route path="/work" element={<FacultyWorkPage />} />

        {/* 11. Student Dashboard */}
        <Route path="/student/dashboard" element={<StudentDashboardPage />} />
        <Route path="/student/work" element={<StudentWorkPage />} />

        {/* ── Common pages ── */}
        <Route path="/classroom" element={<GenericPage title="Home" />} />
        <Route path="/classrooms" element={<GenericPage title="Home" />} />
        <Route path="/enter-org-code" element={<GenericPage title="Enter Organization Code" />} />
        <Route path="/tools" element={<GenericPage title="Schedule" />} />
        <Route path="/chat" element={<GenericPage title="Messages" />} />
        <Route path="/notifications" element={<GenericPage title="Notifications" />} />
        <Route path="/forum" element={<GenericPage title="Forum" />} />
        <Route path="/classgrid-ai" element={<GenericPage title="Classgrid AI" />} />
        <Route path="/drive" element={<GenericPage title="Google Drive" />} />
        <Route path="/virtual-id" element={<GenericPage title="Virtual ID" />} />
        <Route path="/join-requests" element={<GenericPage title="Requests" />} />
        <Route path="/whats-new" element={<GenericPage title="What's New" />} />
        <Route path="/organization" element={<GenericPage title="Organization" />} />
        <Route path="/platform-feedback" element={<GenericPage title="Platform Feedback" />} />
        <Route path="/marketplace" element={<GenericPage title="Marketplace" />} />
        <Route path="/my-requests" element={<GenericPage title="My Requests" />} />
        <Route path="/profile" element={<SharedProfilePage />} />
        <Route path="/settings" element={<SharedSettingsPage />} />
        <Route path="/support" element={<SupportPage />} />

        {/* ── Wildcard sub-routes ── */}
        <Route path="/superadmin/*" element={<GenericPage />} />
        <Route path="/org/*" element={<GenericPage />} />
        <Route path="/dept/admissions/*" element={<GenericPage title="Admissions Module" />} />
        <Route path="/dept/fees/*" element={<GenericPage title="Fees Module" />} />
        <Route path="/dept/exams/*" element={<GenericPage title="Examination Module" />} />
        <Route path="/dept/library/*" element={<GenericPage title="Library Module" />} />
        <Route path="/dept/attendance/*" element={<GenericPage title="Attendance Module" />} />
        <Route path="/dept/hr/*" element={<GenericPage title="HR & Payroll Module" />} />
        <Route path="/dept/hostel/*" element={<GenericPage title="Hostel & Transport Module" />} />
        <Route path="/dept/transport/*" element={<GenericPage title="Transport Module" />} />
        <Route path="/student/*" element={<GenericPage title="Student Module" />} />
      </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function DefaultDashboardRedirect() {
  const { data: user } = useCurrentUser();

  return <Navigate to={getRedirectPath(user?.role)} replace />;
}
