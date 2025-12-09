"use client";
import { useCurrentUser } from "@/hooks/useAuth";
import { useSubmissions } from "@/hooks/useSubmissions";
import Link from "next/link";
import { ArrowLeft, Calendar, Award } from "lucide-react";

export default function MyScoresPage() {
  const { data: user, isLoading } = useCurrentUser();
  const { data: submissions = [], isLoading: submissionsLoading } =
    useSubmissions();

  if (isLoading || submissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const overallPercentage =
    submissions.length > 0
      ? Math.round(
          submissions.reduce((sum, s) => sum + s.percentage, 0) /
            submissions.length
        )
      : 0;

  return (
    <>
      {/* Main Content Area */}
      <div className="w-full p-4 lg:p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">My Scores</h1>
            <p className="text-gray-600 mt-1">
              View all your quiz scores and performance
            </p>
          </div>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Quizzes Taken */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">
                  Quizzes Taken
                </p>
                <p className="text-3xl font-bold text-gray-800">
                  {submissions.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Average Score */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">
                  Average Score
                </p>
                <p className="text-3xl font-bold text-gray-800">
                  {overallPercentage}%
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Best Score */}
          {/* <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">
                  Best Score
                </p>
                <p className="text-3xl font-bold text-gray-800">
                  {submissions.length > 0
                    ? Math.max(...submissions.map((s) => s.percentage))
                    : 0}
                  %
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div> */}
        </div>

        {/* Scores Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Quiz Results</h2>

          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">
                No quiz scores yet. Start taking quizzes to see your results
                here.
              </p>
              <Link href="/dashboard">
                <button className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  Go to Dashboard
                </button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Quiz Topic
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Score
                    </th>
                    {/* <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Percentage
                    </th> */}
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Time Spent
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Date Taken
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission) => (
                    <tr
                      key={submission._id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4 text-gray-800 font-medium">
                        {submission.topicName}
                      </td>
                      <td className="py-4 px-4 text-gray-700">
                        {submission.score}/{submission.totalQuestions}
                      </td>
                      {/* <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                            submission.percentage >= 80
                              ? "bg-green-100 text-green-800"
                              : submission.percentage >= 60
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {submission.percentage}%
                        </span>
                      </td> */}
                      <td className="py-4 px-4 text-gray-700">
                        {formatTime(submission.timeSpent)}
                      </td>
                      <td className="py-4 px-4 text-gray-600 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {formatDate(submission.createdAt)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
