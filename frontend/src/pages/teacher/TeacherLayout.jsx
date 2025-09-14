import { useState, useRef } from "react";
import ScheduleClass from "./ScheduleClass";
import ViewEditAttendance from "./ViewEditAttendance";
import ViewAnalytics from "./ViewAnalytics";
import toast from "react-hot-toast";

export default function TeacherLayout() {
  const [selectedOption, setSelectedOption] = useState("schedule");
  const [menuOpen, setMenuOpen] = useState(false);
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
        className={`fixed md:static top-0 left-0 h-full w-64 bg-[#4f46e5] text-white p-6 shadow-lg transform transition-transform duration-300 z-40 
        ${menuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <h2 className="text-2xl font-bold mb-8">AttendAI</h2>
        <ul className="space-y-4">
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
