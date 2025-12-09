// app/admin/grading/page.tsx
"use client";

import { useState } from "react";
import {
  useGroupSubmissions,
  useGradeSubmission,
  type GroupSubmission,
} from "../../../hooks/useGroupSubmission";

export default function AdminGradingPage() {
  const [filterGraded, setFilterGraded] = useState<boolean | undefined>(
    undefined
  );
  const [selectedSubmission, setSelectedSubmission] =
    useState<GroupSubmission | null>(null);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [gradeForm, setGradeForm] = useState({
    score: "",
    feedback: "",
  });

  // Fetch submissions
  const { data, isLoading, error } = useGroupSubmissions(filterGraded);
  const gradeMutation = useGradeSubmission();

  const handleGradeClick = (submission: GroupSubmission) => {
    setSelectedSubmission(submission);
    setGradeForm({
      score: submission.score?.toString() || "",
      feedback: submission.feedback || "",
    });
    setShowGradeModal(true);
  };

  const handleGradeSubmit = () => {
    if (!selectedSubmission) return;

    const score = parseFloat(gradeForm.score);
    if (isNaN(score) || score < 0 || score > 100) {
      alert("Please enter a valid score between 0 and 100");
      return;
    }

    gradeMutation.mutate(
      {
        id: selectedSubmission.id,
        data: {
          score,
          feedback: gradeForm.feedback.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          setShowGradeModal(false);
          setSelectedSubmission(null);
          setGradeForm({ score: "", feedback: "" });
          alert("Submission graded successfully!");
        },
        onError: (error) => {
          alert(`Failed to grade: ${error.message}`);
        },
      }
    );
  };

  const closeModal = () => {
    setShowGradeModal(false);
    setSelectedSubmission(null);
    setGradeForm({ score: "", feedback: "" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading submissions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-semibold mb-2">
            Error Loading Submissions
          </h2>
          <p className="text-red-600">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Group Submissions Grading
          </h1>
          <p className="text-gray-600">
            Review and grade PDF submissions from student groups
          </p>
        </div>

        {/* Stats Cards */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-1">Total Submissions</p>
              <p className="text-3xl font-bold text-blue-600">
                {data.stats.total}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-1">Graded</p>
              <p className="text-3xl font-bold text-green-600">
                {data.stats.graded}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-1">Ungraded</p>
              <p className="text-3xl font-bold text-orange-600">
                {data.stats.ungraded}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-1">Pending Upload</p>
              <p className="text-3xl font-bold text-gray-600">
                {data.stats.pending}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setFilterGraded(undefined)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterGraded === undefined
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterGraded(false)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterGraded === false
                  ? "bg-orange-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Ungraded
            </button>
            <button
              onClick={() => setFilterGraded(true)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterGraded === true
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Graded
            </button>
          </div>
        </div>

        {/* Submissions List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Submissions ({data?.submissions.length || 0})
            </h2>
          </div>

          {data?.submissions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📄</div>
              <p className="text-gray-500 text-lg">No submissions yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {data?.submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="p-6 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between">
                    {/* Left side - Submission info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 font-semibold rounded-full text-sm">
                          Group {submission.groupNumber}
                        </span>
                        {submission.score !== null ? (
                          <span className="px-3 py-1 bg-green-100 text-green-800 font-semibold rounded-full text-sm">
                            ✓ Graded: {submission.score}
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-orange-100 text-orange-800 font-semibold rounded-full text-sm">
                            ⏳ Awaiting Grade
                          </span>
                        )}
                      </div>

                      <h3 className="font-semibold text-gray-900 mb-2">
                        {submission.fileName}
                      </h3>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <p className="text-gray-600">Uploaded by:</p>
                          <p className="text-gray-900 font-medium">
                            {submission.uploadedBy.fullName}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Uploaded at:</p>
                          <p className="text-gray-900">
                            {new Date(submission.uploadedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Group Members */}
                      {/* <div className="mb-3"> */}
                      {/* <p className="text-sm text-gray-600 mb-1">
                          Group Members ({submission.students.length}):
                        </p> */}
                      {/* <div className="flex flex-wrap gap-2">
                          {submission.students.map((student) => (
                            <span
                              key={student._id}
                              className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                            >
                              {student.fullName}
                            </span>
                          ))}
                        </div> */}
                      {/* </div> */}

                      {/* Feedback if graded */}
                      {submission.feedback && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">
                            Feedback:
                          </p>
                          <p className="text-gray-900">{submission.feedback}</p>
                        </div>
                      )}
                    </div>

                    {/* Right side - Actions */}
                    <div className="ml-6 flex flex-col gap-2">
                      <a
                        href={submission.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-center text-sm font-medium"
                      >
                        📥 Download PDF
                      </a>
                      <button
                        onClick={() => handleGradeClick(submission)}
                        className={`px-4 py-2 rounded-lg transition text-center text-sm font-medium ${
                          submission.score !== null
                            ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                      >
                        {submission.score !== null
                          ? "✏️ Edit Grade"
                          : "✓ Grade Now"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Groups */}
        {data && data.pendingGroups.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
            <h2 className="text-lg font-semibold text-yellow-900 mb-4">
              ⏳ Groups Pending Submission ({data.pendingGroups.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.pendingGroups.map((group) => (
                <div
                  key={group.groupNumber}
                  className="bg-white rounded-lg p-4 border border-yellow-300"
                >
                  <p className="font-semibold text-gray-900 mb-2">
                    Group {group.groupNumber}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    {group.students.length} member(s)
                  </p>
                  <div className="text-xs text-gray-500">
                    {group.students.map((s) => s.fullName).join(", ")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Grading Modal */}
      {showGradeModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Grade Group {selectedSubmission.groupNumber}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                This score will be applied to all{" "}
                {selectedSubmission.students.length} group members
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Score*
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={gradeForm.score}
                  onChange={(e) =>
                    setGradeForm({ ...gradeForm, score: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter score"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback (Optional)
                </label>
                <textarea
                  value={gradeForm.feedback}
                  onChange={(e) =>
                    setGradeForm({ ...gradeForm, feedback: e.target.value })
                  }
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Enter feedback for the group..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleGradeSubmit}
                  disabled={gradeMutation.isPending}
                  className="flex-1 px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {gradeMutation.isPending ? "Saving..." : "Save Grade"}
                </button>
                <button
                  onClick={closeModal}
                  disabled={gradeMutation.isPending}
                  className="px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
