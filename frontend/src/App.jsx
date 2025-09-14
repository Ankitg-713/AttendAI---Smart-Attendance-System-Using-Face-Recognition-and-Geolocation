import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import LandingPage from './pages/LandingPage';

// Teacher Pages
import TeacherLayout from './pages/teacher/TeacherLayout';
import ScheduleClass from './pages/teacher/ScheduleClass';
import ViewAttendance from './pages/teacher/ViewEditAttendance';
import Analytics from './pages/teacher/ViewAnalytics';

// Student Pages
import StudentLayout from './pages/student/StudentLayout';
import MarkAttendance from './pages/student/MarkAttendance';
import ViewStudentAttendance from './pages/student/ViewAttendance';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Teacher Dashboard */}
      <Route path="/teacher/dashboard" element={<TeacherLayout />}>
        <Route index element={<Navigate to="schedule-class" replace />} />
        <Route path="schedule-class" element={<ScheduleClass />} />
        <Route path="attendance" element={<ViewAttendance />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>

      {/* Student Dashboard */}
      <Route path="/student/dashboard" element={<StudentLayout />}>
        <Route index element={<Navigate to="attendance" replace />} />
        <Route path="attendance" element={<ViewStudentAttendance />} />
        <Route path="mark-attendance" element={<MarkAttendance />} />
      </Route>

      {/* Admin Dashboard */}
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
    </Routes>
  );
}

export default App;
