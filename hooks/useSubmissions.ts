import { useQuery } from "@tanstack/react-query";

export interface Submission {
  _id: string;
  userId: string;
  topicId: string;
  topicName: string;
  answers: { [questionId: string]: number };
  score: number;
  totalQuestions: number;
  percentage: number;
  timeSpent: number;
  createdAt: string;
  updatedAt: string;
}

export const useSubmissions = () => {
  return useQuery<Submission[]>({
    queryKey: ["submissions"],
    queryFn: async () => {
      const response = await fetch("/api/submissions");
      if (!response.ok) throw new Error("Failed to fetch submissions");
      return response.json();
    },
    staleTime: 0, // Always consider data stale, refetch on mount
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: true, // Always refetch when component mounts
  });
};
