import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

export default function LandingPage() {
  const navigate = useNavigate();

  const handleNavigate = (path, message) => {
    toast(message, { icon: "ℹ️" });
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f7faff] to-[#e6f0ff] text-gray-800">
      {/* Navbar */}
      <nav className="w-full px-6 py-4 bg-white shadow-md flex justify-between items-center sticky top-0 z-10">
        <div className="text-3xl font-extrabold text-indigo-700 tracking-tight">
          AttendAI
        </div>
        <div className="space-x-4">
          <button
            onClick={() => handleNavigate("/login", "Redirecting to Login...")}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
          >
            Login
          </button>
          <button
            onClick={() => handleNavigate("/register", "Redirecting to Registration...")}
            className="px-4 py-2 bg-white text-indigo-600 border border-indigo-600 rounded hover:bg-indigo-50 transition"
          >
            Register
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="text-center py-20 px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-indigo-800 mb-4">
          Revolutionizing Attendance with AI
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
          AttendAI is a smart attendance system using face recognition and geolocation to ensure secure, automated, and accurate attendance tracking.
        </p>
        <button
          onClick={() => handleNavigate("/register", "Let's get you registered!")}
          className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 transition"
        >
          Get Started
        </button>
      </section>

      {/* Features */}
      <section className="py-16 px-6 bg-white">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-indigo-700 mb-2">Why AttendAI?</h2>
          <p className="text-gray-600">Experience the future of student attendance.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="p-6 bg-[#f0f4ff] rounded-2xl shadow-md text-center">
            <h3 className="text-xl font-semibold text-indigo-700 mb-2">AI Face Recognition</h3>
            <p className="text-gray-600">
              Ensures accurate identification using deep learning-powered facial recognition.
            </p>
          </div>
          <div className="p-6 bg-[#f0f4ff] rounded-2xl shadow-md text-center">
            <h3 className="text-xl font-semibold text-indigo-700 mb-2">Geolocation Verification</h3>
            <p className="text-gray-600">
              Confirms attendance only when the student is physically present within the campus.
            </p>
          </div>
          <div className="p-6 bg-[#f0f4ff] rounded-2xl shadow-md text-center">
            <h3 className="text-xl font-semibold text-indigo-700 mb-2">Real-Time Analytics</h3>
            <p className="text-gray-600">
              Students and teachers can view attendance statistics in real-time.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 bg-indigo-50 text-sm text-gray-600">
        © {new Date().getFullYear()} AttendAI. Built with ❤️ for smart education.
      </footer>
    </div>
  );
}
