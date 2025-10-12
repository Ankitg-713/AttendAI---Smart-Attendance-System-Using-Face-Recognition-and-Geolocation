import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = { email: form.email, password: form.password };
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/auth/login`,
        payload
      );
      localStorage.setItem("token", res.data.token);
      const role = res.data.user?.role;

      toast.success("Login successful!", { duration: 2000 });

      // Navigate after a short delay to show the toast
      setTimeout(() => {
        // Dismiss all toasts before navigating
        toast.dismiss();
        
        // Navigate based on role
        if (role === "student") navigate("/student/dashboard");
        else if (role === "teacher") navigate("/teacher/dashboard");
        else if (role === "admin") navigate("/admin/dashboard");
        else toast.error("Invalid role");
      }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e0e7ff] to-[#ffffff] flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full border border-indigo-100">
        <div className="flex flex-col items-center mb-6">
          <h2 className="text-3xl font-extrabold text-indigo-700 text-center">
            Welcome Back
          </h2>
          <p className="text-sm text-gray-500 mt-1 text-center">
            Sign in to mark your attendance smartly
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="email"
            type="email"
            onChange={handleChange}
            placeholder="Enter your email"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all duration-200"
          />
          <input
            name="password"
            type="password"
            onChange={handleChange}
            placeholder="Enter your password"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all duration-200"
          />

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition font-semibold"
          >
            Login
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Don’t have an account?{" "}
          <span
            onClick={() => navigate("/register")}
            className="text-indigo-600 hover:underline cursor-pointer font-medium"
          >
            Register
          </span>
        </p>
      </div>
    </div>
  );
}
