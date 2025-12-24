import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { motion } from "framer-motion";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function AnalyticsTab({ analyticsData }) {
  if (!analyticsData || analyticsData.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-700/50">
        <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-gray-400">No attendance data available.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {analyticsData.map((record, idx) => {
        const present = record.percentage || 0;
        const absent = 100 - present;
        const isGood = present >= 75;

        const chartData = {
          labels: ["Present", "Absent"],
          datasets: [{ 
            data: [present, absent], 
            backgroundColor: ["#06b6d4", "#374151"], 
            hoverBackgroundColor: ["#22d3ee", "#4b5563"],
            borderWidth: 0 
          }],
        };

        const chartOptions = {
          cutout: "70%",
          plugins: { 
            legend: { display: false },
            tooltip: { enabled: true }
          },
          maintainAspectRatio: false,
        };

        return (
          <motion.div 
            key={idx} 
            className="bg-gray-900/50 backdrop-blur-xl p-6 rounded-2xl border border-gray-700/50 hover:border-cyan-500/30 transition-all"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            whileHover={{ y: -5 }}
          >
            <h3 className="text-lg font-semibold text-white mb-4 text-center">{record.subject}</h3>
            <div className="w-40 h-40 relative mx-auto mb-4">
              <Doughnut data={chartData} options={chartOptions} />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className={`text-2xl font-bold ${isGood ? 'text-cyan-400' : 'text-red-400'}`}>
                  {present}%
                </span>
              </div>
            </div>
            <div className="flex justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                <span className="text-gray-400">Present</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-600"></div>
                <span className="text-gray-400">Absent</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
