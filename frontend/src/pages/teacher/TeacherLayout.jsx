import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ScheduleClass from "./ScheduleClass";
import ViewEditAttendance from "./ViewEditAttendance";
import ViewAnalytics from "./ViewAnalytics";
import toast from "react-hot-toast";

export default function TeacherLayout() {
  const [selectedOption, setSelectedOption] = useState("schedule");
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const toastActive = useRef(false); // ✅ prevent duplicate toasts

  const handleSelect = (option) => {
    setSelectedOption(option);
    setMenuOpen(false);

    if (toastActive.current) return;
    toastActive.current = true;

    // ✅ Show toast on section change
    switch (option) {
      case "schedule":
        toast.success("📅 Schedule Class opened");
        break;
      case "attendance":
        toast("📝 View/Edit Attendance opened");
        break;
      case "analytics":
        toast.success("📊 View Analytics opened");
        break;
      default:
        toast("Navigated");
    }

    // Reset flag shortly after so future clicks can trigger toast
    setTimeout(() => {
      toastActive.current = false;
    }, 100);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    toast.success("Logged out successfully!", { duration: 2000 });
    
    // Dismiss all toasts and navigate after delay
    setTimeout(() => {
      toast.dismiss();
      navigate("/login");
    }, 1500);
  };

  const renderContent = () => {
    switch (selectedOption) {
      case "schedule":
        return <ScheduleClass />;
      case "attendance":
        return <ViewEditAttendance />;
      case "analytics":
        return <ViewAnalytics />;
      default:
        return <ScheduleClass />;
    }
  };

  return (
    <div className="flex h-screen bg-[#e0e7ff]">
      {/* Sidebar */}
      <aside
        className={`fixed md:static top-0 left-0 h-full w-64 bg-[#4f46e5] text-white p-6 shadow-lg transform transition-transform duration-300 z-40 flex flex-col
        ${menuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <h2 className="text-2xl font-bold mb-8">AttendAI</h2>
        <ul className="space-y-4 flex-grow">
          <li>
            <button
              onClick={() => handleSelect("schedule")}
              className={`w-full text-left py-2 px-4 rounded-lg transition ${
                selectedOption === "schedule"
                  ? "bg-white text-[#4f46e5] font-semibold"
                  : "hover:bg-indigo-600"
              }`}
            >
              Schedule Class
            </button>
          </li>
          <li>
            <button
              onClick={() => handleSelect("attendance")}
              className={`w-full text-left py-2 px-4 rounded-lg transition ${
                selectedOption === "attendance"
                  ? "bg-white text-[#4f46e5] font-semibold"
                  : "hover:bg-indigo-600"
              }`}
            >
              View/Edit Attendance
            </button>
          </li>
          <li>
            <button
              onClick={() => handleSelect("analytics")}
              className={`w-full text-left py-2 px-4 rounded-lg transition ${
                selectedOption === "analytics"
                  ? "bg-white text-[#4f46e5] font-semibold"
                  : "hover:bg-indigo-600"
              }`}
            >
              View Analytics
            </button>
          </li>
        </ul>
        
        <button
          onClick={handleLogout}
          className="mt-auto w-full py-3 px-4 rounded-lg bg-white/10 hover:bg-white/20 border border-white/30 hover:border-white/50 transition-all duration-300 text-white font-medium flex items-center justify-center gap-2 group"
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

      {/* Overlay for mobile */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/40 md:hidden z-30"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="md:hidden bg-[#4f46e5] text-white flex items-center justify-between px-4 py-3 shadow">
          <h1 className="text-lg font-bold">AttendAI</h1>
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="focus:outline-none"
          >
            {menuOpen ? "✖" : "☰"}
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">{renderContent()}</main>
      </div>
    </div>
  );
}
