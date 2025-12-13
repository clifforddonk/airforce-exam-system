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
  Save,
  ExternalLink,
} from "lucide-react";

type SortField = "group" | "score" | "status";
type SortOrder = "asc" | "desc";

export default function AdminGradingPage() {
  const [filterGraded, setFilterGraded] = useState<boolean | undefined>(
    undefined
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("status");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [editingScores, setEditingScores] = useState<Record<string, string>>(
    {}
  );

  const itemsPerPage = 50;

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

    gradeMutation.mutate(
      {
        id: submission.id,
        data: { score, feedback: undefined },
      },
      {
        onSuccess: () => {
          // Clear editing state
          setEditingScores((prev: any) => {
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

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? "↑" : "↓";
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
                placeholder="Search by group or uploader..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setFilterGraded(undefined);
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
                    className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      Group
                      <span>
                        {sortField === "group" ? (
                          <SortIcon field="group" />
                        ) : (
                          ""
                        )}
                      </span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Uploaded By
                  </th>
                  <th
                    onClick={() => handleSort("score")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      Score
                      <span>
                        {sortField === "score" ? (
                          <SortIcon field="score" />
                        ) : (
                          ""
                        )}
                      </span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSubmissions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>No submissions found</p>
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((submission: any) => {
                    const currentScore =
                      editingScores[submission.id] ??
                      submission.score?.toString() ??
                      "";
                    const hasChanges =
                      editingScores[submission.id] !== undefined;

                    return (
                      <tr key={submission.id} className="hover:bg-gray-50">
                        {/* Group */}
                        <td className="px-6 py-3 whitespace-nowrap font-medium text-gray-900">
                          Group {submission.groupNumber}
                        </td>

                        {/* Uploaded By */}
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">
                          {submission.uploadedBy.fullName}
                        </td>

                        {/* Score */}
                        <td className="px-6 py-3 text-gray-700 whitespace-nowrap">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={currentScore}
                            onChange={(e) =>
                              setEditingScores((prev: any) => ({
                                ...prev,
                                [submission.id]: e.target.value,
                              }))
                            }
                            placeholder="0-100"
                            className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <a
                              href={submission.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 transition text-xs font-medium flex items-center gap-1"
                              title="View PDF"
                            >
                              <ExternalLink className="w-4 h-4" />
                              View submission
                            </a>
                            <button
                              onClick={() => handleGradeSubmit(submission)}
                              disabled={gradeMutation.isPending}
                              className={`transition text-xs font-medium flex items-center gap-1 ${
                                hasChanges
                                  ? "text-green-600 hover:text-green-800"
                                  : "text-gray-400 cursor-not-allowed"
                              }`}
                              title="Save Grade"
                            >
                              <Save className="w-4 h-4" />
                              Save Score
                            </button>
                            {/* {submission.score !== null && (
                              <span className="text-green-600 text-xs font-medium flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" />
                              </span>
                            )}
                            {submission.score === null && (
                              <span className="text-orange-600 text-xs font-medium flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                              </span>
                            )} */}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
