// lib/topicsConfig.ts
// Central configuration for quiz topics, marks, and timing

export const QUIZ_CONFIG = {
  totalQuizzes: 4, // Number of quizzes
  pointsPerQuiz: 20, // Points for each quiz (10 questions × 2 points each)
  questionsPerQuiz: 10, // Number of questions per quiz
  groupProjectPoints: 20, // Points for group project
  quizDurationSeconds: 600, // 10 minutes in seconds
};

// Calculate max possible score
export const MAX_POSSIBLE_SCORE =
  QUIZ_CONFIG.totalQuizzes * QUIZ_CONFIG.pointsPerQuiz +
  QUIZ_CONFIG.groupProjectPoints;

export const TOPICS = [
  {
    id: "topic1",
    label: "Day 1 - Dirty Dozen",
    description: "Learn about the 12 most common aviation errors",
  },
  {
    id: "topic2",
    label: "Day 1 - Material Factors in Aviation Safety",
    description:
      "Understand material factors and their impact on aviation safety",
  },
  {
    id: "topic3",
    label: "Day 1 -Safety Management Systems",
    description: "Master safety management systems and protocols",
  },
  {
    id: "topic4",
    label: "Day 1 -Airside Safety Hazards",
    description: "Identify and mitigate airside safety hazards",
  },
];
