"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Question {
  _id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
}

interface QuizSession {
  topicId: string;
  startTime: number;
  answers: { [key: string]: number };
  currentQuestionIndex: number;
}

const TOPICS = [
  { id: "topic1", label: "Topic 1 – Airforce History & Protocol" },
  { id: "topic2", label: "Topic 2 – Aircraft Systems" },
  { id: "topic3", label: "Topic 3 – Flight Operations" },
];

const QUIZ_DURATION = 600; // 10 minutes in seconds

export default function SecureQuizPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [quizLocked, setQuizLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState("");

  // Check if quiz is already completed
  useEffect(() => {
    const checkCompletion = () => {
      if (!topicParam) return;

      try {
        const completed = localStorage.getItem(`quiz_completed_${topicParam}`);
        if (completed === "true") {
          setQuizLocked(true);
          setLockMessage("You have already completed this quiz.");
          setLoading(false);
          return;
        }
      } catch (error) {
        console.log("No completion record found");
      }

      const topic = TOPICS.find((t) => t.id === topicParam);
      if (topic) {
        setSelectedTopic(topic);
        loadOrStartQuiz(topic);
      }
    };

    checkCompletion();
  }, [topicParam]);

  // Load existing session or start new quiz
  const loadOrStartQuiz = async (topic: (typeof TOPICS)[0]) => {
    setLoading(true);

    try {
      // Check for existing session
      const sessionData = localStorage.getItem(`quiz_session_${topic.id}`);

      if (sessionData) {
        const session: QuizSession = JSON.parse(sessionData);

        // Fetch questions
        const res = await fetch(`/api/questions?category=${topic.id}`);
        const data = await res.json();
        setQuestions(data);

        // Restore session
        setUserAnswers(session.answers);
        setCurrentQuestionIndex(session.currentQuestionIndex);

        // Calculate remaining time
        const elapsed = Math.floor((Date.now() - session.startTime) / 1000);
        const remaining = Math.max(0, QUIZ_DURATION - elapsed);
        setTimeLeft(remaining);

        if (remaining === 0) {
          // Time's up, auto-submit
          handleSubmit(data, session.answers);
        }
      } else {
        // Start new quiz
        const res = await fetch(`/api/questions?category=${topic.id}`);
        const data = await res.json();
        setQuestions(data);

        const newSession: QuizSession = {
          topicId: topic.id,
          startTime: Date.now(),
          answers: {},
          currentQuestionIndex: 0,
        };

        localStorage.setItem(
          `quiz_session_${topic.id}`,
          JSON.stringify(newSession)
        );
        setTimeLeft(QUIZ_DURATION);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading quiz:", error);
      setLoading(false);
    }
  };

  // Save session whenever answers or current question changes
  useEffect(() => {
    if (selectedTopic && !quizCompleted) {
      const saveSession = () => {
        try {
          const sessionData = localStorage.getItem(
            `quiz_session_${selectedTopic.id}`
          );
          if (sessionData) {
            const session: QuizSession = JSON.parse(sessionData);
            session.answers = userAnswers;
            session.currentQuestionIndex = currentQuestionIndex;
            localStorage.setItem(
              `quiz_session_${selectedTopic.id}`,
              JSON.stringify(session)
            );
          }
        } catch (error) {
          console.error("Error saving session:", error);
        }
      };
      saveSession();
    }
  }, [userAnswers, currentQuestionIndex, selectedTopic, quizCompleted]);

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (selectedTopic && timeLeft > 0 && !quizCompleted) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (
      timeLeft === 0 &&
      !quizCompleted &&
      selectedTopic &&
      questions.length > 0
    ) {
      handleSubmit();
    }
    return () => clearTimeout(timer);
  }, [timeLeft, quizCompleted, selectedTopic]);

  // Tab visibility detection
  useEffect(() => {
    if (!quizCompleted && selectedTopic) {
      const handleVisibilityChange = () => {
        if (document.hidden) {
          setTabSwitchCount((prev) => prev + 1);
          setShowTabWarning(true);
          setTimeout(() => setShowTabWarning(false), 3000);
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () =>
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
    }
  }, [quizCompleted, selectedTopic]);

  // Browser close warning
  useEffect(() => {
    if (!quizCompleted && selectedTopic) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = "";
        return "";
      };

      window.addEventListener("beforeunload", handleBeforeUnload);
      return () =>
        window.removeEventListener("beforeunload", handleBeforeUnload);
    }
  }, [quizCompleted, selectedTopic]);

  // Disable copy/paste
  useEffect(() => {
    const preventCopy = (e: Event) => e.preventDefault();
    const preventContextMenu = (e: Event) => e.preventDefault();

    if (!quizCompleted && selectedTopic) {
      document.addEventListener("copy", preventCopy);
      document.addEventListener("cut", preventCopy);
      document.addEventListener("contextmenu", preventContextMenu);

      return () => {
        document.removeEventListener("copy", preventCopy);
        document.removeEventListener("cut", preventCopy);
        document.removeEventListener("contextmenu", preventContextMenu);
      };
    }
  }, [quizCompleted, selectedTopic]);

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

  const handleSubmit = async (
    questionsData?: Question[],
    answersData?: { [key: string]: number }
  ) => {
    if (!selectedTopic) return;

    const quizQuestions = questionsData || questions;
    const quizAnswers = answersData || userAnswers;

    let correctAnswers = 0;

    quizQuestions.forEach((question) => {
      if (quizAnswers[question._id] === question.correctAnswer) {
        correctAnswers += 1;
      }
    });

    const totalQuestions = quizQuestions.length;
    const finalScore = `${correctAnswers}/${totalQuestions}`;
    const percentageScore = Math.round((correctAnswers / totalQuestions) * 100);

    setSubmitting(true);
    try {
      const sessionData = localStorage.getItem(
        `quiz_session_${selectedTopic.id}`
      );
      let startTime = Date.now();
      if (sessionData) {
        const session: QuizSession = JSON.parse(sessionData);
        startTime = session.startTime;
      }
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      // Submit to your backend API
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: selectedTopic.id,
          topicName: selectedTopic.label,
          answers: quizAnswers,
          score: correctAnswers,
          totalQuestions: totalQuestions,
          percentage: percentageScore,
          timeSpent: timeSpent,
          tabSwitches: tabSwitchCount,
        }),
      });

      if (response.ok) {
        // Mark quiz as completed
        localStorage.setItem(`quiz_completed_${selectedTopic.id}`, "true");

        // Clear session
        localStorage.removeItem(`quiz_session_${selectedTopic.id}`);

        setScoreData({ score: finalScore, percentage: percentageScore });
        setQuizCompleted(true);
      } else {
        throw new Error("Submission failed");
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      alert("Failed to submit quiz. Please try again.");
    } finally {
      setSubmitting(false);
    }
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

  // Quiz locked screen
  if (quizLocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Quiz Already Completed
          </h2>
          <p className="text-gray-600 mb-6">{lockMessage}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg transition w-full"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz...</p>
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
                {tabSwitchCount > 0 && (
                  <p className="text-orange-600 mt-2">
                    ⚠️ Tab switches detected: {tabSwitchCount}
                  </p>
                )}
              </div>

              <div className="flex flex-col space-y-3">
                <button
                  className="border border-gray-300 hover:bg-gray-100 text-gray-700 py-2 px-6 rounded-lg transition"
                  onClick={() => router.push("/dashboard")}
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
    <div className="p-4 lg:p-8 select-none">
      {/* Tab Switch Warning */}
      {showTabWarning && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse">
          ⚠️ Warning: Tab switching detected! Stay on this page.
        </div>
      )}

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
          </div>
        </div>

        {/* Warning Banner */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Important:</strong> Do not close this window or switch
                tabs. Copy/paste is disabled. Your progress is being monitored.
              </p>
            </div>
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
                  onClick={() => handleSubmit()}
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
