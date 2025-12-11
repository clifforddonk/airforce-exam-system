// app/dashboard/review/page.tsx
"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface ReviewData {
  answers: { [key: string]: number };
  questions: Array<{
    _id: string;
    question: string;
    options: string[];
    correctAnswer: number;
  }>;
  score: number;
  percentage: number;
}

export default function ReviewPage() {
  const searchParams = useSearchParams();
  const topicId = searchParams.get("topic");
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [storedData, setStoredData] = useState<ReviewData | null>(null);

  // ✅ Load stored data once on mount
  useEffect(() => {
    if (topicId) {
      const stored = localStorage.getItem(`quiz_answers_${topicId}`);
      if (stored) {
        setStoredData(JSON.parse(stored));
      }
    }
  }, [topicId]);

  // ✅ Use React Query to cache questions with correct answers
  const { data: questionsWithAnswers, isLoading } = useQuery({
    queryKey: ["review-questions", topicId],
    queryFn: async () => {
      if (!topicId) return null;
      const res = await fetch(`/api/questions/review?category=${topicId}`);
      if (!res.ok) throw new Error("Failed to fetch review questions");
      return res.json();
    },
    enabled: !!topicId && !!storedData,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
  });

  // ✅ Merge stored data with fresh questions only when both are available
  useEffect(() => {
    if (storedData && questionsWithAnswers) {
      setReviewData({
        ...storedData,
        questions: questionsWithAnswers,
      });
    } else if (storedData && !isLoading && !questionsWithAnswers) {
      // Fallback to stored data if API fails
      setReviewData(storedData);
    }
  }, [
    storedData?.score,
    storedData?.percentage,
    questionsWithAnswers,
    isLoading,
  ]);

  if (!topicId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Topic not found
          </h1>
          <Link href="/dashboard">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg">
              Return to Dashboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading || !storedData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!reviewData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            No quiz data found
          </h1>
          <Link href="/dashboard">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg">
              Return to Dashboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Review Answers
              </h1>
              <p className="text-gray-600 mt-1">
                Score: {reviewData.score} | {reviewData.percentage}%
              </p>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {reviewData.questions.map((question, idx) => {
            const userAnswerIndex = reviewData.answers[question._id];
            const isCorrect = userAnswerIndex === question.correctAnswer;

            console.log(
              `Q${idx + 1}: userAnswer=${userAnswerIndex}, correct=${
                question.correctAnswer
              }, match=${isCorrect}`
            );

            return (
              <div
                key={question._id}
                className={`bg-white rounded-lg shadow p-6 border-l-4 ${
                  isCorrect ? "border-l-green-500" : "border-l-red-500"
                }`}
              >
                {/* Question Header */}
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Question {idx + 1}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isCorrect
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {isCorrect ? "✓ Correct" : "✗ Incorrect"}
                  </span>
                </div>

                {/* Question Text */}
                <p className="text-gray-800 font-medium mb-6">
                  {question.question}
                </p>

                {/* Options */}
                <div className="space-y-3">
                  {question.options.map((option, optIdx) => {
                    const isUserSelectedThisOption = userAnswerIndex === optIdx;
                    const isCorrectOption = question.correctAnswer === optIdx;

                    let bgColor = "bg-gray-50";
                    let borderColor = "border-gray-200";
                    let textColor = "text-gray-700";

                    // Correct answer (always green)
                    if (isCorrectOption) {
                      bgColor = "bg-green-50";
                      borderColor = "border-green-300";
                      textColor = "text-green-800";
                    }
                    // User's wrong answer (red)
                    else if (isUserSelectedThisOption && !isCorrect) {
                      bgColor = "bg-red-50";
                      borderColor = "border-red-300";
                      textColor = "text-red-800";
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-4 rounded-lg border-2 ${bgColor} ${borderColor} ${textColor}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="font-bold mt-0.5">
                            {String.fromCharCode(65 + optIdx)}.
                          </span>
                          <span className="flex-1">{option}</span>
                          <div className="flex gap-2 text-sm font-semibold whitespace-nowrap">
                            {isUserSelectedThisOption && (
                              <span>📌 Your answer</span>
                            )}
                            {isCorrectOption && <span>✓ Correct</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-center">
          <Link href="/dashboard">
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium">
              Back to Dashboard
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
