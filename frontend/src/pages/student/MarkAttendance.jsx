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

  useEffect(() => {
    const fetchPendingClasses = async () => {
      if (toastActive.current) return;
      toastActive.current = true;

      try {
        const res = await axios.get(
          "http://localhost:8000/api/attendance/pending",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!res.data || res.data.length === 0) {
          toast("⚠️ No scheduled classes found.");
        } else {
          toast.success("Classes loaded successfully!");
        }

        setClasses(res.data || []);
      } catch (err) {
        console.error("Error fetching pending classes:", err);
        toast.error("❌ Failed to fetch classes.");
      } finally {
        setTimeout(() => {
          toastActive.current = false;
        }, 100);
      }
    };
    fetchPendingClasses();
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
            "http://localhost:8000/api/attendance/mark",
            { classId: selectedClassId, faceDescriptor, latitude, longitude },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          // ✅ Big success toast
          toast.custom(
            (t) => (
              <div
                className={`${
                  t.visible ? "animate-enter" : "animate-leave"
                } max-w-md w-full bg-green-600 text-white rounded-2xl shadow-lg p-6 flex items-center justify-center text-xl font-bold`}
              >
                ✅ {res.data.message || "Attendance marked successfully!"}
              </div>
            ),
            { duration: 4000 }
          );
        } catch (err) {
          const status = err.response?.status;
          const errorMessage = err.response?.data?.message || "";

          if (status === 403 && errorMessage.includes("Unauthorized")) {
            toast.error("❌ You are not authorized to mark attendance.");
          } else if (
            status === 403 &&
            errorMessage.includes("not available for your semester/course")
          ) {
            toast.error("❌ This class is not available for your semester/course.");
          } else if (status === 403 && errorMessage.includes("You cannot mark")) {
            toast.error("❌ You cannot mark attendance for others.");
          } else if (
            status === 403 &&
            errorMessage.includes("not within allowed location range")
          ) {
            toast.error("❌ You are not within the allowed location range.");
          } else if (status === 404 && errorMessage.includes("Class not found")) {
            toast.error("❌ Class not found.");
          } else if (
            status === 400 &&
            errorMessage.includes("Attendance already marked")
          ) {
            toast.error("⚠️ You have already marked attendance for this class.");
          } else {
            toast.error(`❌ ${errorMessage || "Error marking attendance"}`);
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
        <label className="block mb-2 font-medium text-gray-700">
          Select Class
        </label>
        <select
          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:outline-none"
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
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
        onClick={handleMarkAttendance}
        disabled={!selectedClassId || !faceDescriptor}
        className={`w-full py-3 rounded-xl text-white font-semibold transition ${
          !selectedClassId || !faceDescriptor
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-indigo-600 hover:bg-indigo-700 shadow-md"
        }`}
      >
        Mark Attendance
      </button>
    </div>
  );
}
