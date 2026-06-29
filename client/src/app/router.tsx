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
import { CustomDomainsPage } from "@/features/superadmin/pages/CustomDomainsPage";
import { AnalyticsPage } from "@/features/superadmin/pages/AnalyticsPage";
import { AlertsPage } from "@/features/superadmin/pages/AlertsPage";
import { OnboardPage } from "@/features/superadmin/pages/OnboardPage";
import { DirectOnboardPage } from "@/features/superadmin/pages/DirectOnboardPage";
import { ClassgridTalkPage } from "@/features/superadmin/pages/ClassgridTalkPage";
import { TeamPage } from "@/features/superadmin/pages/TeamPage";
import { BillingPage } from "@/features/superadmin/pages/BillingPage";
import { RevenuePage } from "@/features/superadmin/pages/RevenuePage";
import { FeedbackPage } from "@/features/superadmin/pages/FeedbackPage";
import { SubscribersPage } from "@/features/superadmin/pages/SubscribersPage";
import { ChatPage } from "@/features/chat/pages/ChatPage";
import { SystemHealthPage } from "@/features/superadmin/pages/SystemHealthPage";
import { FeatureFlagsPage } from "@/features/superadmin/pages/FeatureFlagsPage";
import { TransactionsPage } from "@/features/superadmin/pages/TransactionsPage";
import { FailedPaymentsPage } from "@/features/superadmin/pages/FailedPaymentsPage";
import { RollbackPage } from "@/features/superadmin/pages/RollbackPage";
import { ContentModerationPage } from "@/features/superadmin/pages/ContentModerationPage";
import { NotificationEnginePage } from "@/features/superadmin/pages/NotificationEnginePage";
import { OrganizationsPage } from "@/features/superadmin/pages/OrganizationsPage";
import { OrgDetailPage } from "@/features/superadmin/pages/OrgDetailPage";
import { OrgDetailsPage } from "@/features/superadmin/pages/OrgDetailsPage";
import { PlatformAnnouncementsPage } from "@/features/superadmin/pages/PlatformAnnouncementsPage";
import { SharedProfilePage } from "@/features/shared/pages/SharedProfilePage";
import { SandboxPage } from "@/features/superadmin/pages/SandboxPage";
import { SharedSettingsPage } from "@/features/shared/pages/SharedSettingsPage";
import { ClassroomsPage } from "@/features/classrooms/pages/ClassroomsPage";
import { WebsiteCMSPage } from "@/features/website_cms/pages/WebsiteCMSPage";

import { StudentHomePage } from "@/features/student/pages/StudentHomePage";
import { StudentWorkPage } from "@/features/student/pages/StudentWorkPage";
import { FacultyHomePage } from "@/features/faculty/pages/FacultyHomePage";
import { FacultyWorkPage } from "@/features/faculty/pages/FacultyWorkPage";
import { AdmissionDashboardRouter } from "@/features/admissions/pages/AdmissionDashboardRouter";
import { AllApplicationsPage } from "@/features/admissions/pages/AllApplicationsPage";
import { ApplicationDetailsPage } from "@/features/admissions/pages/ApplicationDetailsPage";
import { DocumentVerificationPage } from "@/features/admissions/pages/DocumentVerificationPage";
import { MeritListPage } from "@/features/admissions/pages/MeritListPage"; // Keep old placeholder if I didn't build it
import { EnrollmentPage } from "@/features/admissions/pages/EnrollmentPage";
import { AdmissionConfigPage } from "@/features/admissions/pages/AdmissionConfigPage";
import { NewApplicationPage } from "@/features/admissions/pages/NewApplicationPage";
import { AdmissionSchedulePage } from "@/features/admissions/pages/AdmissionSchedulePage";
import { FeeStructurePage } from "@/features/admissions/pages/FeeStructurePage";
import AdmissionAnalyticsPage from "@/features/admissions/pages/AdmissionAnalyticsPage";
import { ExportDataPage } from "@/features/admissions/pages/ExportDataPage";
import { CETReportsPage } from "@/features/admissions/pages/CETReportsPage";
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
import { ResultsProcessingPage } from "@/features/results/pages/ResultsProcessingPage";
import { ResultsPage } from "@/features/results/pages/ResultsPage";
import { ExamGradingPage } from "@/features/exams/pages/ExamGradingPage";
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

import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { OrgAdminLayout } from "@/components/layout/OrgAdminLayout";
import { DynamicRoleLayout } from "@/components/layout/DynamicRoleLayout";
import { ComingSoonPage } from "@/features/system/pages/ComingSoonPage";

import { TestForgotPassword } from "@/features/auth/pages/TestForgotPassword";
import { TestSuperAdmin } from "@/features/auth/pages/TestSuperAdmin";
import { TestResetPassword } from "@/features/auth/pages/TestResetPassword";


export function AppRouter() {
  // ── SUBDOMAIN DETECTION ──
  const hostname = window.location.hostname;
  const isCustomDomain =
    hostname !== "localhost" &&
    hostname !== "classgrid.in" &&
    !hostname.endsWith(".classgrid.in");
  const subdomain = hostname.split(".")[0];
  const isSuperAdmin = subdomain === "superadmin";

  return (
    <Routes>
      {/* ── TEST UI ROUTE ── */}
      <Route path="/test-forgot-password" element={<TestForgotPassword />} />
      <Route path="/test-super-admin" element={<TestSuperAdmin />} />
      <Route path="/test-reset-password" element={<TestResetPassword />} />

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
        
        {/* NEW SUPER ADMIN SHELL */}
        <Route element={<SuperAdminLayout />}>
          <Route path="/superadmin/dashboard" element={<DashboardHomePage />} />
          <Route path="/superadmin/analytics" element={<AnalyticsPage />} />
          <Route path="/superadmin/alerts" element={<AlertsPage />} />
          <Route path="/superadmin/orgs" element={<OrganizationsPage />} />
          <Route path="/superadmin/orgs/:id" element={<OrgDetailPage />} />
          <Route path="/superadmin/domains" element={<CustomDomainsPage />} />
          <Route path="/superadmin/domains/:orgId" element={<OrgDetailsPage />} />
          <Route path="/superadmin/onboard" element={<OnboardPage />} />
          <Route path="/superadmin/direct-onboard" element={<DirectOnboardPage />} />
          <Route path="/superadmin/leads" element={<LeadsPage />} />
          <Route path="/superadmin/billing" element={<BillingPage />} />
          <Route path="/superadmin/revenue" element={<RevenuePage />} />
          <Route path="/superadmin/transactions" element={<TransactionsPage />} />
          <Route path="/superadmin/failed-payments" element={<FailedPaymentsPage />} />
          <Route path="/superadmin/users" element={<UsersPage />} />
          <Route path="/superadmin/global-users" element={<GlobalUsersPage />} />
          <Route path="/superadmin/audit" element={<AuditPage />} />
          <Route path="/superadmin/activity-log" element={<ActivityLogPage />} />
          <Route path="/superadmin/announcements" element={<PlatformAnnouncementsPage />} />
          <Route path="/superadmin/config" element={<ConfigPage />} />
          <Route path="/superadmin/support" element={<SupportTicketsPage />} />
          <Route path="/superadmin/feedback" element={<FeedbackPage />} />
          <Route path="/superadmin/reviews" element={<ReviewsPage />} />
          <Route path="/superadmin/talk" element={<ClassgridTalkPage />} />
          <Route path="/superadmin/classgrid-talk" element={<ClassgridTalkPage />} />
          <Route path="/superadmin/system-health" element={<SystemHealthPage />} />
          <Route path="/superadmin/feature-flags" element={<FeatureFlagsPage />} />
          <Route path="/superadmin/content-moderation" element={<ContentModerationPage />} />
          <Route path="/superadmin/notification-engine" element={<NotificationEnginePage />} />
          <Route path="/superadmin/sandbox" element={<SandboxPage />} />
          <Route path="/superadmin/team" element={<TeamPage />} />
          <Route path="/superadmin/gdpr" element={<GdprPage />} />
          <Route path="/superadmin/backup" element={<BackupPage />} />
          <Route path="/superadmin/profile" element={<SharedProfilePage />} />
          <Route path="/superadmin/settings" element={<SharedSettingsPage />} />
          <Route path="/superadmin/chat" element={<ChatPage />} />
          <Route path="/superadmin/*" element={<ComingSoonPage />} />
        </Route>

        {/* NEW ORG ADMIN SHELL */}
        <Route element={<OrgAdminLayout />}>
          <Route path="/org/admin/settings" element={<SharedSettingsPage />} />
          <Route path="/org/admin/profile" element={<SharedProfilePage />} />
          <Route path="/org/admin/chat" element={<ChatPage />} />
          <Route path="/org/website" element={<WebsiteCMSPage />} />
          <Route path="/org/admin/dashboard" element={<GenericPage title="Org Overview" />} />
          <Route path="/org/admin/*" element={<ComingSoonPage />} />
          
          {/* Legacy redirects for compatibility */}
          <Route path="/org/settings" element={<Navigate to="/org/admin/settings" replace />} />
          <Route path="/org/profile" element={<Navigate to="/org/admin/profile" replace />} />
          <Route path="/org/chat" element={<Navigate to="/org/admin/chat" replace />} />
          <Route path="/org/dashboard" element={<Navigate to="/org/admin/dashboard" replace />} />
        </Route>

        <Route path="/" element={<DefaultDashboardRedirect />} />
        <Route path="/admin/dashboard" element={<Navigate to="/org/admin/dashboard" replace />} />

        {/* ── DYNAMIC ROLE LAYOUT (Wraps all 10 Dept Dashboards & Common Pages) ── */}
        <Route element={<DynamicRoleLayout />}>
          {/* Website CMS */}
          <Route path="/dept/admissions/website" element={<WebsiteCMSPage />} />
          <Route path="/dept/fees/website" element={<WebsiteCMSPage />} />
          <Route path="/dept/exams/website" element={<WebsiteCMSPage />} />
          <Route path="/dept/library/website" element={<WebsiteCMSPage />} />
          <Route path="/dept/attendance/website" element={<WebsiteCMSPage />} />
          <Route path="/dept/hr/website" element={<WebsiteCMSPage />} />
          <Route path="/dept/transport/website" element={<WebsiteCMSPage />} />
          <Route path="/faculty/website" element={<WebsiteCMSPage />} />

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
          <Route path="/dept/exams/results" element={<ResultsProcessingPage />} />

          {/* 6. Library Department Dashboard */}
          <Route path="/dept/library/dashboard" element={<LibraryDashboardRouter />} />

          {/* 7. Attendance Department Dashboard */}
          <Route path="/dept/attendance/dashboard" element={<AttendanceDashboardRouter />} />

          {/* 8. HR & Payroll Department Dashboard */}
          <Route path="/dept/hr/dashboard" element={<HRDashboardRouter />} />

          {/* 9. Hostel & Transport Dashboard */}
          <Route path="/dept/hostel/dashboard" element={<HostelDashboardPage />} />

          {/* 10. Faculty Dashboard */}
          <Route path="/faculty/dashboard" element={<FacultyHomePage />} />
          <Route path="/faculty/work" element={<FacultyWorkPage />} />
          <Route path="/exam/grading" element={<ExamGradingPage />} />

          {/* 11. Student Dashboard */}
          <Route path="/student/dashboard" element={<StudentHomePage />} />
          <Route path="/student/work" element={<StudentWorkPage />} />

          {/* ── Common pages ── */}
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/classroom" element={<ClassroomsPage />} />
          <Route path="/classrooms" element={<ClassroomsPage />} />
          <Route path="/enter-org-code" element={<GenericPage title="Enter Organization Code" />} />
          <Route path="/tools" element={<GenericPage title="Schedule" />} />
          <Route path="/chat" element={<ChatPage />} />
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
