"use client";

import { useState, useMemo } from "react";
import {
  useGroupSubmissions,
  useGradeSubmission,
  type GroupSubmission,
} from "@/hooks/useGroupSubmission";
import {
  Search,
  Download,
  FileText,
  CheckCircle,
  Clock,
  ChevronUp,
  ChevronDown,
  Save,
  ExternalLink,
} from "lucide-react";

type SortField = "group" | "date" | "score" | "status";
type SortOrder = "asc" | "desc";

export default function AdminGradingPage() {
  const [filterGraded, setFilterGraded] = useState<boolean | undefined>(
    undefined
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingScores, setEditingScores] = useState<Record<string, string>>(
    {}
  );
  const [editingFeedback, setEditingFeedback] = useState<
    Record<string, string>
  >({});
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const itemsPerPage = 20;

  // Fetch submissions
  const { data, isLoading, error } = useGroupSubmissions(filterGraded);
  const gradeMutation = useGradeSubmission();

  // Filter and sort submissions
  const filteredSubmissions = useMemo(() => {
    if (!data?.submissions) return [];

    let filtered = data.submissions;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (sub) =>
          sub.groupNumber.toString().includes(query) ||
          sub.fileName.toLowerCase().includes(query) ||
          sub.uploadedBy.fullName.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "group":
          comparison = a.groupNumber - b.groupNumber;
          break;
        case "date":
          comparison =
            new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
          break;
        case "score":
          const aScore = a.score ?? -1;
          const bScore = b.score ?? -1;
          comparison = aScore - bScore;
          break;
        case "status":
          comparison = (a.score !== null ? 1 : 0) - (b.score !== null ? 1 : 0);
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [data?.submissions, searchQuery, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
  const paginatedSubmissions = filteredSubmissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Handle grade submission
  const handleGradeSubmit = (submission: GroupSubmission) => {
    const scoreStr =
      editingScores[submission.id] ?? submission.score?.toString() ?? "";
    const score = parseFloat(scoreStr);

    if (isNaN(score) || score < 0 || score > 100) {
      alert("Please enter a valid score between 0 and 100");
      return;
    }

    const feedback = editingFeedback[submission.id]?.trim() || undefined;

    gradeMutation.mutate(
      {
        id: submission.id,
        data: { score, feedback },
      },
      {
        onSuccess: () => {
          // Clear editing state
          setEditingScores((prev) => {
            const next = { ...prev };
            delete next[submission.id];
            return next;
          });
          setEditingFeedback((prev) => {
            const next = { ...prev };
            delete next[submission.id];
            return next;
          });
        },
        onError: (error) => {
          alert(`Failed to grade: ${error.message}`);
        },
      }
    );
  };

  // Toggle row expansion
  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!data?.submissions) return;

    const headers = [
      "Group",
      "File Name",
      "Uploaded By",
      "Date",
      "Score",
      "Feedback",
    ];
    const rows = data.submissions.map((sub) => [
      sub.groupNumber,
      sub.fileName,
      sub.uploadedBy.fullName,
      new Date(sub.uploadedAt).toLocaleDateString(),
      sub.score ?? "Not Graded",
      sub.feedback ?? "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `group-submissions-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
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
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Group Submissions
            </h1>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
          <p className="text-gray-600">
            Review and grade PDF submissions from student groups
          </p>
        </div>

        {/* Stats Cards */}
        {data && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-xs text-gray-600 mb-1">Total</p>
              <p className="text-2xl font-bold text-blue-600">
                {data.stats.total}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-xs text-gray-600 mb-1">Graded</p>
              <p className="text-2xl font-bold text-green-600">
                {data.stats.graded}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-xs text-gray-600 mb-1">Ungraded</p>
              <p className="text-2xl font-bold text-orange-600">
                {data.stats.ungraded}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-xs text-gray-600 mb-1">Pending</p>
              <p className="text-2xl font-bold text-gray-600">
                {data.stats.pending}
              </p>
            </div>
          </div>
        )}

        {/* Filters & Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by group, file name, or uploader..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setFilterGraded(undefined);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                  filterGraded === undefined
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => {
                  setFilterGraded(false);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                  filterGraded === false
                    ? "bg-orange-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Ungraded
              </button>
              <button
                onClick={() => {
                  setFilterGraded(true);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                  filterGraded === true
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Graded
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th
                    onClick={() => handleSort("group")}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-1">
                      Group
                      <SortIcon field="group" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    File Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Uploaded By
                  </th>
                  <th
                    onClick={() => handleSort("date")}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-1">
                      Date
                      <SortIcon field="date" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("score")}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-1">
                      Score
                      <SortIcon field="score" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedSubmissions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-gray-500"
                    >
                      <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>No submissions found</p>
                    </td>
                  </tr>
                ) : (
                  paginatedSubmissions.map((submission) => {
                    const isExpanded = expandedRows.has(submission.id);
                    const currentScore =
                      editingScores[submission.id] ??
                      submission.score?.toString() ??
                      "";
                    const currentFeedback =
                      editingFeedback[submission.id] ??
                      submission.feedback ??
                      "";
                    const hasChanges =
                      editingScores[submission.id] !== undefined ||
                      editingFeedback[submission.id] !== undefined;

                    return (
                      <>
                        <tr key={submission.id} className="hover:bg-gray-50">
                          {/* Group */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              onClick={() => toggleRow(submission.id)}
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronUp className="w-4 h-4" />
                              )}
                              Group {submission.groupNumber}
                            </button>
                          </td>

                          {/* File Name */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-900 truncate max-w-xs">
                                {submission.fileName}
                              </span>
                            </div>
                          </td>

                          {/* Uploaded By */}
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {submission.uploadedBy.fullName}
                          </td>

                          {/* Date */}
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {new Date(
                              submission.uploadedAt
                            ).toLocaleDateString()}
                          </td>

                          {/* Score */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={currentScore}
                              onChange={(e) =>
                                setEditingScores((prev) => ({
                                  ...prev,
                                  [submission.id]: e.target.value,
                                }))
                              }
                              placeholder="0-100"
                              className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <a
                                href={submission.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                                title="View PDF"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                              <button
                                onClick={() => handleGradeSubmit(submission)}
                                disabled={gradeMutation.isPending}
                                className={`p-2 rounded transition ${
                                  hasChanges
                                    ? "text-green-600 hover:bg-green-50"
                                    : "text-gray-400 hover:bg-gray-50"
                                }`}
                                title="Save Grade"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              {submission.score !== null && (
                                <CheckCircle
                                  className="w-4 h-4 text-green-600"
                                  title="Graded"
                                />
                              )}
                              {submission.score === null && (
                                <Clock
                                  className="w-4 h-4 text-orange-600"
                                  title="Pending"
                                />
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Row */}
                        {isExpanded && (
                          <tr className="bg-gray-50">
                            <td colSpan={6} className="px-4 py-4">
                              <div className="space-y-3">
                                {/* Feedback */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Feedback
                                  </label>
                                  <textarea
                                    value={currentFeedback}
                                    onChange={(e) =>
                                      setEditingFeedback((prev) => ({
                                        ...prev,
                                        [submission.id]: e.target.value,
                                      }))
                                    }
                                    rows={2}
                                    placeholder="Enter feedback for the group..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                                  />
                                </div>

                                {/* Group Members */}
                                <div>
                                  <p className="text-xs font-medium text-gray-700 mb-1">
                                    Group Members ({submission.students.length}
                                    ):
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {submission.students.map((student) => (
                                      <span
                                        key={student._id}
                                        className="px-2 py-1 bg-white border border-gray-200 text-gray-700 rounded text-xs"
                                      >
                                        {student.fullName}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(
                  currentPage * itemsPerPage,
                  filteredSubmissions.length
                )}{" "}
                of {filteredSubmissions.length} results
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 border rounded text-sm ${
                        currentPage === page
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
