import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import FaceCapture from "../../components/FaceCapture";
import api from "../../services/axios";

export default function MarkAttendance() {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarking, setIsMarking] = useState(false);

  const fetchPendingClasses = useCallback(async (showToast = true) => {
    setIsLoading(true);
    try {
      const res = await api.get("/attendance/pending");
      if (showToast && (!res.data || res.data.length === 0)) {
        toast("No scheduled classes found.", { icon: "📅" });
      }
      setClasses(res.data || []);
    } catch (err) {
      if (showToast) toast.error("Failed to fetch classes.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingClasses(true);
  }, [fetchPendingClasses]);

  const handleMarkAttendance = async () => {
    if (!selectedClassId) {
      toast("Please select a class first.", { icon: "⚠️" });
      return;
    }
    if (!faceDescriptor) {
      toast("Please capture your face first.", { icon: "⚠️" });
      return;
    }

    setIsMarking(true);

    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      setIsMarking(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const res = await api.post("/attendance/mark", {
            classId: selectedClassId,
            faceDescriptor,
            latitude,
            longitude,
          });

          const isLate = res.data.status === "late";
          toast.success(
            isLate ? "Attendance marked as LATE!" : "Attendance Marked Successfully!",
            {
              duration: 5000,
              position: 'top-center',
              style: {
                background: isLate ? '#f59e0b' : '#10b981',
                color: '#fff',
                fontSize: '16px',
                fontWeight: '600',
                padding: '16px 24px',
                borderRadius: '12px',
              },
              icon: isLate ? '⏰' : '✅',
            }
          );

          setTimeout(() => {
            setFaceDescriptor(null);
            setSelectedClassId("");
            fetchPendingClasses(false);
          }, 500);
        } catch (err) {
          const message = err.response?.data?.message || "Error marking attendance.";
          toast.error(message, { duration: 5000 });
        } finally {
          setIsMarking(false);
        }
      },
      (error) => {
        const messages = {
          1: "Location permission denied. Please enable location access.",
          2: "Location information unavailable.",
          3: "Location request timed out.",
        };
        toast.error(messages[error.code] || "Failed to get location.");
        setIsMarking(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const selectedClass = classes.find(c => c._id === selectedClassId);

  const steps = [
    { number: 1, title: "Select Class", completed: !!selectedClassId },
    { number: 2, title: "Capture Face", completed: !!faceDescriptor },
    { number: 3, title: "Mark Attendance", completed: false },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <motion.div 
        className="text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 mb-4 shadow-lg shadow-cyan-500/30">
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Mark Attendance</h2>
        <p className="text-gray-400">Select a class, capture your face, and mark your presence</p>
      </motion.div>

      {/* Progress Steps */}
      <motion.div 
        className="flex justify-center gap-4 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              step.completed 
                ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/30" 
                : "bg-gray-800 text-gray-500 border border-gray-700"
            }`}>
              {step.completed ? "✓" : step.number}
            </div>
            <span className={`text-sm hidden sm:block ${step.completed ? "text-cyan-400" : "text-gray-500"}`}>
              {step.title}
            </span>
            {idx < steps.length - 1 && (
              <div className={`w-8 h-0.5 ${step.completed ? "bg-cyan-500" : "bg-gray-700"}`}></div>
            )}
          </div>
        ))}
      </motion.div>

      {/* Main Card */}
      <motion.div 
        className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Step 1: Class Selection */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
              selectedClassId 
                ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white" 
                : "bg-gray-800 text-cyan-400 border border-cyan-500/50"
            }`}>
              {selectedClassId ? "✓" : "1"}
            </div>
            <h3 className="text-lg font-semibold text-white">Select Class</h3>
          </div>
          
          <select
            id="class-select"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            disabled={isLoading || isMarking}
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all disabled:opacity-50"
          >
            <option value="">
              {isLoading ? "Loading classes..." : "-- Choose a class --"}
            </option>
            {classes.map((cls) => {
              const dateStr = new Date(cls.date).toLocaleDateString('en-GB', {
                weekday: 'short', day: 'numeric', month: 'short',
              });
              return (
                <option key={cls._id} value={cls._id}>
                  {cls.subject?.name} – {dateStr} ({cls.startTime} - {cls.endTime})
                </option>
              );
            })}
          </select>

          {classes.length === 0 && !isLoading && (
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-center">
              <p className="text-yellow-400 text-sm">📅 No pending classes available. Check back later!</p>
            </div>
          )}

          {/* Selected Class Info */}
          {selectedClass && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-xl border border-cyan-500/30"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-xl flex-shrink-0 shadow-lg shadow-cyan-500/20">
                  📚
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white">{selectedClass.subject?.name}</h4>
                  <p className="text-sm text-gray-400 mt-1">
                    {new Date(selectedClass.date).toLocaleDateString('en-GB', { 
                      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
                    })}
                  </p>
                  <p className="text-sm text-cyan-400 font-medium">
                    🕐 {selectedClass.startTime} - {selectedClass.endTime}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Step 2: Face Capture */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
              faceDescriptor 
                ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white" 
                : "bg-gray-800 text-cyan-400 border border-cyan-500/50"
            }`}>
              {faceDescriptor ? "✓" : "2"}
            </div>
            <h3 className="text-lg font-semibold text-white">Capture Face</h3>
          </div>
          
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
            <FaceCapture onDescriptor={(desc) => setFaceDescriptor(desc)} />
            
            {faceDescriptor && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-center justify-center gap-2 text-cyan-400"
              >
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="font-medium">Face captured successfully!</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Step 3: Submit */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-gray-800 text-cyan-400 border border-cyan-500/50 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h3 className="text-lg font-semibold text-white">Mark Attendance</h3>
          </div>
          
          <motion.button
            type="button"
            onClick={handleMarkAttendance}
            disabled={!selectedClassId || !faceDescriptor || isMarking}
            whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(6, 182, 212, 0.4)" }}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all ${
              !selectedClassId || !faceDescriptor || isMarking
                ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700"
                : "bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/30"
            }`}
          >
            {isMarking ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Verifying & Marking...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Mark My Attendance</span>
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Info Box */}
      <motion.div 
        className="mt-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div className="text-sm text-gray-400">
            <p className="font-medium text-cyan-400 mb-1">Tips for successful attendance:</p>
            <ul className="space-y-1">
              <li>• Be within 50m of the class location</li>
              <li>• Ensure good lighting for face capture</li>
              <li>• Face the camera directly</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
