// hooks/useGroupSubmissions.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types
export interface GroupSubmission {
  id: string;
  groupNumber: number;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  uploadedBy: {
    fullName: string;
    email: string;
  };
  score: number | null;
  feedback: string | null;
  gradedAt: string | null;
  gradedBy: {
    fullName: string;
    email: string;
  } | null;
  students: Array<{
    _id: string;
    fullName: string;
    email: string;
  }>;
}

export interface PendingGroup {
  groupNumber: number;
  students: Array<{
    _id: string;
    fullName: string;
    email: string;
  }>;
  locked: boolean;
}

export interface SubmissionsResponse {
  submissions: GroupSubmission[];
  pendingGroups: PendingGroup[];
  stats: {
    total: number;
    graded: number;
    ungraded: number;
    pending: number;
  };
}

export interface GradePayload {
  score: number;
  feedback?: string;
}

// API Functions
const fetchGroupSubmissions = async (
  graded?: boolean,
  groupNumber?: number
): Promise<SubmissionsResponse> => {
  const params = new URLSearchParams();
  if (graded !== undefined) params.append('graded', graded.toString());
  if (groupNumber) params.append('groupNumber', groupNumber.toString());

  const res = await fetch(`/api/admin/submissions/groups?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch submissions');
  return res.json();
};

const gradeSubmission = async (id: string, data: GradePayload) => {
  const res = await fetch(`/api/admin/submissions/${id}/grade`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to grade submission');
  return res.json();
};

// Hooks
export const useGroupSubmissions = (graded?: boolean, groupNumber?: number) => {
  return useQuery({
    queryKey: ['group-submissions', graded, groupNumber],
    queryFn: () => fetchGroupSubmissions(graded, groupNumber),
  });
};

export const useGradeSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: GradePayload }) =>
      gradeSubmission(id, data),
    onSuccess: () => {
      // Invalidate all submission queries to refetch
      queryClient.invalidateQueries({ queryKey: ['group-submissions'] });
    },
  });
};