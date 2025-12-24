import { useEffect, useState, useCallback } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import api from "../../services/axios";
import { MIN_ATTENDANCE_PERCENTAGE } from "../../config/constants";
import { exportStudentAttendancePDF } from "../../utils/pdfExport";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function ViewAttendance() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Handle PDF Export
  const handleExportPDF = () => {
    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }
    
    setIsExporting(true);
    try {
      const fileName = exportStudentAttendancePDF(data, {});
      toast.success(`Report exported: ${fileName}`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const fetchAttendance = useCallback(async () => {
    try {
      const res = await api.get("/attendance/student/analytics");
      if (!res.data || res.data.length === 0) {
        toast("No attendance data found", { icon: "📉" });
      }
      setData(res.data || []);
    } catch (err) {
      toast.error("Failed to load attendance data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Calculate overall stats
  const overallStats = data.reduce(
    (acc, record) => {
      acc.totalClasses += record.total || 0;
      acc.present += record.present || 0;
      acc.late += record.late || 0;
      acc.absent += record.absent || 0;
      return acc;
    },
    { totalClasses: 0, present: 0, late: 0, absent: 0 }
  );
  
  const overallPercentage = overallStats.totalClasses > 0
    ? (((overallStats.present + overallStats.late) / overallStats.totalClasses) * 100).toFixed(1)
    : 0;

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-12 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-700 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400 font-medium">Loading your attendance data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div 
        className="text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-600 mb-4 shadow-lg shadow-emerald-500/30">
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 20V10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 20V4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6 20v-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Attendance Overview</h2>
        <p className="text-gray-400">Track your attendance across all subjects</p>
        
        {/* Export PDF Button */}
        {data.length > 0 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExportPDF}
            disabled={isExporting}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-xl font-medium shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export PDF</span>
              </>
            )}
          </motion.button>
        )}
      </motion.div>

      {/* Overall Stats Cards */}
      {data.length > 0 && (
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-4">
            <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">{overallStats.totalClasses}</div>
            <div className="text-gray-500 text-sm mt-1">Total Classes</div>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-xl border border-emerald-500/30 rounded-xl p-4">
            <div className="text-3xl font-bold text-emerald-400">{overallStats.present}</div>
            <div className="text-gray-500 text-sm mt-1">Present</div>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-xl border border-yellow-500/30 rounded-xl p-4">
            <div className="text-3xl font-bold text-yellow-400">{overallStats.late}</div>
            <div className="text-gray-500 text-sm mt-1">Late</div>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-xl border border-red-500/30 rounded-xl p-4">
            <div className="text-3xl font-bold text-red-400">{overallStats.absent}</div>
            <div className="text-gray-500 text-sm mt-1">Absent</div>
          </div>
        </motion.div>
      )}

      {/* Overall Percentage */}
      {data.length > 0 && (
        <motion.div 
          className={`bg-gray-900/50 backdrop-blur-xl rounded-2xl p-6 mb-8 border ${
            parseFloat(overallPercentage) >= MIN_ATTENDANCE_PERCENTAGE 
              ? 'border-emerald-500/30' 
              : 'border-red-500/30'
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Overall Attendance</p>
              <p className={`text-4xl font-bold ${
                parseFloat(overallPercentage) >= MIN_ATTENDANCE_PERCENTAGE 
                  ? 'text-emerald-400' 
                  : 'text-red-400'
              }`}>
                {overallPercentage}%
              </p>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
              parseFloat(overallPercentage) >= MIN_ATTENDANCE_PERCENTAGE 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {parseFloat(overallPercentage) >= MIN_ATTENDANCE_PERCENTAGE ? '✅ Eligible' : '⚠️ Shortage'}
            </div>
          </div>
        </motion.div>
      )}

      {/* Legend */}
      {data.length > 0 && (
        <motion.div 
          className="flex justify-center gap-8 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {[
            { color: 'bg-cyan-500', label: 'Present' },
            { color: 'bg-yellow-500', label: 'Late' },
            { color: 'bg-gray-600', label: 'Absent' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full ${item.color}`}></div>
              <span className="text-sm text-gray-400">{item.label}</span>
            </div>
          ))}
        </motion.div>
      )}

      {/* Empty State */}
      {data.length === 0 ? (
        <motion.div 
          className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center text-5xl mx-auto mb-6">
            📉
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Attendance Data Yet</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Start marking attendance to see your analytics here. Your subject-wise breakdown will appear once you have attendance records.
          </p>
        </motion.div>
      ) : (
        /* Subject Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((record, idx) => {
            const percentage = parseFloat(record.percentage) || 0;
            const latePercentage = record.late && record.total 
              ? (record.late / record.total) * 100 : 0;
            const presentPercentage = record.present && record.total
              ? (record.present / record.total) * 100 : percentage - latePercentage;
            const absentPercentage = 100 - percentage;
            const isShortage = percentage < MIN_ATTENDANCE_PERCENTAGE;

            const chartData = {
              labels: ["Present", "Late", "Absent"],
              datasets: [{
                data: [
                  Math.max(0, presentPercentage),
                  Math.max(0, latePercentage),
                  Math.max(0, absentPercentage),
                ],
                backgroundColor: ["#06b6d4", "#eab308", "#374151"],
                hoverBackgroundColor: ["#22d3ee", "#facc15", "#4b5563"],
                borderWidth: 0,
              }],
            };

            const chartOptions = {
              cutout: "72%",
              plugins: { legend: { display: false }, tooltip: { enabled: true } },
              animation: { animateRotate: true, animateScale: true },
              maintainAspectRatio: false,
            };

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 overflow-hidden hover:border-cyan-500/30 transition-all"
              >
                {/* Status Header */}
                <div className={`px-6 py-3 ${
                  isShortage 
                    ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border-b border-red-500/30' 
                    : 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border-b border-emerald-500/30'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${isShortage ? 'text-red-400' : 'text-emerald-400'}`}>
                      {isShortage ? '⚠️ Shortage' : '✅ Eligible'}
                    </span>
                    <span className={`text-2xl font-bold ${isShortage ? 'text-red-400' : 'text-emerald-400'}`}>
                      {percentage}%
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  {/* Subject Name */}
                  <h3 className="text-lg font-bold text-white mb-4 text-center">
                    {record.subject}
                  </h3>

                  {/* Chart */}
                  <div className="w-36 h-36 relative mx-auto mb-4">
                    <Doughnut data={chartData} options={chartOptions} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <span className={`text-2xl font-bold ${isShortage ? 'text-red-400' : 'text-white'}`}>
                          {percentage}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg py-2">
                      <div className="font-bold text-cyan-400">{record.present || 0}</div>
                      <div className="text-gray-500 text-xs">Present</div>
                    </div>
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg py-2">
                      <div className="font-bold text-yellow-400">{record.late || 0}</div>
                      <div className="text-gray-500 text-xs">Late</div>
                    </div>
                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg py-2">
                      <div className="font-bold text-gray-400">{record.absent || 0}</div>
                      <div className="text-gray-500 text-xs">Absent</div>
                    </div>
                  </div>

                  {/* Classes Needed */}
                  {isShortage && record.classesNeeded > 0 && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
                      <p className="text-red-400 text-sm font-medium">
                        Need {record.classesNeeded} more classes
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Footer Info */}
      <motion.div 
        className="mt-8 p-4 bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-xl text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <p className="text-gray-500 text-sm">
          Minimum required attendance: <span className="font-bold text-cyan-400">{MIN_ATTENDANCE_PERCENTAGE}%</span>
          <span className="mx-2">•</span>
          Late arrivals count towards attendance
        </p>
      </motion.div>
    </div>
  );
}
