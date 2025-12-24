import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import api from "../../services/axios";
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
  const [isLoading, setIsLoading] = useState(false);

  // Fetch teacher analytics
  const fetchAnalytics = useCallback(async () => {
    if (tab !== "analytics") return;
    
    setIsLoading(true);
    try {
      const res = await api.get("/attendance/teacher/analytics");
      setAnalyticsData(res.data || []);
    } catch (err) {
      toast.error("Failed to fetch analytics.");
    } finally {
      setIsLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Fetch teacher options for Students tab
  useEffect(() => {
    if (tab !== "students") return;
    
    const fetchOptions = async () => {
      try {
        const res = await api.get("/attendance/teacher/options");
        setOptions(res.data);
      } catch (err) {
        toast.error("Failed to fetch options");
      }
    };
    fetchOptions();
  }, [tab]);

  return (
    <motion.div 
      className="max-w-7xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 mb-4 shadow-lg shadow-purple-500/30">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white">Attendance Analytics</h2>
        <p className="text-gray-500 text-sm mt-1">View detailed attendance insights</p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-4 mb-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
            tab === "analytics" 
              ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/30" 
              : "bg-gray-800/50 text-gray-400 border border-gray-700 hover:bg-gray-700/50"
          }`}
          onClick={() => setTab("analytics")}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Analytics
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
            tab === "students" 
              ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/30" 
              : "bg-gray-800/50 text-gray-400 border border-gray-700 hover:bg-gray-700/50"
          }`}
          onClick={() => setTab("students")}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Students
        </motion.button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading data...</p>
        </div>
      )}

      {/* Tab Content */}
      {!isLoading && tab === "analytics" && (
        <AnalyticsTab analyticsData={analyticsData} />
      )}
      
      {tab === "students" && (
        <StudentsTab
          filters={filters}
          setFilters={setFilters}
          options={options}
          studentsData={studentsData}
          setStudentsData={setStudentsData}
        />
      )}
    </motion.div>
  );
}
