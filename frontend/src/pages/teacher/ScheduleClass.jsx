import { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

export default function ScheduleClass() {
  const [form, setForm] = useState({
    subject: "",
    date: "",
    startTime: "",
    endTime: "",
    latitude: "",
    longitude: "",
  });

  const [subjects, setSubjects] = useState([]);
  const token = localStorage.getItem("token");
  const toastActive = useRef(false); // ✅ prevent duplicate toasts

  // Fetch subjects assigned to teacher
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/teacher/subjects`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSubjects(res.data || []);
      } catch (err) {
        if (!toastActive.current) {
          toastActive.current = true;
          toast.error("Failed to fetch subjects");
          setTimeout(() => (toastActive.current = false), 100);
        }
      }
    };
    fetchSubjects();
  }, [token]);

  // Fetch teacher geolocation
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        setForm((prev) => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })),
      (err) => {
        if (!toastActive.current) {
          toastActive.current = true;
          toast.error("Failed to get location");
          setTimeout(() => (toastActive.current = false), 100);
        }
      }
    );
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/classes`,
        { ...form },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!toastActive.current) {
        toastActive.current = true;
        toast.success("Class scheduled successfully");
        setTimeout(() => (toastActive.current = false), 100);
      }

      setForm((prev) => ({
        ...prev,
        subject: "",
        date: "",
        startTime: "",
        endTime: "",
      }));
    } catch (err) {
      if (!toastActive.current) {
        toastActive.current = true;
        toast.error(err.response?.data?.message || "Failed to schedule class");
        setTimeout(() => (toastActive.current = false), 100);
      }
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-2xl shadow-lg border border-indigo-100">
      <Toaster position="top-right" reverseOrder={false} />
      <h2 className="text-2xl font-bold text-center text-[#4f46e5] mb-6">
        Schedule Class
      </h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <select
          name="subject"
          value={form.subject}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
        >
          <option value="">Select Subject</option>
          {subjects.map((sub) => (
            <option key={sub._id} value={sub._id}>
              {sub.name}
            </option>
          ))}
        </select>

        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
        />
        <div className="flex space-x-2">
          <input
            type="time"
            name="startTime"
            value={form.startTime}
            onChange={handleChange}
            required
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
          />
          <input
            type="time"
            name="endTime"
            value={form.endTime}
            onChange={handleChange}
            required
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
          />
        </div>

        <div className="text-sm text-gray-500 text-center">
          Location:{" "}
          {form.latitude && form.longitude
            ? `${form.latitude.toFixed(5)}, ${form.longitude.toFixed(5)}`
            : "Fetching..."}
        </div>

        <button
          type="submit"
          className="w-full py-2 rounded-xl bg-[#4f46e5] text-white font-semibold hover:bg-indigo-700 transition"
        >
          Schedule
        </button>
      </form>
    </div>
  );
}
