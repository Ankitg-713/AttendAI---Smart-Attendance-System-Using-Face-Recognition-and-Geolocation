import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import FaceCapture from "../../components/FaceCapture";
import toast from "react-hot-toast";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    course: "",
    semester: "",
  });

  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const navigate = useNavigate();
  const toastActive = useRef(false); // ✅ prevents duplicate toast

  useEffect(() => {
    if (form.course === "MCA") {
      setSemesters([1, 2, 3, 4]);
    } else {
      setSemesters([]);
      setForm((prev) => ({ ...prev, semester: "" }));
    }
  }, [form.course]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (toastActive.current) return; // prevent duplicate toast
    toastActive.current = true;

    if (!faceDescriptor) {
      toast.error("Please capture your face before submitting.");
      toastActive.current = false;
      return;
    }

    if (form.role === "student" && (!form.course || !form.semester)) {
      toast.error("Please select course and semester.");
      toastActive.current = false;
      return;
    }

    try {
      const payload = { ...form, faceDescriptor };
      await axios.post("http://localhost:8000/api/auth/register", payload);

      toast.success("Registration successful!");
      navigate("/login");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      // reset flag for next submission
      setTimeout(() => {
        toastActive.current = false;
      }, 100);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e0e7ff] to-white flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-indigo-100">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-extrabold text-indigo-700">
            Create an Account
          </h2>
          <p className="text-sm text-gray-500">
            Join AttendAI and mark your attendance smartly
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="name"
            onChange={handleChange}
            placeholder="Full Name"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none transition"
          />

          <input
            name="email"
            type="email"
            onChange={handleChange}
            placeholder="Email"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none transition"
          />

          <input
            name="password"
            type="password"
            onChange={handleChange}
            placeholder="Password"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none transition"
          />

          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none transition"
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>

          {form.role === "student" && (
            <>
              <select
                name="course"
                value={form.course}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none transition"
              >
                <option value="">Select Course</option>
                <option value="MCA">MCA</option>
              </select>

              <select
                name="semester"
                value={form.semester}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none transition"
              >
                <option value="">Select Semester</option>
                {semesters.map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </>
          )}

          <div className="mt-2">
            <p className="text-sm text-gray-600 mb-1 font-medium">
              📸 Capture Your Face
            </p>
            <FaceCapture onDescriptor={(desc) => setFaceDescriptor(desc)} />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition font-semibold"
          >
            Register
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-indigo-600 hover:underline cursor-pointer font-medium"
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}
