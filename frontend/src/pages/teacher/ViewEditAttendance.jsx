import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

export default function ViewEditAttendance() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [records, setRecords] = useState([]);
  const [status, setStatus] = useState("");
  const token = localStorage.getItem("token");
  const toastActive = useRef(false); // ✅ prevents duplicate toasts

  // Fetch teacher's scheduled classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/classes/teacher", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClasses(res.data || []);
        if (!toastActive.current) {
          toastActive.current = true;
          toast.success("Classes loaded successfully");
          setTimeout(() => (toastActive.current = false), 100);
        }
      } catch (err) {
        console.error("Error fetching classes:", err);
        if (!toastActive.current) {
          toastActive.current = true;
          toast.error("Failed to load classes");
          setTimeout(() => (toastActive.current = false), 100);
        }
      }
    };
    fetchClasses();
  }, [token]);

  // Fetch attendance records of selected class
  const handleSelectClass = async (clsId) => {
    setSelectedClass(clsId);
    setRecords([]);
    setStatus("Loading students...");
    try {
      const res = await axios.get(
        `http://localhost:8000/api/attendance/class/${clsId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRecords(res.data || []);
      setStatus("");

      if (!res.data || res.data.length === 0) {
        if (!toastActive.current) {
          toastActive.current = true;
          toast("No students found for this class", { icon: "ℹ️" });
          setTimeout(() => (toastActive.current = false), 100);
        }
      } else if (!toastActive.current) {
        toastActive.current = true;
        toast.success("Student records loaded");
        setTimeout(() => (toastActive.current = false), 100);
      }
    } catch (err) {
      console.error(err);
      setStatus("Failed to load students.");
      if (!toastActive.current) {
        toastActive.current = true;
        toast.error("Error loading student records");
        setTimeout(() => (toastActive.current = false), 100);
      }
    }
  };

  // Handle attendance toggle
  const handleToggleAttendance = async (studentId, present) => {
    try {
      await axios.post(
        `http://localhost:8000/api/attendance/update`,
        {
          classId: selectedClass,
          studentId,
          present,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update UI immediately
      setRecords((prev) =>
        prev.map((r) =>
          r.student._id === studentId
            ? { ...r, status: present ? "Present" : "Absent" }
            : r
        )
      );

      if (!toastActive.current) {
        toastActive.current = true;
        toast.success(`Marked ${present ? "Present" : "Absent"} for student successfully`);
        setTimeout(() => (toastActive.current = false), 100);
      }
    } catch (err) {
      console.error(err);
      if (!toastActive.current) {
        toastActive.current = true;
        toast.error("Failed to update attendance");
        setTimeout(() => (toastActive.current = false), 100);
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-2xl shadow-lg border border-indigo-100">
      <h2 className="text-2xl font-bold text-[#4f46e5] mb-6 text-center">
        View / Edit Attendance
      </h2>

      {/* Select Class */}
      <select
        value={selectedClass || ""}
        onChange={(e) => handleSelectClass(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-xl mb-6 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
      >
        <option value="">-- Select a class --</option>
        {classes.map((cls) => (
          <option key={cls._id} value={cls._id}>
            {cls.subject?.name || "Unknown Subject"} – {new Date(cls.date).toLocaleString()}
          </option>
        ))}
      </select>

      {/* Status */}
      {status && <p className="text-center text-gray-600 mb-4">{status}</p>}

      {/* Students Table */}
      {records.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-200 rounded-xl">
            <thead className="bg-indigo-50">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-center">Present</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.student._id} className="border-t border-gray-200">
                  <td className="p-3">{record.student.name}</td>
                  <td className="p-3">{record.student.email}</td>
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={record.status === "Present"}
                      onChange={(e) =>
                        handleToggleAttendance(record.student._id, e.target.checked)
                      }
                      className="w-5 h-5"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!status && records.length === 0 && selectedClass && (
        <p className="text-center text-gray-500 mt-4">
          No students found for this class.
        </p>
      )}
    </div>
  );
}
