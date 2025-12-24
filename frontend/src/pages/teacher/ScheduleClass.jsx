import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import api from "../../services/axios";

export default function ScheduleClass() {
  const [form, setForm] = useState({
    subject: "",
    date: "",
    startTime: "",
    endTime: "",
    latitude: null,
    longitude: null,
  });

  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState("fetching");

  // Fetch subjects assigned to teacher
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await api.get("/teacher/subjects");
        setSubjects(res.data || []);
      } catch (err) {
        toast.error("Failed to fetch subjects");
      }
    };
    fetchSubjects();
  }, []);

  // Fetch teacher geolocation
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus("unsupported");
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((prev) => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        setLocationStatus("success");
      },
      (err) => {
        setLocationStatus("error");
        let message = "Failed to get location";
        if (err.code === err.PERMISSION_DENIED) {
          message = "Location permission denied";
        }
        toast.error(message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.latitude || !form.longitude) {
      toast.error("Location is required to schedule a class");
      return;
    }

    // Validate end time is after start time
    if (form.endTime <= form.startTime) {
      toast.error("End time must be after start time");
      return;
    }

    // Check if date is not in the past
    const selectedDate = new Date(form.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      toast.error("Cannot schedule classes in the past");
      return;
    }

    setIsLoading(true);

    try {
      await api.post("/classes", {
        subject: form.subject,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        latitude: form.latitude,
        longitude: form.longitude,
      });

      toast.success("Class scheduled successfully! 📅");

      // Reset form (keep location)
      setForm((prev) => ({
        ...prev,
        subject: "",
        date: "",
        startTime: "",
        endTime: "",
      }));
    } catch (err) {
      const message = err.response?.data?.message || "Failed to schedule class";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Get minimum date for date picker (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const inputClass = "w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all disabled:opacity-50";

  return (
    <motion.div 
      className="max-w-md mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 mb-4 shadow-lg shadow-cyan-500/30">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white">Schedule Class</h2>
        <p className="text-gray-500 text-sm mt-1">Create a new class session</p>
      </div>

      {/* Form Card */}
      <div className="bg-gray-900/50 backdrop-blur-xl p-6 rounded-2xl border border-gray-700/50">
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Subject Selection */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
              Subject
            </label>
            <select
              id="subject"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              required
              disabled={isLoading}
              className={inputClass}
            >
              <option value="">Select Subject</option>
              {subjects.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.name} (Sem {sub.semester})
                </option>
              ))}
            </select>
            {subjects.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                No subjects assigned. Contact admin to get subjects assigned.
              </p>
            )}
          </div>

          {/* Date Selection */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-2">
              Date
            </label>
            <input
              id="date"
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              min={getMinDate()}
              required
              disabled={isLoading}
              className={inputClass}
            />
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-300 mb-2">
                Start Time
              </label>
              <input
                id="startTime"
                type="time"
                name="startTime"
                value={form.startTime}
                onChange={handleChange}
                required
                disabled={isLoading}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-300 mb-2">
                End Time
              </label>
              <input
                id="endTime"
                type="time"
                name="endTime"
                value={form.endTime}
                onChange={handleChange}
                required
                disabled={isLoading}
                className={inputClass}
              />
            </div>
          </div>

          {/* Location Status */}
          <div className={`text-sm text-center p-4 rounded-xl border ${
            locationStatus === "success" 
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
              : locationStatus === "error" 
              ? "bg-red-500/10 border-red-500/30 text-red-400"
              : "bg-gray-800/50 border-gray-700 text-gray-400"
          }`}>
            {locationStatus === "fetching" && (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                Fetching your location...
              </span>
            )}
            {locationStatus === "success" && (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Location: {form.latitude?.toFixed(5)}, {form.longitude?.toFixed(5)}
              </span>
            )}
            {locationStatus === "error" && (
              <span>⚠️ Location not available. Please enable location access.</span>
            )}
            {locationStatus === "unsupported" && (
              <span>❌ Geolocation is not supported by your browser.</span>
            )}
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isLoading || !form.latitude || subjects.length === 0}
            whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(6, 182, 212, 0.4)" }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold shadow-lg shadow-cyan-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Scheduling...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Schedule Class</span>
              </>
            )}
          </motion.button>
        </form>
      </div>

      {/* Info Box */}
      <motion.div 
        className="mt-4 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <p className="font-medium text-cyan-400 text-sm mb-2">📌 Important Notes:</p>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• Your current location will be used as the class location</li>
          <li>• Students must be within 50m of this location to mark attendance</li>
          <li>• Schedule the class from the actual classroom for best results</li>
        </ul>
      </motion.div>
    </motion.div>
  );
}
