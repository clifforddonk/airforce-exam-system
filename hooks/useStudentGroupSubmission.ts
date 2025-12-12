// hooks/useStudentGroupSubmission.ts
import { useQuery } from "@tanstack/react-query";

export interface GroupSubmission {
  _id: string;
  groupNumber: number;
  students: string[]; // Array of student IDs
  submissionId: {
    _id: string;
    fileName: string;
    fileUrl: string;
    uploadedAt: string;
    uploadedBy: {
      fullName: string;
      email: string;
    };
  } | null;
  score: number | null;
  feedback?: string;
  locked: boolean;
  createdAt: string;
  updatedAt: string;
}

// Fetch the student's own group submission
const fetchStudentGroupSubmission =
  async (): Promise<GroupSubmission | null> => {
    const res = await fetch("/api/submissions/group");

    if (!res.ok) {
      if (res.status === 404) {
        // No group submission yet
        return null;
      }
      throw new Error("Failed to fetch group submission");
    }

    return res.json();
  };

// Hook for students to fetch their own group submission
export const useStudentGroupSubmission = () => {
  return useQuery({
    queryKey: ["student-group-submission"],
    queryFn: fetchStudentGroupSubmission,
    staleTime: 5 * 60 * 1000, // ✅ Data fresh for 5 minutes
    gcTime: 15 * 60 * 1000, // ✅ Garbage collect after 15 minutes
    refetchOnMount: false, // ✅ Don't refetch on mount
    refetchOnWindowFocus: true, // ✅ Refetch when user returns to tab
    retry: false, // Don't retry on 404
  });
};
