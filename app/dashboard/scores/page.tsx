"use client";
import { useCurrentUser } from "@/hooks/useAuth";
import { useSubmissionsWithRefetch } from "@/hooks/useSubmissionsWithRefetch";
import { useGroupSubmissions } from "@/hooks/useGroupSubmission";
import Link from "next/link";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Calendar, Award, Users } from "lucide-react";

export default function MyScoresPage() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useCurrentUser();
  const { data: submissions = [], isLoading: submissionsLoading } =
    useSubmissionsWithRefetch();

  // ✅ NEW: Check if quiz was just submitted and refetch
  useEffect(() => {
    const justSubmitted = localStorage.getItem("quiz_just_submitted");
    if (justSubmitted === "true") {
      console.log(
        "✅ Scores page detected quiz submission - refetching submissions..."
      );
      queryClient.refetchQueries({ queryKey: ["submissions"] });
      localStorage.removeItem("quiz_just_submitted");
    }
  }, [queryClient]);

  const { data: groupSubmissionsData, isLoading: groupLoading } =
    useGroupSubmissions(undefined, user?.group);

  if (isLoading || submissionsLoading || groupLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  /**
   * --------------------------
   * RAW SCORE CALCULATIONS
   * --------------------------
   */

  // Total quiz score (raw)
  const totalQuizScore = submissions.reduce((sum, s) => sum + s.score, 0);

  // Get group submission for student's group
  const groupSubmission = groupSubmissionsData?.submissions?.find(
    (sub) => sub.groupNumber === user?.group
  );

  // Group score is 0 until graded
  const groupScore =
    typeof groupSubmission?.score === "number" ? groupSubmission.score : 0;

  // Grand total
  const totalScore = totalQuizScore + groupScore;

  return (
    <div className="w-full p-4 lg:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">My Scores</h1>
        <p className="text-gray-700 text-lg">
          View all your quiz and group assignment scores
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Quizzes Taken */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg border-0 p-6 text-white transform hover:scale-105 transition-transform">
          <p className="text-indigo-100 text-sm font-medium mb-1">
            Quizzes Taken
          </p>
          <p className="text-4xl font-bold">{submissions.length}</p>
        </div>

        {/* Total Score */}
        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg border-0 p-6 text-white transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">
                Total Score
              </p>
              <p className="text-4xl font-bold">{totalScore}</p>

              {!groupSubmission?.score && (
                <p className="text-xs text-yellow-200 mt-1 font-medium">
                  ⏳ Group assignment not graded yet
                </p>
              )}
            </div>
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Results Table */}
      <div className="bg-white rounded-xl shadow-lg border-0 p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Quiz Results</h2>

        {submissions.length === 0 ? (
          <div className="text-center py-12">
            <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-700 text-lg font-medium">
              No quiz scores yet.
            </p>
            <Link href="/dashboard">
              <button className="mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all">
                Go to Dashboard
              </button>
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Quiz Topic
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Score
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Time Spent
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Date Taken
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission, index) => (
                    <tr
                      key={submission._id}
                      className={`border-b hover:bg-blue-50 transition-colors ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                    >
                      <td className="py-4 px-4 font-medium text-gray-900">
                        {submission.topicName}
                      </td>
                      <td className="py-4 px-4 text-gray-900">
                        <span className="font-semibold text-blue-600">
                          {submission.score}
                        </span>
                        <span className="text-gray-700">/20</span>
                      </td>
                      <td className="py-4 px-4 text-gray-900 font-medium">
                        {formatTime(submission.timeSpent)}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{formatDate(submission.createdAt)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Group Summary */}
            <div className="mt-6 pt-4 border-t-2 border-gray-200 flex justify-between items-center bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-gray-900">
                  Group Assignment
                </span>
              </div>
              <span className="font-bold text-lg text-gray-900">
                {groupSubmission?.score ?? "Pending"}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
