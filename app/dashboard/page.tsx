"use client";
import { useState } from "react";
import { useCurrentUser } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  BookOpen,
  Trophy,
  Upload,
  LogOut,
  Menu,
  X,
  Users,
  FileText,
  Award,
  Plane,
} from "lucide-react";

export default function StudentDashboard() {
  const { data: user, isLoading } = useCurrentUser();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    // Call your logout API here
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  bg-gray-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-[#0f172a] text-white">
        {/* Logo */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Plane className="w-6 h-6" />
            </div>
            <span className="text-lg font-bold">Student Portal</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 ">
          <Link href="/dashboard">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-600 text-white font-medium transition-colors">
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </button>
          </Link>

          <Link href="/my-scores">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white font-medium transition-colors">
              <Trophy className="w-5 h-5" />
              My Scores
            </button>
          </Link>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-600/20 text-gray-300 hover:text-red-400 font-medium transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0f172a] text-white transform transition-transform duration-300 lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Plane className="w-6 h-6" />
            </div>
            <span className="text-lg font-bold">Student Portal</span>
          </div>
          <button onClick={() => setSidebarOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/dashboard">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-600 text-white font-medium">
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </button>
          </Link>

          <Link href="/my-scores">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white font-medium">
              <Trophy className="w-5 h-5" />
              My Scores
            </button>
          </Link>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-600/20 text-gray-300 hover:text-red-400 font-medium"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Navigation - Mobile */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-800">Student Portal</span>
          </div>
          <div className="w-6" /> {/* Spacer for centering */}
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 lg:p-8">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 lg:p-8 text-white mb-6">
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">
              Welcome back, {user?.fullName || "John Mitchell"}
            </h1>
            <p className="text-blue-100 mb-4">
              Continue your training and track your progress
            </p>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
              <Users className="w-5 h-5" />
              <span className="font-medium">Group 1</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-6">
            {/* Quizzes Completed */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-600 font-medium">Quizzes Completed</h3>
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gray-800 mb-2">0 / 3</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: "0%" }}
                ></div>
              </div>
            </div>

            {/* Assignment Status */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-600 font-medium">Assignment Status</h3>
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
              <p className="text-3xl font-bold text-gray-800 mb-2">Pending</p>
              <p className="text-sm text-gray-500">
                Upload your group assignment
              </p>
            </div>

            {/* Latest Score */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-600 font-medium">Latest Score</h3>
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-gray-800 mb-2">
                No scores yet
              </p>
              <p className="text-sm text-gray-500">
                Complete a quiz to see your score
              </p>
            </div>
          </div>

          {/* Content Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Available Quizzes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Available Quizzes
              </h2>
              <div className="space-y-4">
                {/* Quiz 1 */}
                <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1">
                        Topic 1 – Airforce History & Protocol
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Test your knowledge of Airforce history, rank structure,
                        and military protocol.
                      </p>
                      <Link href="/quiz/1">
                        <button className="w-full bg-[#0f172a] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#1e293b] transition-colors">
                          Start Quiz
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Quiz 2 */}
                <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Plane className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1">
                        Topic 2 – Aircraft Systems
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Understand aircraft mechanics and systems
                      </p>
                      <Link href="/quiz/2">
                        <button className="w-full bg-[#0f172a] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#1e293b] transition-colors">
                          Start Quiz
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Quiz 3 */}
                <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Trophy className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1">
                        Topic 3 – Flight Operations
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Master flight procedures and safety
                      </p>
                      <Link href="/quiz/3">
                        <button className="w-full bg-[#0f172a] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#1e293b] transition-colors">
                          Start Quiz
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Group Assignment */}
            <div className="bg-whiterounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Group Assignment (Topic 4)
              </h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  Group Project Submission
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Upload your team's assignment
                </p>
                <p className="text-xs text-gray-500 mb-6">
                  Click to upload PDF file
                </p>
                <Link href="/group-assignment">
                  <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                    Choose File
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
