"use client";
import { useCurrentUser } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, BookOpen, Trophy, TrendingUp } from "lucide-react";
import { QUIZ_CONFIG } from "@/lib/topicsConfig";
import { useQuery } from "@tanstack/react-query";

interface ScoreDistribution {
  range: string;
  count: number;
  percentage: number;
}

interface PerformanceMetrics {
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  totalScores: number;
  completionRate: number;
  topPerformer: { name: string; score: number; percentage: number } | null;
}

export default function AdminDashboard() {
  const { isLoading: userLoading } = useCurrentUser();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalGroups: 0,
    totalQuizzes: QUIZ_CONFIG.totalQuizzes,
  });
  const [scoreDistribution, setScoreDistribution] = useState<
    ScoreDistribution[]
  >([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    averageScore: 0,
    highestScore: 0,
    lowestScore: 0,
    totalScores: 0,
    completionRate: 0,
    topPerformer: null,
  });

  // ✅ Fetch student submissions with React Query caching
  const { data: studentData, isLoading: studentLoading } = useQuery({
    queryKey: ["admin-submissions"],
    queryFn: async () => {
      const response = await fetch("/api/admin/submissions");
      if (!response.ok) throw new Error("Failed to fetch submissions");
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: true, // ✅ Refetch when admin returns to tab
  });

  // ✅ Fetch group submissions with React Query caching
  const { data: groupData, isLoading: groupLoading } = useQuery({
    queryKey: ["admin-group-submissions"],
    queryFn: async () => {
      const response = await fetch("/api/admin/submissions/groups");
      if (!response.ok) throw new Error("Failed to fetch group submissions");
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: true, // ✅ Refetch when admin returns to tab
  });

  // ✅ Calculate metrics when data is available
  useEffect(() => {
    if (!studentLoading && !groupLoading && studentData && groupData) {
      try {
        // ✅ SIMPLIFIED: studentData is already aggregated StudentResult[] with total field!
        // The /api/admin/submissions endpoint already calculates totals, so just use them directly

        const uniqueStudents = studentData.length;
        const uniqueGroups = new Set(
          (groupData.submissions || []).map((sub) => sub.groupNumber)
        ).size;

        // ✅ Collect student scores - just use the pre-calculated totals from API
        const allScores: number[] = studentData
          .filter((result) => result.total > 0) // Only students with at least one submission
          .map((result) => result.total);

        // Calculate score distribution (in percentage buckets 0-100)
        const distribution: ScoreDistribution[] = [
          { range: "0-20", count: 0, percentage: 0 },
          { range: "21-40", count: 0, percentage: 0 },
          { range: "41-60", count: 0, percentage: 0 },
          { range: "61-80", count: 0, percentage: 0 },
          { range: "81-100", count: 0, percentage: 0 },
        ];

        allScores.forEach((score) => {
          if (score <= 20) distribution[0].count++;
          else if (score <= 40) distribution[1].count++;
          else if (score <= 60) distribution[2].count++;
          else if (score <= 80) distribution[3].count++;
          else distribution[4].count++;
        });

        // Calculate percentages
        const total = allScores.length;
        distribution.forEach((d) => {
          d.percentage = total > 0 ? Math.round((d.count / total) * 100) : 0;
        });

        // Calculate performance metrics
        const averageScore =
          allScores.length > 0
            ? Math.round(
                allScores.reduce((a, b) => a + b, 0) / allScores.length
              )
            : 0;
        const highestScore = allScores.length > 0 ? Math.max(...allScores) : 0;
        const lowestScore = allScores.length > 0 ? Math.min(...allScores) : 0;

        // Find top performer (including groups)
        let topPerformer = null;
        let maxScore = -1;

        // Check student results for top performer
        studentData.forEach((result) => {
          if (result.total > maxScore) {
            maxScore = result.total;
            topPerformer = {
              name: result.fullName || "Unknown",
              score: Math.round(result.total),
              percentage: Math.round(result.total),
            };
          }
        });

        // ✅ Also check group scores for top performer
        (groupData.submissions || []).forEach((submission) => {
          if (
            submission.score !== undefined &&
            submission.score !== null &&
            submission.score > maxScore
          ) {
            maxScore = submission.score;
            topPerformer = {
              name: `Group ${submission.groupNumber}`,
              score: Math.round(submission.score),
              percentage: Math.round(submission.score),
            };
          }
        });

        // Calculate completion rate - count how many students have completed at least one quiz
        const studentsWithSubmissions = studentData.filter(
          (result) =>
            (result.topic1 || 0) +
              (result.topic2 || 0) +
              (result.topic3 || 0) +
              (result.topic4 || 0) >
            0
        ).length;

        const completionRate =
          uniqueStudents > 0
            ? Math.round((studentsWithSubmissions / uniqueStudents) * 100)
            : 0;

        setStats({
          totalStudents: uniqueStudents,
          totalGroups: uniqueGroups,
          totalQuizzes: QUIZ_CONFIG.totalQuizzes,
        });

        setScoreDistribution(distribution);
        setMetrics({
          averageScore,
          highestScore,
          lowestScore,
          totalScores: total,
          completionRate,
          topPerformer,
        });
      } catch (err) {
        console.error("Error calculating metrics:", err);
      }
    }
  }, [studentLoading, groupLoading, studentData, groupData]);

  if (userLoading || studentLoading || groupLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 lg:p-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 lg:p-8 text-white mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold mb-2">Admin Overview</h1>
        <p className="text-blue-100">
          Track system-wide performance and student progress
        </p>
      </div>

      {/* Key Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-8">
        {/* Total Students */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 font-medium">Total Students</h3>
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-4xl font-bold text-gray-800 mb-2">
            {stats.totalStudents}
          </p>
          <p className="text-sm text-gray-500">Active participants</p>
        </div>

        {/* Total Quizzes */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 font-medium">Total Quizzes</h3>
            <BookOpen className="w-6 h-6 text-orange-600" />
          </div>
          <p className="text-4xl font-bold text-gray-800 mb-2">
            {stats.totalQuizzes}
          </p>
          <p className="text-sm text-gray-500">Quiz topics available</p>
        </div>

        {/* Total Groups */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 font-medium">Total Groups</h3>
            <Trophy className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-4xl font-bold text-gray-800 mb-2">
            {stats.totalGroups}
          </p>
          <p className="text-sm text-gray-500">Group submissions</p>
        </div>
      </div>

      {/* Score Distribution & Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Score Distribution Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            Score Distribution
          </h2>
          <div className="space-y-4">
            {scoreDistribution.map((dist, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {dist.range}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800">
                      {dist.count}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({dist.percentage}%)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      idx === 0
                        ? "bg-red-500"
                        : idx === 1
                        ? "bg-orange-500"
                        : idx === 2
                        ? "bg-yellow-500"
                        : idx === 3
                        ? "bg-blue-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${dist.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Key Metrics</h2>
          <div className="space-y-4">
            {/* Average Score */}
            <div className="flex items-start justify-between pb-4 border-b border-gray-200">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">
                  Average Score
                </p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {metrics.averageScore}/100
                </p>
              </div>
              <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0" />
            </div>

            {/* Highest Score */}
            <div className="flex items-start justify-between pb-4 border-b border-gray-200">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">
                  Highest Score
                </p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {Math.round(metrics.highestScore)}/100
                </p>
              </div>
              <Trophy className="w-5 h-5 text-green-600 flex-shrink-0" />
            </div>

            {/* Completion Rate */}
            {/* <div className="flex items-start justify-between pb-4 border-b border-gray-200">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">
                  Completion Rate
                </p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {metrics.completionRate}%
                </p>
              </div>
            </div> */}

            {/* Top Performer */}
            {/* <div className="pt-2">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Top Performer
              </p>
              {metrics.topPerformer ? (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3">
                  <p className="font-semibold text-gray-800 text-sm">
                    {metrics.topPerformer.name}
                  </p>
                  <p className="text-lg font-bold text-blue-600">
                    {metrics.topPerformer.percentage}% (
                    {metrics.topPerformer.score} pts)
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No submissions yet</p>
              )}
            </div> */}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/admin/grading">
          <button className="w-full bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left">
            <BookOpen className="w-5 h-5 text-blue-600 mb-2" />
            <h3 className="font-semibold text-gray-800">Grade Submissions</h3>
            <p className="text-sm text-gray-600 mt-1">
              Review and grade group work
            </p>
          </button>
        </Link>

        <Link href="/admin/questions">
          <button className="w-full bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left">
            <Trophy className="w-5 h-5 text-orange-600 mb-2" />
            <h3 className="font-semibold text-gray-800">Manage Questions</h3>
            <p className="text-sm text-gray-600 mt-1">
              Create and edit quiz questions
            </p>
          </button>
        </Link>

        <Link href="/admin/results">
          <button className="w-full bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left">
            <TrendingUp className="w-5 h-5 text-green-600 mb-2" />
            <h3 className="font-semibold text-gray-800">View Results</h3>
            <p className="text-sm text-gray-600 mt-1">
              See detailed student results
            </p>
          </button>
        </Link>
      </div>
    </div>
  );
}
