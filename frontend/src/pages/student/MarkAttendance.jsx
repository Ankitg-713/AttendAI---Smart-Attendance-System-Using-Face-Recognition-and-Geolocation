import { useEffect, useState, useRef } from "react";
import axios from "axios";
import FaceCapture from "../../components/FaceCapture";
import toast from "react-hot-toast";

export default function MarkAttendance() {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const token = localStorage.getItem("token");
  const toastActive = useRef(false); // ✅ prevent duplicate toasts

  const fetchPendingClasses = async (showToast = true) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/attendance/pending`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (showToast) {
        if (!res.data || res.data.length === 0) {
          toast("⚠️ No scheduled classes found.");
        } else {
          toast.success("Classes loaded successfully!");
        }
      }

      setClasses(res.data || []);
    } catch (err) {
      if (showToast) {
        toast.error("❌ Failed to fetch classes.");
      }
    }
  };

  useEffect(() => {
    if (toastActive.current) return;
    toastActive.current = true;

    fetchPendingClasses(true);

    setTimeout(() => {
      toastActive.current = false;
    }, 100);
  }, [token]);

  const handleMarkAttendance = async () => {
    if (!selectedClassId) {
      toast("⚠️ Please select a class first.");
      return;
    }
    if (!faceDescriptor) {
      toast("⚠️ Please capture your face first.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const res = await axios.post(
            `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/attendance/mark`,
            { classId: selectedClassId, faceDescriptor, latitude, longitude },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          // ✅ Show BIG success message
          toast.success(
            "🎉 Attendance Marked Successfully!",
            {
              duration: 5000,
              position: 'top-center',
              style: {
                background: '#10b981',
                color: '#fff',
                fontSize: '18px',
                fontWeight: 'bold',
                padding: '20px 30px',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              },
              icon: '✅',
            }
          );

          // Reset form and refresh class list
          setTimeout(() => {
            setFaceDescriptor(null);
            setSelectedClassId("");
            // Refresh the pending classes list (without toast)
            fetchPendingClasses(false);
          }, 500);
        } catch (err) {
          const status = err.response?.status;
          const errorMessage = err.response?.data?.message || "";
          
          // Log error only in development
          if (import.meta.env.DEV) {
            console.error("Attendance marking error:", {
              status,
              message: errorMessage,
              fullError: err.response?.data
            });
          }

          if (status === 401 && errorMessage.includes("Face not recognized")) {
            toast.error("❌ Face not recognized. Please try capturing again.", {
              duration: 5000,
            });
          } else if (status === 403 && errorMessage.includes("Unauthorized")) {
            toast.error("❌ You are not authorized to mark attendance.", {
              duration: 5000,
            });
          } else if (
            status === 403 &&
            errorMessage.includes("not available for your semester/course")
          ) {
            toast.error("❌ This class is not available for your semester/course.", {
              duration: 5000,
            });
          } else if (status === 403 && errorMessage.includes("You cannot mark")) {
            toast.error("❌ You cannot mark attendance for others.", {
              duration: 5000,
            });
          } else if (
            status === 403 &&
            errorMessage.includes("not within allowed location range")
          ) {
            toast.error("❌ You are not within the allowed location range (50m).", {
              duration: 6000,
            });
          } else if (status === 400 && errorMessage.includes("Class not active")) {
            toast.error("❌ This class is not active right now.", {
              duration: 5000,
            });
          } else if (status === 404 && errorMessage.includes("Class not found")) {
            toast.error("❌ Class not found.", {
              duration: 5000,
            });
          } else if (
            status === 400 &&
            errorMessage.includes("Attendance already marked")
          ) {
            toast.error("⚠️ You have already marked attendance for this class!", {
              duration: 5000,
            });
          } else if (status === 400 && errorMessage.includes("Incomplete data")) {
            toast.error("❌ Incomplete data. Please try again.", {
              duration: 5000,
            });
          } else {
            toast.error(`❌ ${errorMessage || "Error marking attendance. Please try again."}`, {
              duration: 5000,
            });
          }
        }
      },
      () => toast.error("❌ Failed to get your location.")
    );
  };

  return (
    <div className="max-w-2xl mx-auto mt-6 p-6 bg-white rounded-2xl shadow-lg border border-indigo-100">
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 text-indigo-700">
        🎓 Mark Attendance
      </h2>

      <div className="mb-6">
        <label htmlFor="class-select" className="block mb-2 font-medium text-gray-700">
          Select Class
        </label>
        <select
          id="class-select"
          name="classId"
          autoComplete="off"
          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:outline-none"
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          aria-label="Select class for attendance"
          aria-required="true"
        >
          <option value="">-- Select a class --</option>
          {classes.map((cls) => {
            const formattedDate = new Date(cls.date).toLocaleString();
            return (
              <option key={cls._id} value={cls._id}>
                {cls.subject?.name} – {formattedDate} ({cls.startTime} -{" "}
                {cls.endTime})
              </option>
            );
          })}
        </select>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-indigo-600 mb-3">
          📸 Capture Face
        </h3>
        <FaceCapture onDescriptor={(desc) => setFaceDescriptor(desc)} />
      </div>

      <button
        type="button"
        onClick={handleMarkAttendance}
        disabled={!selectedClassId || !faceDescriptor}
        className={`w-full py-3 rounded-xl text-white font-semibold transition ${
          !selectedClassId || !faceDescriptor
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-indigo-600 hover:bg-indigo-700 shadow-md"
        }`}
        aria-label="Submit attendance"
        aria-disabled={!selectedClassId || !faceDescriptor}
      >
        Mark Attendance
      </button>
    </div>
  );
}
