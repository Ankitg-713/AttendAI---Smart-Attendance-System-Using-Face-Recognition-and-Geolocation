import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function ViewEditAttendance() {
  const [classes, setClasses] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [availableDates, setAvailableDates] = useState([]); // Dates for selected subject
  const [selectedDate, setSelectedDate] = useState(null);
  const [records, setRecords] = useState([]);
  const [status, setStatus] = useState("");
  const token = localStorage.getItem("token");
  const toastActive = useRef(false);

  // Fetch all teacher classes
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
        console.error(err);
        if (!toastActive.current) {
          toastActive.current = true;
          toast.error("Failed to load classes");
          setTimeout(() => (toastActive.current = false), 100);
        }
      }
    };
    fetchClasses();
  }, [token]);

  // Update available dates when subject changes
  useEffect(() => {
    if (!selectedSubject) {
      setAvailableDates([]);
      setSelectedDate(null);
      setRecords([]);
      return;
    }

    const filtered = classes.filter(cls => cls.subject?.name === selectedSubject);
    const dates = filtered.map(cls => new Date(cls.date).setHours(0, 0, 0, 0));
    setAvailableDates(dates);
    setSelectedDate(null);
    setRecords([]);
  }, [selectedSubject, classes]);

  // Fetch attendance when date changes
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!selectedSubject || !selectedDate) return;

      try {
        const cls = classes.find(
          c =>
            c.subject?.name === selectedSubject &&
            new Date(c.date).setHours(0, 0, 0, 0) === selectedDate.setHours(0, 0, 0, 0)
        );

        if (!cls) {
          setRecords([]);
          return;
        }

        const res = await axios.get(
          `http://localhost:8000/api/attendance/class/${cls._id}`,
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

    fetchAttendance();
  }, [selectedSubject, selectedDate, classes, token]);

  // Handle attendance toggle
  const handleToggleAttendance = async (studentId, present) => {
    try {
      const cls = classes.find(
        c =>
          c.subject?.name === selectedSubject &&
          new Date(c.date).setHours(0, 0, 0, 0) === selectedDate.setHours(0, 0, 0, 0)
      );
      if (!cls) return;

      await axios.post(
        "http://localhost:8000/api/attendance/update",
        { classId: cls._id, studentId, present },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRecords(prev =>
        prev.map(r =>
          r.student._id === studentId ? { ...r, status: present ? "Present" : "Absent" } : r
        )
      );

      if (!toastActive.current) {
        toastActive.current = true;
        toast.success(`Marked ${present ? "Present" : "Absent"} successfully`);
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

      {/* Filters: Subject + DatePicker */}
      <div className="flex gap-4 mb-6">
        {/* Subject */}
        <select
          value={selectedSubject}
          onChange={e => setSelectedSubject(e.target.value)}
          className="flex-1 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
        >
          <option value="">-- Select Subject --</option>
          {Array.from(new Set(classes.map(cls => cls.subject?.name))).map(sub => (
            <option key={sub} value={sub}>{sub}</option>
          ))}
        </select>

        {/* DatePicker */}
        <DatePicker
          selected={selectedDate}
          onChange={date => setSelectedDate(date)}
          dateFormat="dd/MM/yyyy"
          placeholderText="Select Date"
          className="flex-1 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
          filterDate={date =>
            availableDates.includes(date.setHours(0, 0, 0, 0))
          }
        />
      </div>

      {/* Status */}
      {status && <p className="text-center text-gray-600 mb-4">{status}</p>}

      {/* Attendance Table */}
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
              {records.map(record => (
                <tr key={record.student._id} className="border-t border-gray-200">
                  <td className="p-3">{record.student.name}</td>
                  <td className="p-3">{record.student.email}</td>
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={record.status === "Present"}
                      onChange={e =>
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

      {!status && records.length === 0 && selectedDate && (
        <p className="text-center text-gray-500 mt-4">
          No students found for this class.
        </p>
      )}
    </div>
  );
}
