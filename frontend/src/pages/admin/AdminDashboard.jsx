import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

export default function AdminDashboard() {
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState({});
  const hasFetched = useRef(false); // 👈 prevents duplicate API call & toast
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  // Fetch subjects and teachers
  useEffect(() => {
    if (hasFetched.current) return; // prevent duplicate fetch in StrictMode
    hasFetched.current = true;

    const fetchData = async () => {
      try {
        // Fetch all subjects
        const subjectRes = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/admin/subjects`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSubjects(subjectRes.data);

        // Fetch all teachers
        const teacherRes = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/admin/teachers`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTeachers(teacherRes.data);

        // Initialize selectedTeacher mapping
        const initialMapping = {};
        subjectRes.data.forEach((subj) => {
          initialMapping[subj._id] = subj.teacher?._id || "";
        });
        setSelectedTeacher(initialMapping);

        toast.success("✅ Data loaded successfully");
      } catch (err) {
        toast.error("❌ Failed to load subjects or teachers");
      }
    };

    fetchData();
  }, [token]);

  // Handle teacher selection change
  const handleTeacherChange = (subjectId, teacherId) => {
    setSelectedTeacher((prev) => ({ ...prev, [subjectId]: teacherId }));
  };

  // Assign teacher to subject
  const handleAssign = async (subjectId) => {
    const teacherId = selectedTeacher[subjectId];
    if (!teacherId) {
      toast.error("⚠️ Please select a teacher first");
      return;
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/admin/assign-teacher`,
        { subjectId, teacherId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`✅ ${res.data.message}`);

      // Update local subjects state
      setSubjects((prev) =>
        prev.map((subj) =>
          subj._id === subjectId ? { ...subj, teacher: res.data.subject.teacher } : subj
        )
      );
    } catch (err) {
      toast.error(
        `❌ ${err.response?.data?.message || "Failed to assign teacher"}`
      );
    }
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

  return (
    <div className="max-w-6xl mx-auto mt-8 p-6 bg-white rounded-2xl shadow-lg border border-indigo-100">
      <h2 className="text-3xl font-bold text-indigo-700 text-center mb-6">
        🏫 Admin Dashboard
      </h2>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-indigo-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-indigo-700">
                Subject
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-indigo-700">
                Semester
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-indigo-700">
                Assigned Teacher
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-indigo-700">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {subjects.map((subject) => (
              <tr key={subject._id}>
                <td className="px-6 py-4 whitespace-nowrap">{subject.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{subject.semester}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    className="border border-gray-300 px-3 py-1 rounded-lg focus:ring-2 focus:ring-indigo-300"
                    value={selectedTeacher[subject._id] || ""}
                    onChange={(e) =>
                      handleTeacherChange(subject._id, e.target.value)
                    }
                  >
                    <option value="">-- Select Teacher --</option>
                    {teachers.map((teacher) => (
                      <option key={teacher._id} value={teacher._id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleAssign(subject._id)}
                    className="bg-indigo-600 text-white px-4 py-1 rounded-lg hover:bg-indigo-700 transition"
                  >
                    Assign
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleLogout}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-300 text-white font-semibold flex items-center gap-2 group"
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
      </div>
    </div>
  );
}
