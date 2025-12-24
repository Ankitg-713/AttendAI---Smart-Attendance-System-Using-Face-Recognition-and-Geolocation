import { useEffect, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import api from "../../services/axios";
import { ATTENDANCE_STATUS } from "../../config/constants";
import { exportClassAttendancePDF } from "../../utils/pdfExport";

export default function ViewEditAttendance() {
  const [classes, setClasses] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState({});
  const [isExporting, setIsExporting] = useState({});

  // Handle PDF Export for a single class
  const handleExportPDF = (classInfo, classRecords) => {
    const key = classInfo._id;
    setIsExporting((prev) => ({ ...prev, [key]: true }));
    
    try {
      const fileName = exportClassAttendancePDF(classRecords, {
        subject: selectedSubject,
        date: new Date(classInfo.date).toLocaleDateString("en-GB"),
        course: classInfo.course,
        time: `${classInfo.startTime} - ${classInfo.endTime}`,
      });
      toast.success(`Exported: ${fileName}`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export PDF");
    } finally {
      setIsExporting((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Fetch all teacher classes
  const fetchClasses = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/classes/teacher");
      setClasses(res.data || []);
    } catch (err) {
      toast.error("Failed to load classes");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // Update available dates when subject changes
  useEffect(() => {
    if (!selectedSubject) {
      setAvailableDates([]);
      setSelectedDate(null);
      setRecords([]);
      return;
    }

    const filtered = classes.filter(
      (cls) => cls.subject?.name === selectedSubject && cls.status !== "cancelled"
    );
    const dates = Array.from(
      new Set(filtered.map((cls) => new Date(cls.date).setHours(0, 0, 0, 0)))
    );
    setAvailableDates(dates);
    setSelectedDate(null);
    setRecords([]);
  }, [selectedSubject, classes]);

  // Fetch attendance when date changes
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!selectedSubject || !selectedDate) return;

      setIsLoading(true);
      try {
        const filteredClasses = classes.filter(
          (c) =>
            c.subject?.name === selectedSubject &&
            c.status !== "cancelled" &&
            new Date(c.date).setHours(0, 0, 0, 0) ===
              selectedDate.setHours(0, 0, 0, 0)
        );

        if (filteredClasses.length === 0) {
          setRecords([]);
          return;
        }

        const attendanceData = [];

        for (const cls of filteredClasses) {
          const res = await api.get(`/attendance/class/${cls._id}`);
          attendanceData.push({
            classInfo: cls,
            records: res.data || [],
          });
        }

        setRecords(attendanceData);

        if (attendanceData.length === 0 || attendanceData.every((c) => c.records.length === 0)) {
          toast("No students found for these classes", { icon: "ℹ️" });
        }
      } catch (err) {
        toast.error("Error loading student records");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendance();
  }, [selectedSubject, selectedDate, classes]);

  // Handle attendance toggle
  const handleToggleAttendance = async (studentId, present, classId) => {
    const key = `${studentId}-${classId}`;
    setIsUpdating((prev) => ({ ...prev, [key]: true }));

    const payload = {
      classId: String(classId),
      studentId: String(studentId),
      present: Boolean(present),
      reason: "Manual update by teacher",
    };

    try {
      await api.post("/attendance/update", payload);

      setRecords((prev) =>
        prev.map((item) => ({
          ...item,
          records: item.records.map((r) =>
            r.student._id === studentId && item.classInfo._id === classId
              ? { ...r, status: present ? ATTENDANCE_STATUS.PRESENT : ATTENDANCE_STATUS.ABSENT }
              : r
          ),
        }))
      );

      toast.success(`Marked ${present ? "Present" : "Absent"}`);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.errors?.[0]?.message || "Failed to update attendance";
      toast.error(errorMsg);
    } finally {
      setIsUpdating((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Get unique subjects
  const uniqueSubjects = Array.from(
    new Set(classes.filter(c => c.status !== "cancelled").map((cls) => cls.subject?.name))
  ).filter(Boolean);

  const selectClass = "w-full p-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all disabled:opacity-50";

  return (
    <motion.div 
      className="max-w-5xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-600 mb-4 shadow-lg shadow-emerald-500/30">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white">View / Edit Attendance</h2>
        <p className="text-gray-500 text-sm mt-1">Manage student attendance records</p>
      </div>

      {/* Filters Card */}
      <div className="bg-gray-900/50 backdrop-blur-xl p-6 rounded-2xl border border-gray-700/50 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Subject */}
          <div className="flex-1">
            <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
              Subject
            </label>
            <select
              id="subject"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={isLoading}
              className={selectClass}
            >
              <option value="">-- Select Subject --</option>
              {uniqueSubjects.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          {/* DatePicker */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              dateFormat="dd/MM/yyyy"
              placeholderText="Select Date"
              disabled={!selectedSubject || isLoading}
              className={selectClass}
              filterDate={(date) => availableDates.includes(date.setHours(0, 0, 0, 0))}
            />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading attendance records...</p>
        </div>
      )}

      {/* Attendance Tables */}
      {!isLoading && records.length > 0 &&
        records.map(({ classInfo, records: classRecords }, idx) => (
          <motion.div 
            key={classInfo._id} 
            className="mb-6 bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-700/50 bg-gray-800/30">
              <h3 className="text-cyan-400 font-semibold flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(classInfo.date).toLocaleDateString("en-GB")} - {classInfo.startTime} to {classInfo.endTime}
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500 bg-gray-800 px-3 py-1 rounded-full">
                  {classRecords.length} students
                </span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleExportPDF(classInfo, classRecords)}
                  disabled={isExporting[classInfo._id]}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-lg font-medium shadow-md hover:shadow-cyan-500/30 transition-all disabled:opacity-50"
                >
                  {isExporting[classInfo._id] ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                  PDF
                </motion.button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="p-4 text-left text-sm font-medium text-gray-400">Name</th>
                    <th className="p-4 text-left text-sm font-medium text-gray-400">Email</th>
                    <th className="p-4 text-center text-sm font-medium text-gray-400">Status</th>
                    <th className="p-4 text-center text-sm font-medium text-gray-400">Present</th>
                  </tr>
                </thead>
                <tbody>
                  {classRecords.map((record) => {
                    const isPresent = record.status === ATTENDANCE_STATUS.PRESENT || record.status === ATTENDANCE_STATUS.LATE;
                    const updateKey = `${record.student._id}-${classInfo._id}`;
                    const isCurrentlyUpdating = isUpdating[updateKey];

                    return (
                      <tr
                        key={record.student._id}
                        className="border-t border-gray-800 hover:bg-gray-800/30 transition-colors"
                      >
                        <td className="p-4 text-white font-medium">{record.student.name}</td>
                        <td className="p-4 text-gray-400">{record.student.email}</td>
                        <td className="p-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            record.status === ATTENDANCE_STATUS.PRESENT
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : record.status === ATTENDANCE_STATUS.LATE
                              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                              : "bg-red-500/20 text-red-400 border border-red-500/30"
                          }`}>
                            {record.status === ATTENDANCE_STATUS.LATE ? "Late" : record.status}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isPresent}
                              disabled={isCurrentlyUpdating}
                              onChange={(e) =>
                                handleToggleAttendance(
                                  record.student._id,
                                  e.target.checked,
                                  classInfo._id
                                )
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"></div>
                          </label>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        ))}

      {/* Empty States */}
      {!isLoading && records.length === 0 && selectedDate && (
        <div className="text-center py-12 bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-700/50">
          <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <p className="text-gray-400">No students found for this class.</p>
        </div>
      )}

      {!selectedSubject && (
        <div className="text-center py-12 bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-700/50">
          <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-gray-400">Select a subject to view attendance records.</p>
        </div>
      )}
    </motion.div>
  );
}
