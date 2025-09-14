import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import toast from "react-hot-toast";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function ViewAnalytics() {
  const [data, setData] = useState([]);
  const [status, setStatus] = useState("");
  const token = localStorage.getItem("token");
  const toastActive = useRef(false); // ✅ prevents duplicate toasts

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await axios.get(
          "http://localhost:8000/api/attendance/teacher/analytics",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.data || res.data.length === 0) {
          if (!toastActive.current) {
            toastActive.current = true;
            toast("No attendance data available.", { icon: "📉" });
            setTimeout(() => (toastActive.current = false), 100);
          }
        }
        setData(res.data || []);
      } catch (err) {
        console.error(err);
        if (!toastActive.current) {
          toastActive.current = true;
          toast.error("Failed to fetch analytics.");
          setTimeout(() => (toastActive.current = false), 100);
        }
        setStatus("Failed to fetch analytics.");
      }
    };
    fetchAnalytics();
  }, [token]);

  return (
    <div className="max-w-5xl mx-auto mt-6 bg-white p-6 rounded-2xl shadow-lg border border-indigo-100">
      <h2 className="text-2xl font-bold mb-6 text-center text-[#4f46e5]">
        Attendance Analytics
      </h2>

      {status && <p className="text-center text-red-500">{status}</p>}

      {data.length === 0 ? (
        <p className="text-center text-gray-500">No attendance data available.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((record, idx) => {
            const present = record.percentage || 0;
            const absent = 100 - present;

            const chartData = {
              labels: ["Present", "Absent"],
              datasets: [
                {
                  data: [present, absent],
                  backgroundColor: ["#34d399", "#f87171"], // green + red
                  borderWidth: 0,
                },
              ],
            };

            const chartOptions = {
              cutout: "70%",
              plugins: {
                legend: {
                  position: "bottom",
                  labels: { color: "#4f46e5" },
                },
              },
              maintainAspectRatio: false,
            };

            return (
              <div
                key={idx}
                className="bg-indigo-50 p-4 rounded-xl shadow flex flex-col items-center"
              >
                <h3 className="text-lg font-semibold text-indigo-800 mb-2 text-center">
                  {record.subject}
                </h3>
                <div className="w-40 h-40 sm:w-56 sm:h-56 relative">
                  <Doughnut data={chartData} options={chartOptions} />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-base sm:text-lg font-semibold text-indigo-800">
                      {present}%
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
