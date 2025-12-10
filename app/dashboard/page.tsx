"use client";
import { useCurrentUser } from "@/hooks/useAuth";
import { useSubmissionsWithRefetch } from "@/hooks/useSubmissionsWithRefetch";
import { useGroupSubmissions } from "../../hooks/useGroupSubmission";
import Link from "next/link";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Trophy,
  Upload,
  Users,
  FileText,
  Plane,
  Download,
  CheckCircle,
} from "lucide-react";
import { TOPICS } from "@/lib/topicsConfig";

export default function StudentDashboard() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useCurrentUser();
  const { data: submissions = [], isLoading: submissionsLoading } =
    useSubmissionsWithRefetch();

  // ✅ NEW: Check if quiz was just submitted and refetch
  useEffect(() => {
    const justSubmitted = localStorage.getItem("quiz_just_submitted");
    if (justSubmitted === "true") {
      console.log(
        "✅ Dashboard detected quiz submission - refetching submissions..."
      );
      queryClient.refetchQueries({ queryKey: ["submissions"] });
      localStorage.removeItem("quiz_just_submitted");
    }
  }, [queryClient]);

  // Fetch group submissions for the student's group
  const { data: groupSubmissionsData, isLoading: groupSubmissionsLoading } =
    useGroupSubmissions(undefined, user?.group);

  if (isLoading || submissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Get submission for a specific topic
  const getSubmissionForTopic = (topicId: string) => {
    return submissions.find((s) => s.topicId === topicId);
  };

  // Calculate completed quizzes
  const completedCount = submissions.length;
  const totalQuizzes = TOPICS.length;
  const completionPercentage = (completedCount / totalQuizzes) * 100;

  // Check if student's group has submitted
  const myGroupSubmission = groupSubmissionsData?.submissions?.find(
    (sub) => sub.groupNumber === user?.group
  );

  const handleDownloadFile = () => {
    if (myGroupSubmission?.fileUrl) {
      window.open(myGroupSubmission.fileUrl, "_blank");
    }
  };

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
            <span className="font-medium">
              You have been assigned to Group {user?.group ?? "—"}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 mb-6">
          {/* Quizzes Completed */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-medium">Quizzes Completed</h3>
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-800 mb-2">
              {completedCount} / {totalQuizzes}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Assignment Status */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-medium">Assignment Status</h3>
              {myGroupSubmission ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <FileText className="w-6 h-6 text-orange-600" />
              )}
            </div>
            {groupSubmissionsLoading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : myGroupSubmission ? (
              <>
                <p className="text-3xl font-bold text-green-600 mb-2">
                  Submitted
                </p>
                {/* <p className="text-sm text-gray-500">
                  By {myGroupSubmission.uploadedBy.fullName}
                </p>
                {myGroupSubmission.score !== null && (
                  <p className="text-sm font-semibold text-gray-700 mt-2">
                    Score: {myGroupSubmission.score}%
                  </p>
                )} */}
              </>
            ) : (
              <>
                <p className="text-3xl font-bold text-orange-600 mb-2">
                  Pending
                </p>
                <p className="text-sm text-gray-500">
                  Upload your group assignment
                </p>
              </>
            )}
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
              {TOPICS.map((topic) => {
                const submission = getSubmissionForTopic(topic.id);
                const icon =
                  topic.id === "topic1" ? (
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  ) : topic.id === "topic2" ? (
                    <Plane className="w-6 h-6 text-blue-600" />
                  ) : topic.id === "topic3" ? (
                    <Trophy className="w-6 h-6 text-blue-600" />
                  ) : (
                    <Upload className="w-6 h-6 text-blue-600" />
                  );

                return (
                  <div
                    key={topic.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        {icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-1">
                          {topic.label}
                        </h3>
                        {submission ? (
                          <div>
                            <Link href={`/dashboard/review?topic=${topic.id}`}>
                              <button className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors">
                                Quiz Taken. Review Answers
                              </button>
                            </Link>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-gray-600 mb-3">
                              {topic.description}
                            </p>
                            <Link href={`/dashboard/quiz?topic=${topic.id}`}>
                              <button className="w-full bg-[#0f172a] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#1e293b] transition-colors">
                                Start Quiz
                              </button>
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Group Assignment */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Group Assignment (Topic 4)
            </h2>

            {groupSubmissionsLoading ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-4">
                  Loading assignment status...
                </p>
              </div>
            ) : myGroupSubmission ? (
              // Show submitted assignment details
              <div className="border-2 border-green-200 bg-green-50 rounded-lg p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 mb-1">
                      Assignment Submitted
                    </h3>
                    <p className="text-sm text-gray-600">
                      Uploaded by {myGroupSubmission.uploadedBy.fullName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(
                        myGroupSubmission.uploadedAt
                      ).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    File: {myGroupSubmission.fileName}
                  </p>
                  {myGroupSubmission.score !== null && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm font-semibold text-gray-700">
                        Score:{" "}
                        <span className="text-green-600">
                          {myGroupSubmission.score}
                        </span>
                      </p>
                      {myGroupSubmission.feedback && (
                        <p className="text-sm text-gray-600 mt-2">
                          Feedback: {myGroupSubmission.feedback}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleDownloadFile}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download Submission
                </button>
              </div>
            ) : (
              // Show upload prompt
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  Group Project Submission
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Upload your team&apos;s assignment for Group {user?.group}
                </p>
                <p className="text-xs text-gray-500 mb-6">
                  Click to upload PDF file
                </p>
                <Link href="/dashboard/assignment">
                  <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                    Choose File
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
