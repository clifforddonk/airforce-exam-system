"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, AlertCircle, Clock } from "lucide-react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { TOPICS, QUIZ_CONFIG } from "@/lib/topicsConfig";

const QUIZ_DURATION = QUIZ_CONFIG.quizDurationSeconds; // 10 minutes in seconds

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
  answers: { [questionId: string]: number };
  currentQuestionIndex: number;
  sessionToken?: string;
}

export default function SecureQuizPage() {
  const searchParams = useSearchParams();
  const topicParam = searchParams.get("topic");
  const queryClient = useQueryClient();

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
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewData, setReviewData] = useState<{
    answers: { [key: string]: number };
    questions: Question[];
    score: number;
    percentage: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [quizLocked, setQuizLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState("");

  // ✅ NEW: Session token for backend validation
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const startTimeRef = useRef<number>(0);

  // ✅ NEW: Check completion status from backend (not localStorage)
  useEffect(() => {
    const checkCompletion = async () => {
      if (!topicParam) return;

      try {
        const res = await fetch(
          `/api/quiz/check-completion?topicId=${topicParam}`
        );
        const data = await res.json();

        if (data.completed) {
          setQuizLocked(true);
          setLockMessage(
            `Quiz already completed on ${new Date(
              data.submission.completedAt
            ).toLocaleDateString()}`
          );
          setLoading(false);
          return;
        }

        // Completion check passed, now start the quiz
        const topic = TOPICS.find((t) => t.id === topicParam);
        if (topic) {
          setSelectedTopic(topic);
          loadOrStartQuiz(topic);
        }
      } catch (error) {
        console.error("Error checking quiz completion:", error);
        // Fallback to localStorage check
        const completed = localStorage.getItem(`quiz_completed_${topicParam}`);
        if (completed === "true") {
          setQuizLocked(true);
          setLockMessage("Quiz already completed");
          setLoading(false);
          return;
        }

        const topic = TOPICS.find((t) => t.id === topicParam);
        if (topic) {
          setSelectedTopic(topic);
          loadOrStartQuiz(topic);
        }
      }
    };

    checkCompletion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicParam]);

  // ✅ NEW: Start quiz session on backend
  const startQuizSession = async (topicId: string) => {
    try {
      const res = await fetch("/api/quiz/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to start session");
      }

      const data = await res.json();
      setSessionToken(data.sessionToken);
      console.log("✅ Quiz session started:", data.sessionToken);
      return data.sessionToken;
    } catch (error) {
      console.error("Error starting quiz session:", error);
      alert(`Failed to start quiz session: ${error}`);
      return null;
    }
  };

  // Load existing session or start new quiz
  const loadOrStartQuiz = async (topic: (typeof TOPICS)[0]) => {
    setLoading(true);

    try {
      // ✅ Start backend session first
      const token = await startQuizSession(topic.id);
      if (!token) {
        setLoading(false);
        return;
      }

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
        startTimeRef.current = session.startTime;

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

        startTimeRef.current = Date.now();

        const newSession: QuizSession = {
          topicId: topic.id,
          startTime: Date.now(),
          answers: {},
          currentQuestionIndex: 0,
          sessionToken: token, // ✅ Store session token
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, quizCompleted, selectedTopic]);

  // ✅ NEW: Tab visibility detection with violation reporting
  useEffect(() => {
    if (!quizCompleted && selectedTopic && sessionToken) {
      const handleVisibilityChange = () => {
        if (document.hidden) {
          setTabSwitchCount((prev: number) => prev + 1);
          setShowTabWarning(true);

          // ✅ Report violation to backend
          const timeIntoQuiz = Math.floor(
            (Date.now() - startTimeRef.current) / 1000
          );
          fetch("/api/quiz/violations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionToken,
              violationType: "tab_switch",
              count: 1,
              timeIntoQuiz,
            }),
          }).catch((err) => console.error("Failed to report violation:", err));

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
  }, [quizCompleted, selectedTopic, sessionToken]);

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
    setUserAnswers((prev: { [key: string]: number }) => ({
      ...prev,
      [questionId]: selectedIndex,
    }));
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

  // ✅ UPDATED: Only send answers to backend, not score
  const handleSubmit = async (
    questionsData?: Question[],
    answersData?: { [key: string]: number }
  ) => {
    if (!selectedTopic) return;

    const quizAnswers = answersData || userAnswers;

    setSubmitting(true);
    try {
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);

      // ✅ SECURITY UPDATE: Send ONLY answers, backend calculates score
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: selectedTopic.id,
          topicName: selectedTopic.label,
          answers: quizAnswers,
          timeSpent: timeSpent,
          tabSwitches: tabSwitchCount,
          sessionToken, // ✅ Include session token for backend validation
          // ❌ NO LONGER SENDING: score, totalQuestions, percentage
        }),
      });

      if (response.ok) {
        const result = await response.json();

        // ✅ Use server-calculated score
        const serverScore = result.submission.score; // Now in 20-point scale
        const serverTotal = 20; // Maximum points per quiz
        const serverPercentage = result.submission.percentage;
        const finalScore = `${serverScore}/${serverTotal}`;

        // Mark quiz as completed
        localStorage.setItem(`quiz_completed_${selectedTopic.id}`, "true");

        // ✅ NEW: Set flag for dashboard to refetch
        localStorage.setItem("quiz_just_submitted", "true");

        // Clear session
        localStorage.removeItem(`quiz_session_${selectedTopic.id}`);

        setScoreData({ score: finalScore, percentage: serverPercentage });
        setQuizCompleted(true);

        // ✅ Store answers for review
        localStorage.setItem(
          `quiz_answers_${selectedTopic.id}`,
          JSON.stringify({
            answers: userAnswers,
            questions: questionsData || questions,
            score: serverScore,
            percentage: serverPercentage,
          })
        );

        // ✅ NEW: Immediately refetch submissions (force all instances to update)
        await queryClient.refetchQueries({ queryKey: ["submissions"] });

        console.log("✅ Quiz submitted - Score from backend:", finalScore);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Submission failed");
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      alert(
        `Failed to submit quiz: ${
          error instanceof Error ? error.message : "Please try again."
        }`
      );
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

  // Quiz locked screen
  if (quizLocked) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 lg:p-8 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-orange-600" />
              <h2 className="text-xl font-bold text-gray-900">Quiz Locked</h2>
            </div>
            <p className="text-gray-600 mb-4">{lockMessage}</p>
            <Link href="/dashboard">
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700">
                Return to Dashboard
              </button>
            </Link>
          </div>
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

  if (quizCompleted && scoreData) {
    // Quiz completion screen
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
              </div>

              <div className="flex gap-4 justify-center">
                <Link href="/dashboard">
                  <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700">
                    Return to Dashboard
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz taking screen
  const question = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Tab Warning */}
        {showTabWarning && (
          <div className="mb-4 bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <p className="text-orange-800 text-sm">
              Tab switch detected (Count: {tabSwitchCount})
            </p>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <Link href="/dashboard">
              <button className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
            </Link>

            <div className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <Clock className="w-5 h-5 text-orange-600" />
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">
            Question {currentQuestionIndex + 1} of {questions.length}:{" "}
            {question.question}
          </h3>

          {/* Options */}
          <div className="space-y-3">
            {question.options.map((option: string, i: number) => (
              <button
                key={i}
                onClick={() => handleSelect(question._id, i)}
                className={`w-full p-4 text-left border-2 rounded-lg transition-colors ${
                  userAnswers[question._id] === i
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      userAnswers[question._id] === i
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300"
                    }`}
                  >
                    {userAnswers[question._id] === i && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span className="text-gray-800">{option}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow p-4 flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition disabled:opacity-50"
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
  );
}
