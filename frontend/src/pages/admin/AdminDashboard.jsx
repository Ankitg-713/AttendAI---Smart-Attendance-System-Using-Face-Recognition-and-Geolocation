import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import api from "../../services/axios";

// Grid background component
const GridBackground = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
    <div 
      className="absolute inset-0 opacity-20"
      style={{
        backgroundImage: `
          linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
      }}
    />
  </div>
);

export default function AdminDashboard() {
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState({});
  const navigate = useNavigate();

  // Fetch subjects and teachers
  const fetchData = useCallback(async () => {
    try {
      const [subjectRes, teacherRes] = await Promise.all([
        api.get("/admin/subjects"),
        api.get("/admin/teachers"),
      ]);

      setSubjects(subjectRes.data);
      setTeachers(teacherRes.data);

      // Initialize selectedTeacher mapping
      const initialMapping = {};
      subjectRes.data.forEach((subj) => {
        initialMapping[subj._id] = subj.teacher?._id || "";
      });
      setSelectedTeacher(initialMapping);
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle teacher selection change
  const handleTeacherChange = (subjectId, teacherId) => {
    setSelectedTeacher((prev) => ({ ...prev, [subjectId]: teacherId }));
  };

  // Assign teacher to subject
  const handleAssign = async (subjectId) => {
    const teacherId = selectedTeacher[subjectId];
    if (!teacherId) {
      toast.error("Please select a teacher first");
      return;
    }

    setIsAssigning((prev) => ({ ...prev, [subjectId]: true }));

    try {
      const res = await api.post("/admin/assign-teacher", {
        subjectId,
        teacherId,
      });

      toast.success("Teacher assigned successfully! ✅");

      // Update local subjects state
      const assignedTeacher = teachers.find((t) => t._id === teacherId);
      setSubjects((prev) =>
        prev.map((subj) =>
          subj._id === subjectId
            ? { ...subj, teacher: assignedTeacher }
            : subj
        )
      );
    } catch (err) {
      const message = err.response?.data?.message || "Failed to assign teacher";
      toast.error(message);
    } finally {
      setIsAssigning((prev) => ({ ...prev, [subjectId]: false }));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    toast.success("Logged out successfully!", { duration: 1500 });
    
    setTimeout(() => {
      toast.dismiss();
      navigate("/login", { replace: true });
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <GridBackground />
        <div className="text-center relative z-10">
          <div className="w-16 h-16 border-4 border-gray-700 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-cyan-400 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8 relative">
      <GridBackground />
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.div 
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="4" />
                <path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                <path d="M16 4l2 2-2 2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
              <p className="text-gray-500 text-sm">Manage subjects and teacher assignments</p>
            </div>
          </div>
          <motion.button
            onClick={handleLogout}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-5 py-2.5 rounded-xl bg-gray-800/50 hover:bg-red-500/20 border border-gray-700 hover:border-red-500/50 text-gray-400 hover:text-red-400 font-medium transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </motion.button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="bg-gray-900/50 backdrop-blur-xl p-6 rounded-xl border border-gray-700/50">
            <p className="text-sm text-gray-500">Total Subjects</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">{subjects.length}</p>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-xl p-6 rounded-xl border border-gray-700/50">
            <p className="text-sm text-gray-500">Total Teachers</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{teachers.length}</p>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-xl p-6 rounded-xl border border-emerald-500/30">
            <p className="text-sm text-gray-500">Assigned</p>
            <p className="text-3xl font-bold text-emerald-400">
              {subjects.filter((s) => s.teacher).length} / {subjects.length}
            </p>
          </div>
        </motion.div>

        {/* Main Table */}
        <motion.div 
          className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="p-6 border-b border-gray-700/50">
            <h3 className="text-lg font-semibold text-white">
              Subject-Teacher Assignments
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Subject</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Course</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Semester</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Current Teacher</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Assign Teacher</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {subjects.map((subject, idx) => (
                  <motion.tr 
                    key={subject._id} 
                    className="hover:bg-gray-800/30 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-white">
                      {subject.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                      {subject.course}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                      Sem {subject.semester}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {subject.teacher ? (
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-sm">
                          {subject.teacher.name}
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-gray-800 text-gray-500 border border-gray-700 rounded-full text-sm">
                          Not assigned
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        className="bg-gray-800/50 border border-gray-700 px-3 py-2 rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 focus:outline-none text-sm text-white"
                        value={selectedTeacher[subject._id] || ""}
                        onChange={(e) => handleTeacherChange(subject._id, e.target.value)}
                        disabled={isAssigning[subject._id]}
                      >
                        <option value="">-- Select --</option>
                        {teachers.map((teacher) => (
                          <option key={teacher._id} value={teacher._id}>
                            {teacher.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <motion.button
                        onClick={() => handleAssign(subject._id)}
                        disabled={!selectedTeacher[subject._id] || isAssigning[subject._id]}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-cyan-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
                      >
                        {isAssigning[subject._id] ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Assigning...</span>
                          </>
                        ) : (
                          "Assign"
                        )}
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {subjects.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              No subjects found. Add subjects to the database to get started.
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
