import { useEffect, useState, useCallback } from "react";
import DatePicker from "react-datepicker";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import "react-datepicker/dist/react-datepicker.css";
import api from "../../services/axios";
import { MIN_ATTENDANCE_PERCENTAGE, ATTENDANCE_STATUS } from "../../config/constants";
import { exportTeacherAttendancePDF } from "../../utils/pdfExport";

export default function StudentsTab({
  filters,
  setFilters,
  options,
  studentsData,
  setStudentsData,
}) {
  const [availableMonths, setAvailableMonths] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Handle PDF Export
  const handleExportPDF = () => {
    if (!studentsData || studentsData.length === 0) {
      toast.error("No data to export");
      return;
    }
    
    setIsExporting(true);
    try {
      const monthStr = filters.month 
        ? `${filters.month.toLocaleString('default', { month: 'short' })} ${filters.month.getFullYear()}`
        : null;
      
      const fileName = exportTeacherAttendancePDF(studentsData, {
        subject: filters.subject,
        course: filters.course,
        semester: filters.semester,
        month: monthStr,
        isOverall: filters.overall,
      });
      toast.success(`Report exported: ${fileName}`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  // Fetch available months for selected course/semester/subject
  useEffect(() => {
    const fetchMonths = async () => {
      if (!filters.course || !filters.semester || !filters.subject) return;

      try {
        const res = await api.get("/attendance/teacher/months", {
          params: {
            course: filters.course,
            semester: filters.semester,
            subject: filters.subject,
          },
        });
        setAvailableMonths(res.data.map((m) => new Date(`${m}-01`)));
      } catch (err) {
        toast.error("Failed to fetch available months.");
      }
    };

    fetchMonths();
  }, [filters.course, filters.semester, filters.subject]);

  // Disable months that are not in availableMonths
  const isMonthDisabled = useCallback((date) => {
    return !availableMonths.some(
      (m) =>
        m.getFullYear() === date.getFullYear() &&
        m.getMonth() === date.getMonth()
    );
  }, [availableMonths]);

  // Fetch students' attendance
  const fetchStudents = useCallback(async () => {
    if (!filters.course || !filters.semester || !filters.subject) {
      setStudentsData([]);
      return;
    }

    setIsLoading(true);
    try {
      const params = {
        course: filters.course,
        semester: filters.semester,
        subject: filters.subject,
        overall: filters.overall,
      };
      if (!filters.overall && filters.month) {
        params.month = filters.month.getMonth() + 1;
        params.year = filters.month.getFullYear();
      }

      const res = await api.get("/attendance/teacher/students", { params });
      setStudentsData(res.data || []);
    } catch (err) {
      toast.error("Failed to fetch students' attendance.");
    } finally {
      setIsLoading(false);
    }
  }, [filters, setStudentsData]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const selectClass = "bg-gray-800/50 border border-gray-700 px-3 py-2 rounded-lg text-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 focus:outline-none transition-all";

  // Render attendance table
  const renderTable = () => {
    if (isLoading) {
      return (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading attendance data...</p>
        </div>
      );
    }

    if (!studentsData || studentsData.length === 0) {
      return (
        <div className="text-center py-12 bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-700/50">
          <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <p className="text-gray-400">
            {filters.course && filters.semester && filters.subject
              ? "No attendance data found for the selected filters."
              : "Select course, semester, and subject to view attendance."}
          </p>
        </div>
      );
    }

    const allDates = Array.from(
      new Set(studentsData.flatMap((s) => Object.keys(s.attendance)))
    ).sort();

    return (
      <motion.div 
        className="overflow-x-auto mt-4 bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-700/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <table className="table-auto border-collapse w-full text-sm">
          <thead>
            <tr className="bg-gray-800/50">
              <th className="p-3 text-left font-medium text-gray-400 sticky left-0 bg-gray-800/90 backdrop-blur-sm">
                Name
              </th>
              <th className="p-3 text-left font-medium text-gray-400">Email</th>
              {allDates.map((key, idx) => {
                const [date, time] = key.split(" ");
                return (
                  <th key={idx} className="p-2 text-xs font-medium text-gray-400">
                    <div>{new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</div>
                    <div className="text-gray-600">{time}</div>
                  </th>
                );
              })}
              <th className="p-3 font-medium text-gray-400">Total</th>
              <th className="p-3 font-medium text-gray-400">Present</th>
              <th className="p-3 font-medium text-gray-400">%</th>
              <th className="p-3 font-medium text-gray-400">Status</th>
            </tr>
          </thead>
          <tbody>
            {studentsData.map((s, idx) => {
              const percentage = parseFloat(s.percentage) || 0;
              const isShortage = percentage < MIN_ATTENDANCE_PERCENTAGE;

              return (
                <motion.tr 
                  key={idx} 
                  className={`text-center border-t border-gray-800 ${isShortage ? "bg-red-500/5" : "hover:bg-gray-800/30"}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.03 }}
                >
                  <td className="p-3 text-left font-medium text-white sticky left-0 bg-gray-900/90 backdrop-blur-sm">
                    {s.student.name}
                  </td>
                  <td className="p-3 text-left text-gray-400">{s.student.email}</td>
                  {allDates.map((key, i) => {
                    const status = s.attendance[key];
                    return (
                      <td key={i} className="p-2">
                        {status === ATTENDANCE_STATUS.PRESENT ? (
                          <span className="text-emerald-400" title="Present">✓</span>
                        ) : status === ATTENDANCE_STATUS.LATE ? (
                          <span className="text-yellow-400" title="Late">⏰</span>
                        ) : status === "not_enrolled" ? (
                          <span className="text-gray-600" title="Not enrolled yet">—</span>
                        ) : (
                          <span className="text-red-400" title="Absent">✗</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="p-3 font-medium text-white">
                    {s.eligibleClasses || s.totalClasses}
                  </td>
                  <td className="p-3 font-medium text-emerald-400">
                    {(s.presentCount || 0) + (s.lateCount || 0)}
                  </td>
                  <td className={`p-3 font-bold ${isShortage ? "text-red-400" : "text-emerald-400"}`}>
                    {s.percentage}%
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isShortage 
                        ? "bg-red-500/20 text-red-400 border border-red-500/30" 
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    }`}>
                      {s.status || (isShortage ? "Shortage" : "Eligible")}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>
    );
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-900/50 backdrop-blur-xl rounded-xl border border-gray-700/50">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Course</label>
          <select
            className={selectClass}
            value={filters.course}
            onChange={(e) => setFilters({ ...filters, course: e.target.value, subject: "" })}
          >
            <option value="">Select Course</option>
            {options.courses.map((c, idx) => (
              <option key={idx} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Semester</label>
          <select
            className={selectClass}
            value={filters.semester}
            onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
          >
            <option value="">Select Semester</option>
            {options.semesters.map((s, idx) => (
              <option key={idx} value={s}>Sem {s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Subject</label>
          <select
            className={selectClass}
            value={filters.subject}
            onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
          >
            <option value="">Select Subject</option>
            {options.subjects.map((s, idx) => (
              <option key={idx} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {!filters.overall && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Month</label>
            <DatePicker
              selected={filters.month}
              onChange={(date) => setFilters({ ...filters, month: date })}
              dateFormat="MMM yyyy"
              showMonthYearPicker
              filterDate={(date) => !isMonthDisabled(date)}
              className={selectClass}
              disabled={!filters.course || !filters.semester || !filters.subject}
            />
          </div>
        )}

        <div className="flex items-end">
          <label className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors">
            <input
              type="checkbox"
              checked={filters.overall}
              onChange={(e) => setFilters({ ...filters, overall: e.target.checked })}
              className="w-4 h-4 accent-cyan-500"
            />
            <span className="text-sm font-medium text-gray-300">Show Overall</span>
          </label>
        </div>

        {/* Export PDF Button */}
        {studentsData && studentsData.length > 0 && (
          <div className="flex items-end ml-auto">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-lg font-medium shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Export PDF</span>
                </>
              )}
            </motion.button>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-6 mb-4 text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400">✓</span> Present
        </div>
        <div className="flex items-center gap-2">
          <span className="text-yellow-400">⏰</span> Late
        </div>
        <div className="flex items-center gap-2">
          <span className="text-red-400">✗</span> Absent
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">—</span> Not enrolled
        </div>
      </div>

      {/* Attendance Table */}
      {renderTable()}
    </div>
  );
}
