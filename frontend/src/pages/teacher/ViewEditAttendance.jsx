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
  const [records, setRecords] = useState([]); // [{ classInfo, records }]
  const [status, setStatus] = useState("");
  const token = localStorage.getItem("token");
  const toastActive = useRef(false);

  // Fetch all teacher classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/classes/teacher`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setClasses(res.data || []);
        if (!toastActive.current) {
          toastActive.current = true;
          toast.success("Classes loaded successfully");
          setTimeout(() => (toastActive.current = false), 100);
        }
      } catch (err) {
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

    const filtered = classes.filter(
      (cls) => cls.subject?.name === selectedSubject
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

      try {
        // Filter all classes of the subject on the selected date
        const filteredClasses = classes.filter(
          (c) =>
            c.subject?.name === selectedSubject &&
            new Date(c.date).setHours(0, 0, 0, 0) ===
              selectedDate.setHours(0, 0, 0, 0)
        );

        if (filteredClasses.length === 0) {
          setRecords([]);
          return;
        }

        const attendanceData = [];

        for (let cls of filteredClasses) {
          const res = await axios.get(
            `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/attendance/class/${cls._id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          attendanceData.push({
            classInfo: cls,
            records: res.data || [],
          });
        }

        setRecords(attendanceData);
        setStatus("");

        if (
          attendanceData.length === 0 ||
          attendanceData.every((c) => c.records.length === 0)
        ) {
          if (!toastActive.current) {
            toastActive.current = true;
            toast("No students found for these classes", { icon: "ℹ️" });
            setTimeout(() => (toastActive.current = false), 100);
          }
        } else if (!toastActive.current) {
          toastActive.current = true;
          toast.success("Student records loaded");
          setTimeout(() => (toastActive.current = false), 100);
        }
      } catch (err) {
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
  const handleToggleAttendance = async (studentId, present, classId) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/attendance/update`,
        { classId, studentId, present },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRecords((prev) =>
        prev.map((item) => ({
          ...item,
          records: item.records.map((r) =>
            r.student._id === studentId && item.classInfo._id === classId
              ? { ...r, status: present ? "Present" : "Absent" }
              : r
          ),
        }))
      );

      if (!toastActive.current) {
        toastActive.current = true;
        toast.success(`Marked ${present ? "Present" : "Absent"} successfully`);
        setTimeout(() => (toastActive.current = false), 100);
      }
    } catch (err) {
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
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="flex-1 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
        >
          <option value="">-- Select Subject --</option>
          {Array.from(new Set(classes.map((cls) => cls.subject?.name))).map(
            (sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            )
          )}
        </select>

        {/* DatePicker */}
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          dateFormat="dd/MM/yyyy"
          placeholderText="Select Date"
          className="flex-1 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
          filterDate={(date) =>
            availableDates.includes(date.setHours(0, 0, 0, 0))
          }
        />
      </div>

      {/* Status */}
      {status && <p className="text-center text-gray-600 mb-4">{status}</p>}

      {/* Attendance Tables for multiple classes */}
      {records.length > 0 &&
        records.map(({ classInfo, records: classRecords }) => (
          <div key={classInfo._id} className="mb-6">
            <h3 className="text-indigo-600 font-bold mb-2">
              {new Date(classInfo.date).toLocaleDateString("en-GB")} -{" "}
              {classInfo.startTime} to {classInfo.endTime}
            </h3>
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
                  {classRecords.map((record) => (
                    <tr
                      key={record.student._id}
                      className="border-t border-gray-200"
                    >
                      <td className="p-3">{record.student.name}</td>
                      <td className="p-3">{record.student.email}</td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={record.status === "Present"}
                          onChange={(e) =>
                            handleToggleAttendance(
                              record.student._id,
                              e.target.checked,
                              classInfo._id
                            )
                          }
                          className="w-5 h-5"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

      {!status && records.length === 0 && selectedDate && (
        <p className="text-center text-gray-500 mt-4">
          No students found for this class.
        </p>
      )}
    </div>
  );
}
