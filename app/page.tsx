"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useAuth";
import Link from "next/link";
import { Loader2, BookOpen, Plane, User, TrendingUp } from "lucide-react";
import AnimatedPlane from "./components/Animatedplane";

export default function LandingPage() {
  const router = useRouter();
  const { data: user, isLoading } = useCurrentUser();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // Redirect based on user role
        const redirectPath = user.role === "admin" ? "/admin" : "/dashboard";
        router.push(redirectPath);
      } else {
        setChecking(false);
      }
    }
  }, [user, isLoading, router]);

  if (checking || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#0f172a] to-[#1e293b]">
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full bg-[#0f172a]/80 backdrop-blur-md border-b border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Plane className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Airforce Training System
              </span>
            </div>

            {/* Auth Buttons */}
            <div className="flex gap-3">
              <Link href="/auth/login">
                <button className="px-6 py-2 text-white hover:text-blue-400 font-medium transition-colors">
                  Login
                </button>
              </Link>
              <Link href="/auth/signup">
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">
                  Sign Up
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          {/* Animated Plane Icon */}
          <div>
            <AnimatedPlane />
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Airforce Training Quiz System
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
            Complete your training modules, test your knowledge, and track your
            progress through our comprehensive quiz system designed for Airforce
            personnel.
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2  gap-11 max-w-6xl mx-auto p-6 md:p-0">
            {/* Feature 1 */}
            <div className="bg-white  backdrop-blur-sm border border-white/10 rounded-2xl p-7  transition-all duration-300 group">
              <div className="flex gap-2">
                <div>
                  <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                    <BookOpen className="h-7 w-7 text-blue-500" />
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-lg px-1 text-gray-700 text-left mb-2">
                    Topic 1 – Airforce History & Protocol
                  </p>
                  <p className="text-gray-500 font-extralight  text-left px-1">
                    Test your knowledge of Airforce history, rank structure, and
                    military protocol.
                  </p>
                </div>
              </div>
              <div>
                <Link href="/auth/login">
                  <button className="w-full cursor-pointer bg-[#0a1628] rounded-lg mt-8 py-3 text-white font-medium">
                    Start Quiz
                  </button>
                </Link>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white  backdrop-blur-sm border border-white/10 rounded-2xl p-7  transition-all duration-300 group">
              <div className="flex gap-2">
                <div>
                  <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                    <Plane className="h-7 w-7 text-blue-500" />
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-lg px-1 text-gray-700 text-left mb-2">
                    Topic 2 – Airforce History & Protocol
                  </p>
                  <p className="text-gray-500 font-extralight  text-left px-1">
                    Understand aircraft mechanics, systems operations, and
                    technical specifications.
                  </p>
                </div>
              </div>
              <div>
                <Link href="/auth/login">
                  <button className="w-full cursor-pointer bg-[#0a1628] rounded-lg mt-8 py-3 text-white font-medium">
                    Start Quiz
                  </button>
                </Link>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-white  backdrop-blur-sm border border-white/10 rounded-2xl p-7  transition-all duration-300 group">
              <div className="flex gap-2">
                <div>
                  <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-7 w-7 text-blue-500" />
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-lg px-1 text-gray-700 text-left mb-2">
                    Topic 3 – Flight Operations
                  </p>
                  <p className="text-gray-500 font-extralight  text-left px-1">
                    Master flight procedures, navigation, and operational safety
                    standards.
                  </p>
                </div>
              </div>
              <div>
                <Link href="/auth/login">
                  <button className="w-full cursor-pointer bg-[#0a1628] rounded-lg mt-8 py-3 text-white font-medium">
                    Start Quiz
                  </button>
                </Link>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-white  backdrop-blur-sm border border-white/10 rounded-2xl p-7  transition-all duration-300 group">
              <div className="flex gap-2">
                <div>
                  <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                    <User className="h-7 w-7 text-blue-500" />
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-lg px-1 text-gray-700 text-left mb-2">
                    Topic 4 – Group Assigments
                  </p>
                  <p className="text-gray-500 font-extralight  text-left px-1">
                    Collaborative group project submission. Upload your team's
                    assignment in PDF format.
                  </p>
                </div>
              </div>
              <div>
                <Link href="/auth/login">
                  <button className="w-full cursor-pointer bg-[#0a1628] rounded-lg mt-8 py-3 text-white font-medium">
                    Upload PDF
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 text-center">
        <p className="text-gray-500 text-sm">
          &copy; 2024 Airforce Training System. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
