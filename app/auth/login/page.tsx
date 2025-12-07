"use client";
import { useState } from "react";
import { useLogin } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const login = useLogin();
  const client = useQueryClient();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("All fields are required");
      return;
    }

    try {
      await login.mutateAsync(formData);
      client.invalidateQueries({ queryKey: ["currentUser"] });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Welcome Section */}
      <div className="lg:w-1/2 bg-gradient-to-br from-[#1e3a8a] via-[#1e40af] to-[#2563eb] text-white flex flex-col justify-center items-center p-8 lg:p-16">
        <div className="max-w-md w-full text-center lg:text-left">
          {/* Logo */}
          <div className="flex justify-center lg:justify-start mb-8">
            <div className="w-24 h-24 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
              <svg
                className="w-14 h-14 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </div>
          </div>

          {/* Welcome Text */}
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">Welcome Back</h1>
          <p className="text-lg text-white/90 mb-8 lg:mb-12">
            Access your training modules and continue your journey to excellence in the Airforce.
          </p>

          {/* Features List */}
          <ul className="space-y-4 text-left">
            <li className="flex items-start">
              <span className="w-2 h-2 bg-white rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span className="text-white/90">Track your progress</span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-white rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span className="text-white/90">Complete quizzes</span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-white rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span className="text-white/90">Submit assignments</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="lg:w-1/2 bg-white flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          {/* Title */}
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">Login</h2>
          <p className="text-gray-600 mb-8 text-sm lg:text-base">
            Enter your credentials to access your account
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@airforce.mil"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-800 placeholder-gray-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-800 placeholder-gray-400"
                />
              </div>
            </div>

            {/* Demo Credentials Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <p className="font-semibold text-gray-800 mb-2">Demo Credentials:</p>
              <div className="space-y-1 text-gray-700">
                <p>
                  <span className="font-medium">Student:</span> student@airforce.mil / student
                </p>
                <p>
                  <span className="font-medium">Admin:</span> admin@airforce.mil / admin
                </p>
              </div>
              <p className="text-xs text-gray-600 italic mt-2">
                Note: Use the admin account to manage questions, view analytics, and grade
                assignments.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={login.isPending}
              className="w-full bg-[#1e40af] hover:bg-[#1e3a8a] text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {login.isPending ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* Signup Link */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Don't have an account?{" "}
            <Link href="/signup" className="text-[#1e40af] font-semibold hover:underline">
              Create one here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}