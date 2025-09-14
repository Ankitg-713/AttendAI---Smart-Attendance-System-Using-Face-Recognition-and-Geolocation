import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import toast from "react-hot-toast";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function ViewAttendance() {
  const [data, setData] = useState([]);
  const token = localStorage.getItem("token");
  const toastActive = useRef(false); // ✅ prevents duplicate toasts

  useEffect(() => {
    const fetchAttendance = async () => {
      if (toastActive.current) return; // prevent duplicate toast
      toastActive.current = true;

      try {
        const res = await axios.get(
          "http://localhost:8000/api/attendance/student/analytics",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!res.data || res.data.length === 0) {
          toast("No attendance data found", { icon: "📉" });
        } else {
          toast.success("Attendance data loaded!");
        }

        setData(res.data || []);
      } catch (err) {
        console.error("Error fetching attendance analytics:", err);
        toast.error("Failed to load attendance data.");
      } finally {
        // reset flag so future fetches can trigger toast again
        setTimeout(() => {
          toastActive.current = false;
        }, 100);
      }
    };

    fetchAttendance();
  }, [token]);

  return (
    <div className="max-w-5xl mx-auto mt-6 bg-white p-6 rounded-2xl shadow-lg">
      <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center text-indigo-700">
        📊 Attendance Overview
      </h2>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <span className="text-5xl mb-2">📉</span>
          <p className="text-center">No attendance data available.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((record, idx) => {
            const percentage = record.percentage || 0;

            const chartData = {
              labels: ["Present", "Absent"],
              datasets: [
                {
                  data: [percentage, 100 - percentage],
                  backgroundColor: ["#4f46e5", "#e0e7ff"], // Indigo + Lavender
                  hoverBackgroundColor: ["#4338ca", "#c7d2fe"],
                  borderWidth: 0,
                },
              ],
            };

            const chartOptions = {
              cutout: "70%",
              plugins: {
                legend: {
                  position: "bottom",
                  labels: { color: "#4f46e5", font: { size: 12 } },
                },
              },
              animation: { animateRotate: true, animateScale: true },
              maintainAspectRatio: false,
            };

            return (
              <div
                key={idx}
                className="bg-indigo-50 p-4 rounded-xl shadow hover:shadow-md transition"
              >
                <h3 className="text-lg font-semibold text-indigo-800 mb-4 text-center">
                  {record.subject}
                </h3>
                <div className="w-40 h-40 sm:w-56 sm:h-56 relative mx-auto">
                  <Doughnut data={chartData} options={chartOptions} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl sm:text-2xl font-bold text-indigo-900">
                      {percentage}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
