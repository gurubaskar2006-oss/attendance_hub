import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { SuperAdminDashboard } from './pages/super-admin/SuperAdminDashboard';
import { SchoolsPage } from './pages/super-admin/SchoolsPage';
import { LicensesPage } from './pages/super-admin/LicensesPage';
import { PlatformSettingsPage } from './pages/super-admin/PlatformSettingsPage';

import { SchoolAdminDashboard } from './pages/school-admin/SchoolAdminDashboard';
import { AcademicSetupPage } from './pages/school-admin/AcademicSetupPage';
import { StudentsPage } from './pages/school-admin/StudentsPage';
import { StaffPage } from './pages/school-admin/StaffPage';
import { ParentsPage } from './pages/school-admin/ParentsPage';
import { AttendanceHubPage } from './pages/attendance/AttendanceHubPage';
import { TeacherAttendancePage } from './pages/teacher/TeacherAttendancePage';
import { PrincipalDashboard } from './pages/principal/PrincipalDashboard';
import { CoordinatorDashboard } from './pages/coordinator/CoordinatorDashboard';
import { ParentPortalPage } from './pages/parent/ParentPortalPage';
import { ExaminationsPage } from './pages/examinations/ExaminationsPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { AnnouncementsPage } from './pages/announcements/AnnouncementsPage';
import { NotificationsPage } from './pages/notifications/NotificationsPage';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs font-semibold text-slate-400">
        Authenticating session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to user's natural home based on role
    if (user.role === 'SUPER_ADMIN') return <Navigate to="/super-admin" replace />;
    if (user.role === 'TEACHER') return <Navigate to="/teacher/attendance" replace />;
    if (user.role === 'PARENT') return <Navigate to="/parent/portal" replace />;
    if (user.role === 'PRINCIPAL') return <Navigate to="/principal" replace />;
    if (user.role === 'COORDINATOR') return <Navigate to="/coordinator" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
};

// Root Index Redirector
const RootRedirector: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs font-semibold text-slate-400">
        Loading platform...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'SUPER_ADMIN') return <Navigate to="/super-admin" replace />;
  if (user.role === 'TEACHER') return <Navigate to="/teacher/attendance" replace />;
  if (user.role === 'PARENT') return <Navigate to="/parent/portal" replace />;
  if (user.role === 'PRINCIPAL') return <Navigate to="/principal" replace />;
  if (user.role === 'COORDINATOR') return <Navigate to="/coordinator" replace />;
  return <Navigate to="/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Root */}
          <Route path="/" element={<RootRedirector />} />

          {/* Super Admin Routes */}
          <Route
            path="/super-admin"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/schools"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <SchoolsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/licenses"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <LicensesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/settings"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <PlatformSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/audit-logs"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <PlatformSettingsPage />
              </ProtectedRoute>
            }
          />

          {/* School Admin / Principal / Coordinator Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'PRINCIPAL', 'COORDINATOR']}>
                <SchoolAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/academic-setup"
            element={
              <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'PRINCIPAL', 'COORDINATOR']}>
                <AcademicSetupPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/students"
            element={
              <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'PRINCIPAL', 'COORDINATOR', 'TEACHER']}>
                <StudentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff"
            element={
              <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'PRINCIPAL']}>
                <StaffPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parents"
            element={
              <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'PRINCIPAL']}>
                <ParentsPage />
              </ProtectedRoute>
            }
          />

          {/* Attendance Routes */}
          <Route
            path="/attendance"
            element={
              <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'PRINCIPAL', 'COORDINATOR', 'TEACHER']}>
                <AttendanceHubPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/attendance"
            element={
              <ProtectedRoute allowedRoles={['TEACHER', 'SCHOOL_ADMIN', 'PRINCIPAL', 'COORDINATOR']}>
                <TeacherAttendancePage />
              </ProtectedRoute>
            }
          />

          {/* Role Dedicated Suites */}
          <Route
            path="/principal"
            element={
              <ProtectedRoute allowedRoles={['PRINCIPAL', 'SCHOOL_ADMIN']}>
                <PrincipalDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coordinator"
            element={
              <ProtectedRoute allowedRoles={['COORDINATOR', 'SCHOOL_ADMIN']}>
                <CoordinatorDashboard />
              </ProtectedRoute>
            }
          />

          {/* Parent Portal Routes */}
          <Route
            path="/parent/portal"
            element={
              <ProtectedRoute allowedRoles={['PARENT', 'SCHOOL_ADMIN']}>
                <ParentPortalPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/attendance"
            element={
              <ProtectedRoute allowedRoles={['PARENT', 'SCHOOL_ADMIN']}>
                <ParentPortalPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/leave"
            element={
              <ProtectedRoute allowedRoles={['PARENT', 'SCHOOL_ADMIN']}>
                <ParentPortalPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/report-cards"
            element={
              <ProtectedRoute allowedRoles={['PARENT', 'SCHOOL_ADMIN']}>
                <ParentPortalPage />
              </ProtectedRoute>
            }
          />

          {/* Assessment & Academic */}
          <Route
            path="/examinations"
            element={
              <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'PRINCIPAL', 'COORDINATOR', 'TEACHER']}>
                <ExaminationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leave"
            element={
              <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'PRINCIPAL', 'COORDINATOR', 'TEACHER', 'PARENT']}>
                <ParentPortalPage />
              </ProtectedRoute>
            }
          />

          {/* Reports & Communication */}
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'PRINCIPAL', 'COORDINATOR']}>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/announcements"
            element={
              <ProtectedRoute>
                <AnnouncementsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          {/* 404 Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};
export default App;

