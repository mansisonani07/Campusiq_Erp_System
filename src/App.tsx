import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './lib/theme';
import { SessionProvider, useSession } from './lib/session';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Admissions from './pages/Admissions';
import About from './pages/About';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import Contact from './pages/Contact';
import Layout from './components/Layout';
import RBACGuard from './components/RBACGuard';
import type { Resource } from './lib/rbac';
import Dashboard from './pages/app/Dashboard';
import StudentsPage from './pages/app/Students';
import FacultyPage from './pages/app/Faculty';
import CoursesPage from './pages/app/Courses';
import AttendancePage from './pages/app/Attendance';
import TimetablePage from './pages/app/Timetable';
import FeesPage from './pages/app/Fees';
import ExamsPage from './pages/app/Exams';
import AssignmentsPage from './pages/app/Assignments';
import LMSPage from './pages/app/LMS';
import LibraryPage from './pages/app/Library';
import HostelPage from './pages/app/Hostel';
import TransportPage from './pages/app/Transport';
import PayrollPage from './pages/app/Payroll';
import AdmissionsAdminPage from './pages/app/AdmissionsAdmin';
import NotificationsPage from './pages/app/Notifications';
import AnalyticsPage from './pages/app/Analytics';
import ReportsPage from './pages/app/Reports';
import DocumentsPage from './pages/app/Documents';
import MessagesPage from './pages/app/Messages';
import WorkflowsPage from './pages/app/Workflows';
import AccountApprovalsPage from './pages/app/AccountApprovals';
import SettingsPage from './pages/app/Settings';

function Protected({ resource, children }: { resource: Resource; children: React.ReactNode }) {
  const { user } = useSession();
  if (!user) return <Navigate to="/login" replace />;
  return (
    <Layout>
      <RBACGuard resource={resource}>{children}</RBACGuard>
    </Layout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot" element={<ForgotPassword />} />
            <Route path="/admissions" element={<Admissions />} />
            <Route path="/about" element={<About />} />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/contact" element={<Contact />} />

            <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />
            <Route path="/app/dashboard" element={<Protected resource="dashboard"><Dashboard /></Protected>} />
            <Route path="/app/students" element={<Protected resource="students"><StudentsPage /></Protected>} />
            <Route path="/app/faculty" element={<Protected resource="faculty"><FacultyPage /></Protected>} />
            <Route path="/app/courses" element={<Protected resource="courses"><CoursesPage /></Protected>} />
            <Route path="/app/attendance" element={<Protected resource="attendance"><AttendancePage /></Protected>} />
            <Route path="/app/timetable" element={<Protected resource="timetable"><TimetablePage /></Protected>} />
            <Route path="/app/fees" element={<Protected resource="fees"><FeesPage /></Protected>} />
            <Route path="/app/exams" element={<Protected resource="exams"><ExamsPage /></Protected>} />
            <Route path="/app/assignments" element={<Protected resource="assignments"><AssignmentsPage /></Protected>} />
            <Route path="/app/lms" element={<Protected resource="lms"><LMSPage /></Protected>} />
            <Route path="/app/library" element={<Protected resource="library"><LibraryPage /></Protected>} />
            <Route path="/app/hostel" element={<Protected resource="hostel"><HostelPage /></Protected>} />
            <Route path="/app/transport" element={<Protected resource="transport"><TransportPage /></Protected>} />
            <Route path="/app/payroll" element={<Protected resource="payroll"><PayrollPage /></Protected>} />
            <Route path="/app/admissions" element={<Protected resource="admissions"><AdmissionsAdminPage /></Protected>} />
            <Route path="/app/notifications" element={<Protected resource="notifications"><NotificationsPage /></Protected>} />
            <Route path="/app/analytics" element={<Protected resource="analytics"><AnalyticsPage /></Protected>} />
            <Route path="/app/reports" element={<Protected resource="reports"><ReportsPage /></Protected>} />
            <Route path="/app/documents" element={<Protected resource="documents"><DocumentsPage /></Protected>} />
            <Route path="/app/messages" element={<Protected resource="messages"><MessagesPage /></Protected>} />
            <Route path="/app/workflows" element={<Protected resource="workflows"><WorkflowsPage /></Protected>} />
            <Route path="/app/account-approvals" element={<Protected resource="account_approvals"><AccountApprovalsPage /></Protected>} />
            <Route path="/app/settings" element={<Protected resource="settings"><SettingsPage /></Protected>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SessionProvider>
    </ThemeProvider>
  );
}
