import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export default function StudentLayout() {
  const [student, setStudent] = useState({ name: "Student", course: "", semester: "" });
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const toastActive = useRef(false); // ✅ prevents duplicate toasts

  useEffect(() => {
    const fetchStudent = async () => {
      if (toastActive.current) return; // prevent duplicate toast from multiple fetches
      toastActive.current = true;

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("You are not logged in. Please login first.");
          return;
        }

        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setStudent(res.data); // { id, name, role, course, semester }
      } catch (err) {
        toast.error("Failed to fetch student details. Please try again.");
      } finally {
        // reset flag after small delay so future fetches can trigger toast if needed
        setTimeout(() => {
          toastActive.current = false;
        }, 100);
      }
    };

    fetchStudent();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    toast.success("Logged out successfully!", { duration: 2000 });
    
    // Dismiss all toasts and navigate after delay
    setTimeout(() => {
      toast.dismiss();
      navigate("/login");
    }, 1500);
  };

  return (
    <div className="flex h-screen bg-[#e0e7ff]">
      {/* Sidebar */}
      <aside
        className={`fixed md:static top-0 left-0 h-full w-64 bg-indigo-600 text-white flex flex-col p-6 space-y-4 z-40 transform transition-transform duration-300
          ${menuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <h1 className="text-2xl font-bold">AttendAI</h1>
        <p className="text-sm text-indigo-200">Welcome, {student.name}</p>

        <NavLink
          to="/student/dashboard/attendance"
          onClick={() => setMenuOpen(false)}
          className={({ isActive }) =>
            `px-4 py-2 rounded hover:bg-indigo-500 block transition ${
              isActive || location.pathname === "/student/dashboard"
                ? "bg-indigo-700"
                : ""
            }`
          }
        >
          📈 View Attendance
        </NavLink>

        <NavLink
          to="/student/dashboard/mark-attendance"
          onClick={() => setMenuOpen(false)}
          className={({ isActive }) =>
            `px-4 py-2 rounded hover:bg-indigo-500 block transition ${
              isActive ? "bg-indigo-700" : ""
            }`
          }
        >
          🧑‍💻 Mark Attendance
        </NavLink>

        <button
          onClick={handleLogout}
          className="mt-auto px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/30 hover:border-white/50 transition-all duration-300 text-white font-medium flex items-center justify-center gap-2 group"
        >
          <svg 
            className="w-5 h-5 group-hover:scale-110 transition-transform" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
            />
          </svg>
          <span>Logout</span>
        </button>
      </aside>

      {/* Mobile overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/40 md:hidden z-30"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Page content */}
      <div className="flex-1 flex flex-col">
        <header className="md:hidden bg-indigo-600 text-white flex items-center justify-between px-4 py-3 shadow">
          <h1 className="text-lg font-bold">AttendAI</h1>
          <button onClick={() => setMenuOpen((prev) => !prev)} className="focus:outline-none">
            {menuOpen ? "✖" : "☰"}
          </button>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <Outlet context={{ student }} />
        </main>
      </div>
    </div>
  );
}
