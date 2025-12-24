import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { lazy, Suspense } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute, { PublicOnlyRoute } from './components/ProtectedRoute';
import { ROLES } from './config/constants';

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-950 flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-gray-700 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-cyan-400 font-medium">Loading...</p>
    </div>
  </div>
);

// Lazy load pages for better performance (code splitting)
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const TeacherLayout = lazy(() => import('./pages/teacher/TeacherLayout'));
const StudentLayout = lazy(() => import('./pages/student/StudentLayout'));
const MarkAttendance = lazy(() => import('./pages/student/MarkAttendance'));
const ViewStudentAttendance = lazy(() => import('./pages/student/ViewAttendance'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

function App() {
  return (
    <ErrorBoundary>
      {/* Global Toast Container */}
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid #374151',
            borderRadius: '12px',
          },
          success: {
            style: {
              background: '#065f46',
              border: '1px solid #10b981',
            },
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            style: {
              background: '#7f1d1d',
              border: '1px solid #ef4444',
            },
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Auth Routes - Only accessible when NOT logged in */}
          <Route 
            path="/login" 
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicOnlyRoute>
                <Register />
              </PublicOnlyRoute>
            } 
          />

          {/* Teacher Dashboard - Protected */}
          <Route 
            path="/teacher/dashboard/*" 
            element={
              <ProtectedRoute allowedRoles={ROLES.TEACHER}>
                <TeacherLayout />
              </ProtectedRoute>
            }
          />

          {/* Student Dashboard - Protected */}
          <Route 
            path="/student/dashboard" 
            element={
              <ProtectedRoute allowedRoles={ROLES.STUDENT}>
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="attendance" replace />} />
            <Route path="attendance" element={<ViewStudentAttendance />} />
            <Route path="mark-attendance" element={<MarkAttendance />} />
          </Route>

          {/* Admin Dashboard - Protected */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute allowedRoles={ROLES.ADMIN}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
