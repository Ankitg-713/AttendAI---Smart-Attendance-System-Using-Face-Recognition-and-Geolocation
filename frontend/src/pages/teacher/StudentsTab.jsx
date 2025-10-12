import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import axios from "axios";
import toast from "react-hot-toast";
import "react-datepicker/dist/react-datepicker.css";

export default function StudentsTab({
  filters,
  setFilters,
  options,
  studentsData,
  setStudentsData,
  token,
}) {
  const [availableMonths, setAvailableMonths] = useState([]);

  // Fetch available months for selected course/semester/subject
  useEffect(() => {
    const fetchMonths = async () => {
      if (!filters.course || !filters.semester || !filters.subject) return;

      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/attendance/teacher/months`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: {
              course: filters.course,
              semester: filters.semester,
              subject: filters.subject,
            },
          }
        );
        // Convert "YYYY-MM" strings to Date objects
        setAvailableMonths(res.data.map((m) => new Date(`${m}-01`)));
      } catch (err) {
        toast.error("Failed to fetch available months.");
      }
    };

    fetchMonths();
  }, [filters.course, filters.semester, filters.subject, token]);

  // Disable months that are not in availableMonths
  const isMonthDisabled = (date) => {
    return !availableMonths.some(
      (m) =>
        m.getFullYear() === date.getFullYear() &&
        m.getMonth() === date.getMonth()
    );
  };

  // Fetch students' attendance
  const fetchStudents = async () => {
    if (!filters.course || !filters.semester || !filters.subject) return;

    try {
      const params = {
        course: filters.course,
        semester: filters.semester,
        subject: filters.subject,
        overall: filters.overall,
      };
      if (!filters.overall) {
        params.month = filters.month.getMonth() + 1;
        params.year = filters.month.getFullYear();
      }

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/attendance/teacher/students`,
        { headers: { Authorization: `Bearer ${token}` }, params }
      );
      setStudentsData(res.data || []);
    } catch (err) {
      toast.error("Failed to fetch students' attendance.");
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [filters]);

  // Render attendance table
  const renderTable = () => {
    if (!studentsData || studentsData.length === 0)
      return (
        <p className="text-center text-gray-500 mt-4">No attendance data.</p>
      );

    const allDates = Array.from(
      new Set(studentsData.flatMap((s) => Object.keys(s.attendance)))
    ).sort();

    return (
      <div className="overflow-x-auto">
        <table className="table-auto border-collapse w-full border border-gray-300 mt-4">
          <thead>
            <tr className="bg-indigo-100">
              <th className="border px-2 py-1">Name</th>
              <th className="border px-2 py-1">Email</th>
              {allDates.map((key, idx) => {
                const [date, time] = key.split(" ");
                return (
                  <th key={idx} className="border px-2 py-1 text-sm">
                    {new Date(date).toLocaleDateString("en-GB")} <br /> {time}
                  </th>
                );
              })}

              <th className="border px-2 py-1">Total</th>
              <th className="border px-2 py-1">Present</th>
              <th className="border px-2 py-1">%</th>
            </tr>
          </thead>
          <tbody>
            {studentsData.map((s, idx) => (
              <tr key={idx} className="text-center">
                <td className="border px-2 py-1">{s.student.name}</td>
                <td className="border px-2 py-1">{s.student.email}</td>
                {allDates.map((key, i) => (
                  <td key={i} className="border px-1 py-1">
                    {s.attendance[key] === "present" ? (
                      <span className="text-green-500 font-bold">✅</span>
                    ) : (
                      <span className="text-red-500 font-bold">❌</span>
                    )}
                  </td>
                ))}
                <td className="border px-2 py-1">{s.totalClasses}</td>
                <td className="border px-2 py-1">{s.presentCount}</td>
                <td className="border px-2 py-1">{s.percentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <select
          className="border px-2 py-1 rounded"
          value={filters.course}
          onChange={(e) => setFilters({ ...filters, course: e.target.value })}
        >
          <option value="">Select Course</option>
          {options.courses.map((c, idx) => (
            <option key={idx} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          className="border px-2 py-1 rounded"
          value={filters.semester}
          onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
        >
          <option value="">Select Semester</option>
          {options.semesters.map((s, idx) => (
            <option key={idx} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          className="border px-2 py-1 rounded"
          value={filters.subject}
          onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
        >
          <option value="">Select Subject</option>
          {options.subjects.map((s, idx) => (
            <option key={idx} value={s}>
              {s}
            </option>
          ))}
        </select>

        {!filters.overall && (
          <DatePicker
            selected={filters.month}
            onChange={(date) => setFilters({ ...filters, month: date })}
            dateFormat="MM/yyyy"
            showMonthYearPicker
            filterDate={(date) => !isMonthDisabled(date)} // disabled months
            className="border px-2 py-1 rounded"
          />
        )}

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={filters.overall}
            onChange={(e) =>
              setFilters({ ...filters, overall: e.target.checked })
            }
          />
          <span>Overall</span>
        </label>
      </div>

      {/* Attendance Table */}
      {renderTable()}
    </div>
  );
}
