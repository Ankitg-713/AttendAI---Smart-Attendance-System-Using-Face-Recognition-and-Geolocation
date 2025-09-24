import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function AnalyticsTab({ analyticsData }) {
  if (!analyticsData || analyticsData.length === 0) {
    return <p className="text-center text-gray-500">No attendance data available.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {analyticsData.map((record, idx) => {
        const present = record.percentage || 0;
        const absent = 100 - present;

        const chartData = {
          labels: ["Present", "Absent"],
          datasets: [{ data: [present, absent], backgroundColor: ["#34d399", "#f87171"], borderWidth: 0 }],
        };

        const chartOptions = {
          cutout: "70%",
          plugins: { legend: { position: "bottom", labels: { color: "#4f46e5" } } },
          maintainAspectRatio: false,
        };

        return (
          <div key={idx} className="bg-indigo-50 p-4 rounded-xl shadow flex flex-col items-center">
            <h3 className="text-lg font-semibold text-indigo-800 mb-2 text-center">{record.subject}</h3>
            <div className="w-40 h-40 sm:w-56 sm:h-56 relative">
              <Doughnut data={chartData} options={chartOptions} />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-base sm:text-lg font-semibold text-indigo-800">{present}%</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
