"use client";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

interface Question {
  _id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
}

const TOPICS = [
  { id: "topic1", label: "Topic 1 – Airforce History & Protocol" },
  { id: "topic2", label: "Topic 2 – Aircraft Systems" },
  { id: "topic3", label: "Topic 3 – Flight Operations" },
];

export default function QuizPage() {
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const topicParam = searchParams.get("topic");

  const [selectedTopic, setSelectedTopic] = useState<(typeof TOPICS)[0] | null>(
    null
  );
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<{ [key: string]: number }>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [scoreData, setScoreData] = useState<{
    score: string;
    percentage: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Set topic from URL params on mount
  useEffect(() => {
    if (topicParam) {
      const topic = TOPICS.find((t) => t.id === topicParam);
      if (topic) {
        setSelectedTopic(topic);
      }
    }
  }, [topicParam]);

  // Fetch questions when topic is selected
  useEffect(() => {
    if (selectedTopic) {
      setLoading(true);
      fetch(`/api/questions?category=${selectedTopic.id}`)
        .then((res) => res.json())
        .then((data) => {
          setQuestions(data);
          setTimeLeft(600); // 10 minutes
          setUserAnswers({});
          setCurrentQuestionIndex(0);
          setQuizCompleted(false);
          setScoreData(null);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching questions:", error);
          setLoading(false);
        });
    }
  }, [selectedTopic]);

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (selectedTopic && timeLeft > 0 && !quizCompleted) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && !quizCompleted && selectedTopic) {
      handleSubmit();
    }
    return () => clearTimeout(timer);
  }, [timeLeft, quizCompleted, selectedTopic]);

  const handleSelect = (questionId: string, selectedIndex: number) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: selectedIndex }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user || !selectedTopic) return;

    let correctAnswers = 0;

    // Calculate correct answers
    questions.forEach((question) => {
      if (userAnswers[question._id] === question.correctAnswer) {
        correctAnswers += 1;
      }
    });

    const totalQuestions = questions.length;
    const finalScore = `${correctAnswers}/${totalQuestions}`;
    const percentageScore = Math.round((correctAnswers / totalQuestions) * 100);

    // Submit to backend
    setSubmitting(true);
    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          topicId: selectedTopic.id,
          topicName: selectedTopic.label,
          answers: userAnswers,
          score: correctAnswers,
          totalQuestions: totalQuestions,
          percentage: percentageScore,
          timeSpent: 600 - timeLeft,
        }),
      });

      if (response.ok) {
        setScoreData({ score: finalScore, percentage: percentageScore });
        setQuizCompleted(true);
        // Invalidate submissions query so dashboard updates immediately
        await queryClient.invalidateQueries({ queryKey: ["submissions"] });
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      alert("Failed to submit quiz. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const startNewQuiz = () => {
    setSelectedTopic(null);
    setQuizCompleted(false);
    setShowReview(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const renderReviewAnswers = () => {
    return (
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Review Answers
        </h2>
        {questions.map((question, index) => (
          <div key={question._id} className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Question {index + 1}: {question.question}
            </h3>
            <div className="space-y-3">
              {question.options.map((option, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border-2 ${
                    userAnswers[question._id] === i &&
                    question.correctAnswer !== i
                      ? "border-red-500 bg-red-50"
                      : userAnswers[question._id] === i
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  } ${
                    question.correctAnswer === i
                      ? "border-green-500 bg-green-50"
                      : ""
                  }`}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-6 h-6 flex items-center justify-center rounded-full border-2 mr-3 ${
                        userAnswers[question._id] === i &&
                        question.correctAnswer !== i
                          ? "border-red-500 bg-red-500 text-white"
                          : userAnswers[question._id] === i
                          ? "border-blue-500 bg-blue-500 text-white"
                          : question.correctAnswer === i
                          ? "border-green-500 bg-green-500 text-white"
                          : "border-gray-300"
                      }`}
                    >
                      {userAnswers[question._id] === i &&
                      question.correctAnswer !== i ? (
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : question.correctAnswer === i ? (
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : null}
                    </div>
                    <span className="text-gray-800">{option}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Show loading while fetching user
  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If no topic in URL, redirect to dashboard
  if (!selectedTopic && !loading) {
    return (
      <div className="p-4 lg:p-8 text-center">
        <p className="text-gray-600 mb-4">No quiz selected</p>
        <button
          onClick={async () => {
            await queryClient.invalidateQueries({ queryKey: ["submissions"] });
            router.push("/dashboard");
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz questions...</p>
        </div>
      </div>
    );
  }

  // Quiz completed screen
  if (quizCompleted && scoreData) {
    const correctAnswers = parseInt(scoreData.score.split("/")[0], 10);
    let performanceMessage = "";

    if (correctAnswers >= Math.ceil(questions.length * 0.8)) {
      performanceMessage = "Excellent work! You've mastered this topic.";
    } else if (correctAnswers >= Math.ceil(questions.length * 0.6)) {
      performanceMessage = "Good job! You're on the right track.";
    } else {
      performanceMessage = "Keep practicing! You'll improve next time.";
    }

    return (
      <div className="p-4 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="h-2 bg-blue-600"></div>
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">
                Quiz Completed!
              </h2>

              <div className="mb-8">
                <div className="inline-block p-6 rounded-full bg-blue-50 mb-4">
                  <div className="text-5xl font-bold text-blue-600">
                    {scoreData.percentage}%
                  </div>
                  <div className="text-lg text-gray-600 mt-2">
                    {scoreData.score}
                  </div>
                </div>
                <p className="text-gray-600 text-lg">{performanceMessage}</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg mb-8">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Quiz Summary
                </h3>
                <p className="text-gray-700">Quiz: {selectedTopic?.label}</p>
                <p className="text-gray-700">
                  Questions Answered: {Object.keys(userAnswers).length} of{" "}
                  {questions.length}
                </p>
              </div>

              <div className="flex flex-col space-y-3">
                <button
                  className="border border-gray-300 hover:bg-gray-100 text-gray-700 py-2 px-6 rounded-lg transition"
                  onClick={async () => {
                    await queryClient.invalidateQueries({
                      queryKey: ["submissions"],
                    });
                    router.push("/dashboard");
                  }}
                >
                  Return to Dashboard
                </button>
                <button
                  className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg transition"
                  onClick={() => setShowReview(true)}
                >
                  Review Answers
                </button>
              </div>

              {showReview && renderReviewAnswers()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz taking screen
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {selectedTopic?.label}
          </h1>
          <div className="flex items-center gap-4">
            <div
              className={`font-medium ${
                timeLeft < 60 ? "text-red-600" : "text-gray-700"
              }`}
            >
              Time Left: {formatTime(timeLeft)}
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Exit Quiz
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="h-2 bg-blue-600"></div>
          <div className="p-6">
            <div className="flex justify-between mb-4">
              <span className="text-sm text-gray-500">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="text-sm font-medium text-blue-600">
                {Object.keys(userAnswers).length} of {questions.length} answered
              </span>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {currentQuestion?.question}
              </h2>

              <div className="space-y-3">
                {currentQuestion?.options.map((option, i) => (
                  <div
                    key={i}
                    onClick={() => handleSelect(currentQuestion._id, i)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition ${
                      userAnswers[currentQuestion._id] === i
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-6 h-6 flex items-center justify-center rounded-full border-2 mr-3 ${
                          userAnswers[currentQuestion._id] === i
                            ? "border-blue-500 bg-blue-500 text-white"
                            : "border-gray-300"
                        }`}
                      >
                        {userAnswers[currentQuestion._id] === i && (
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <span className="text-gray-800">{option}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className={`py-2 px-4 rounded-lg ${
                  currentQuestionIndex === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Previous
              </button>

              {currentQuestionIndex < questions.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Quiz"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Question Navigation */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-center items-center gap-2 flex-wrap">
            {questions.map((q, index) => (
              <button
                key={q._id}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  userAnswers[q._id] !== undefined
                    ? "bg-blue-600 text-white"
                    : index === currentQuestionIndex
                    ? "bg-blue-100 text-blue-800 border-2 border-blue-600"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
