"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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

export const useSubmissionsWithRefetch = () => {
  const queryClient = useQueryClient();
  const hasCheckedRef = useRef(false);

  // ✅ Use useLayoutEffect to check flag BEFORE render (synchronous)
  useLayoutEffect(() => {
    const justSubmitted = localStorage.getItem("quiz_just_submitted");
    if (justSubmitted === "true" && !hasCheckedRef.current) {
      console.log(
        "🔄 Quiz submitted flag detected - clearing cache and refetching..."
      );
      hasCheckedRef.current = true;

      // Clear the flag immediately
      localStorage.removeItem("quiz_just_submitted");

      // Invalidate AND refetch
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      queryClient.refetchQueries({ queryKey: ["submissions"] });

      console.log("✅ Cache cleared, refetch triggered, flag cleared");
    }
  }, [queryClient]);

  const query = useQuery<Submission[]>({
    queryKey: ["submissions"],
    queryFn: async () => {
      const response = await fetch("/api/submissions");
      if (!response.ok) throw new Error("Failed to fetch submissions");
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // ✅ Data fresh for 5 minutes after initial fetch
    gcTime: 15 * 60 * 1000, // ✅ Garbage collect after 15 minutes
    refetchOnMount: false, // ✅ Don't refetch on mount
    refetchOnWindowFocus: true, // ✅ Refetch when user returns to tab
  });

  return query;
};
