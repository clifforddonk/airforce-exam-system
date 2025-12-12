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
    staleTime: 5 * 60 * 1000, // ✅ Data fresh for 5 minutes
    gcTime: 15 * 60 * 1000, // ✅ Garbage collect after 15 minutes
    refetchOnMount: false, // ✅ Don't refetch on mount (reuse cache)
    refetchOnWindowFocus: true, // ✅ Refetch when user returns to tab
  });
};
