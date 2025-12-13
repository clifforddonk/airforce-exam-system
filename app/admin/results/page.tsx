"use client";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/useAuth";
import Link from "next/link";
import { Download, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface StudentResult {
  userId: string;
  fullName: string;
  email: string;
  group?: string;
  topic1?: number;
  topic2?: number;
  topic3?: number;
  topic4?: number;
  groupScore?: number;
  total: number;
}

export default function StudentResultsPage() {
  const { data: user, isLoading } = useCurrentUser();
  const [results, setResults] = useState<StudentResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ✅ Fetch student submissions with React Query caching
  const {
    data: studentData,
    isLoading: studentLoading,
    isError: studentError,
  } = useQuery({
    queryKey: ["admin-submissions"],
    queryFn: async () => {
      const response = await fetch("/api/admin/submissions");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch student results");
      }
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // ✅ Cache for 10 minutes
    gcTime: 30 * 60 * 1000, // ✅ Keep in cache for 30 minutes
    refetchOnMount: false,
  });

  // ✅ Fetch group submissions with React Query caching
  const { data: groupData, isLoading: groupLoading } = useQuery({
    queryKey: ["admin-group-submissions"],
    queryFn: async () => {
      const response = await fetch("/api/admin/submissions/groups");
      if (!response.ok) throw new Error("Failed to fetch group submissions");
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // ✅ Cache for 10 minutes
    gcTime: 30 * 60 * 1000, // ✅ Keep in cache for 30 minutes
    refetchOnMount: false,
  });

  // ✅ Merge results when data is available (only when queries finish loading)
  useEffect(() => {
    if (!studentLoading && !groupLoading) {
      if (studentData && groupData) {
        try {
          // Create a map of group numbers to scores
          const groupScoresMap = new Map<number, number>();
          groupData.submissions?.forEach((submission: any) => {
            if (submission.score !== null) {
              groupScoresMap.set(submission.groupNumber, submission.score);
            }
          });

          // Merge group scores with student results
          const mergedResults = studentData.map((student: StudentResult) => {
            const groupSubmissionScore = student.group
              ? groupScoresMap.get(parseInt(student.group))
              : undefined;

            // Calculate total as sum of all topics and group score
            const scores = [
              student.topic1,
              student.topic2,
              student.topic3,
              student.topic4,
              groupSubmissionScore,
            ].filter((score): score is number => score !== undefined);

            const total = scores.reduce((sum, score) => sum + score, 0);

            return {
              ...student,
              groupScore: groupSubmissionScore,
              total,
            };
          });

          setResults(mergedResults);
          setError(null);
        } catch (err) {
          console.error("Error merging results:", err);
          setError("Failed to merge results");
        }
      } else if (studentData && !groupData) {
        // Fallback to just student data if group data fails
        setResults(studentData);
        setError(null);
      } else if (studentError) {
        setError("Failed to load student results");
      }
    }
  }, [studentLoading, groupLoading, studentData, groupData, studentError]);

  if (isLoading || studentLoading || groupLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <Link href="/admin">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
              Back to Dashboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const downloadCSV = () => {
    const headers = [
      "Student Name",
      "Email",
      "Group",
      "Topic 1",
      "Topic 2",
      "Topic 3",
      "Group Score",
      "Total",
    ];

    const rows = results.map((result: any) => [
      `"${result.fullName}"`,
      result.email,
      result.group || "-",
      result.topic1 !== undefined ? result.topic1 : "-",
      result.topic2 !== undefined ? result.topic2 : "-",
      result.topic3 !== undefined ? result.topic3 : "-",
      result.groupScore !== undefined ? result.groupScore : "-",
      result.total,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row: any) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `student-results-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const ScoreBadge = ({ score }: { score?: number }) => {
    if (score === undefined) {
      return <span className="text-gray-500">-</span>;
    }

    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
        {score}
      </span>
    );
  };

  const TotalBadge = ({ total }: { total: number }) => {
    return (
      <span
        className={`inline-flex items-center px-4 py-1 rounded-full text-sm font-bold ${
          total >= 80
            ? "bg-green-100 text-green-800"
            : total >= 60
            ? "bg-yellow-100 text-yellow-800"
            : "bg-red-100 text-red-800"
        }`}
      >
        {total}
      </span>
    );
  };

  return (
    <div className="w-full p-4 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              View all student results and performance
            </p>
          </div>
        </div>
        <button
          onClick={downloadCSV}
          disabled={results.length === 0}
          className="flex items-center gap-2 bg-[#0f172a] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#1e293b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-5 h-5" />
          Export CSV
        </button>
      </div>

      {/* Title Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">
          All Student Results
        </h2>
        <p className="text-gray-600">Total Students: {results.length}</p>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {results.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              No student results available yet
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">
                    Student Name
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">
                    Email
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">
                    Group
                  </th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-700">
                    Topic 1
                  </th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-700">
                    Topic 2
                  </th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-700">
                    Topic 3
                  </th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-700">
                    Topic 4
                  </th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-700">
                    Group Score
                  </th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-700">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr
                    key={result.userId}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-6 text-gray-800 font-medium">
                      {result.fullName}
                    </td>
                    <td className="py-4 px-6 text-gray-600 text-sm">
                      {result.email}
                    </td>
                    <td className="py-4 px-6 text-gray-700">
                      {result.group || "-"}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <ScoreBadge score={result.topic1} />
                    </td>
                    <td className="py-4 px-6 text-center">
                      <ScoreBadge score={result.topic2} />
                    </td>
                    <td className="py-4 px-6 text-center">
                      <ScoreBadge score={result.topic3} />
                    </td>
                    <td className="py-4 px-6 text-center">
                      <ScoreBadge score={result.topic4} />
                    </td>
                    <td className="py-4 px-6 text-center">
                      <ScoreBadge score={result.groupScore} />
                    </td>
                    <td className="py-4 px-6 text-center">
                      <TotalBadge total={result.total} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
