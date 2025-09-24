import { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import AnalyticsTab from "./AnalyticsTab";
import StudentsTab from "./StudentsTab";

export default function ViewAnalytics() {
  const [tab, setTab] = useState("analytics");
  const [analyticsData, setAnalyticsData] = useState([]);
  const [studentsData, setStudentsData] = useState([]);
  const [options, setOptions] = useState({ courses: [], semesters: [], subjects: [] });
  const [filters, setFilters] = useState({
    course: "",
    semester: "",
    subject: "",
    month: new Date(),
    overall: false,
  });

  const token = localStorage.getItem("token");
  const toastActive = useRef(false);

  // Fetch teacher analytics
  useEffect(() => {
    if (tab !== "analytics") return;

    const fetchAnalytics = async () => {
      try {
        const res = await axios.get(
          "http://localhost:8000/api/attendance/teacher/analytics",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const fetchedData = res.data || [];

        // ----- GROUP BY SUBJECT -----
        const grouped = {};
        fetchedData.forEach(cls => {
          const subject = cls.subject || "Unknown";
          if (!grouped[subject]) grouped[subject] = { totalPresent: 0, totalClasses: 0 };
          grouped[subject].totalPresent += cls.percentage || 0;
          grouped[subject].totalClasses += 1;
        });

        const processedData = Object.entries(grouped).map(([subject, stats]) => ({
          subject,
          percentage: Math.round(stats.totalPresent / stats.totalClasses),
        }));

        setAnalyticsData(processedData);

      } catch (err) {
        console.error(err);
        if (!toastActive.current) {
          toastActive.current = true;
          toast.error("Failed to fetch analytics.");
          setTimeout(() => (toastActive.current = false), 100);
        }
      }
    };

    fetchAnalytics();
  }, [tab, token]);

  // Fetch teacher options for Students tab
  useEffect(() => {
    if (tab !== "students") return;
    const fetchOptions = async () => {
      try {
        const res = await axios.get(
          "http://localhost:8000/api/attendance/teacher/options",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setOptions(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchOptions();
  }, [tab, token]);

  return (
    <div className="max-w-7xl mx-auto mt-6 bg-white p-6 rounded-2xl shadow-lg border border-indigo-100">
      <h2 className="text-2xl font-bold mb-4 text-center text-[#4f46e5]">Attendance Panel</h2>

      {/* Tabs */}
      <div className="flex justify-center space-x-4 mb-4">
        <button
          className={`px-4 py-2 rounded ${tab === "analytics" ? "bg-indigo-500 text-white" : "bg-indigo-100 text-indigo-700"}`}
          onClick={() => setTab("analytics")}
        >
          Analytics
        </button>
        <button
          className={`px-4 py-2 rounded ${tab === "students" ? "bg-indigo-500 text-white" : "bg-indigo-100 text-indigo-700"}`}
          onClick={() => setTab("students")}
        >
          Students
        </button>
      </div>

      {/* Tab Content */}
      {tab === "analytics" && <AnalyticsTab analyticsData={analyticsData} />}
      {tab === "students" && (
        <StudentsTab
          filters={filters}
          setFilters={setFilters}
          options={options}
          studentsData={studentsData}
          setStudentsData={setStudentsData}
          token={token}
        />
      )}
    </div>
  );
}
