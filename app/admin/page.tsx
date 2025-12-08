"use client";
import { useCurrentUser } from "@/hooks/useAuth";
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

export default function AdminDashboard() {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      {/* Main Content Area */}
      <div className="w-full p-4 lg:p-8">
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
      </div>
    </>
  );
}
