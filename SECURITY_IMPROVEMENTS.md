# Backend Security Implementation Plan

## Current Architecture Analysis

**Current Flow:**

1. Frontend loads questions with correct answers
2. Frontend calculates score in browser
3. Frontend sends answers + score to backend
4. localStorage prevents retakes

**Vulnerabilities:**

- ❌ Users can see correct answers in DevTools
- ❌ Users can tamper with scores via network tab
- ❌ localStorage can be cleared to bypass retakes
- ❌ Tab switching recorded locally only
- ❌ Endpoint doesn't validate quiz completion

---

## Implementation Plan

### 1️⃣ Answer Validation on Backend

**Current:** Frontend stores score calculated from answers
**Goal:** Backend calculates score from answers

#### Changes:

**Frontend (dashboard/quiz/page.tsx):**

```typescript
// BEFORE: Send score calculated in frontend
const response = await fetch("/api/submissions", {
  body: JSON.stringify({
    topicId: selectedTopic.id,
    answers: quizAnswers, // ✓ SEND THIS
    score: correctAnswers, // ✗ REMOVE THIS
    percentage: percentageScore, // ✗ REMOVE THIS
  }),
});

// AFTER: Only send answers and metadata
const response = await fetch("/api/submissions", {
  body: JSON.stringify({
    topicId: selectedTopic.id,
    answers: quizAnswers, // ✓ SEND THIS
    timeSpent: timeSpent, // ✓ SEND THIS
    tabSwitches: tabSwitchCount, // ✓ SEND THIS
    // Score calculated by backend
  }),
});
```

**Backend (api/submissions/route.ts):**

```typescript
export async function POST(req: NextRequest) {
  // 1. Verify user is authenticated
  const user = await verifyToken(cookieString);

  // 2. Get questions from database
  const questions = await Question.find({ topicId: data.topicId });

  // 3. Calculate score by comparing answers to questions
  let correctAnswers = 0;
  for (const question of questions) {
    if (data.answers[question._id] === question.correctAnswer) {
      correctAnswers++;
    }
  }

  // 4. Calculate final score and percentage
  const score = correctAnswers;
  const totalQuestions = questions.length;
  const percentage = Math.round((correctAnswers / totalQuestions) * 100);

  // 5. Store submission with calculated score
  const submission = await Submission.create({
    userId: user.id,
    topicId: data.topicId,
    answers: data.answers,
    score, // ← Calculated by backend
    totalQuestions,
    percentage, // ← Calculated by backend
    timeSpent: data.timeSpent,
    tabSwitches: data.tabSwitches,
  });

  return NextResponse.json({ submission }, { status: 201 });
}
```

**Benefits:**

- ✅ Correct answers never sent to frontend
- ✅ Score verified server-side
- ✅ Tampering detected (answers must match score)

---

### 2️⃣ Session Management on Backend

**Current:** Quiz sessions stored in localStorage
**Goal:** Sessions stored in database with server-side validation

#### New Model: QuizSession

```typescript
// models/QuizSession.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IQuizSession extends Document {
  userId: mongoose.Types.ObjectId;
  topicId: string;
  startedAt: Date;
  expiresAt: Date; // 60 min from start
  tabSwitches: number;
  sessionToken: string; // Unique identifier
  ip: string;
  userAgent: string;
  status: "active" | "completed" | "expired";
}

const QuizSessionSchema = new Schema<IQuizSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    topicId: { type: String, required: true },
    startedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    tabSwitches: { type: Number, default: 0 },
    sessionToken: { type: String, unique: true },
    ip: { type: String },
    userAgent: { type: String },
    status: { type: String, enum: ["active", "completed", "expired"] },
  },
  { timestamps: true }
);

export default mongoose.models.QuizSession ||
  mongoose.model<IQuizSession>("QuizSession", QuizSessionSchema);
```

#### New API Route: Start Quiz

```typescript
// api/quiz/start/route.ts
export async function POST(req: NextRequest) {
  const user = await verifyToken(cookieString);
  const { topicId } = await req.json();

  // Check if already completed
  const existing = await Submission.findOne({
    userId: user.id,
    topicId: topicId,
  });

  if (existing) {
    return NextResponse.json(
      { error: "Quiz already completed" },
      { status: 403 }
    );
  }

  // Create session
  const sessionToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 60 min

  const session = await QuizSession.create({
    userId: user.id,
    topicId,
    sessionToken,
    expiresAt,
    ip: req.ip,
    userAgent: req.headers.get("user-agent"),
    status: "active",
  });

  return NextResponse.json({
    sessionToken: session.sessionToken,
    expiresAt: session.expiresAt,
  });
}
```

#### Submission Validation

```typescript
// api/submissions/route.ts
export async function POST(req: NextRequest) {
  const user = await verifyToken(cookieString);
  const data = await req.json();

  // 1. Verify session exists and is active
  const session = await QuizSession.findOne({
    sessionToken: data.sessionToken,
    userId: user.id,
    topicId: data.topicId,
    status: "active",
  });

  if (!session) {
    return NextResponse.json(
      { error: "Invalid or expired session" },
      { status: 401 }
    );
  }

  // 2. Check session hasn't expired
  if (new Date() > session.expiresAt) {
    await session.updateOne({ status: "expired" });
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  // 3. Calculate score (as above)
  // 4. Create submission
  // 5. Mark session as completed
  await session.updateOne({
    status: "completed",
    tabSwitches: data.tabSwitches,
  });

  return NextResponse.json({ submission }, { status: 201 });
}
```

---

### 3️⃣ True Retake Prevention

**Current:** localStorage `quiz_completed_topic1` flag
**Goal:** Database-backed retake prevention with enforcement

#### Implementation:

```typescript
// api/quiz/check-completion/route.ts
export async function GET(req: NextRequest) {
  const user = await verifyToken(cookieString);
  const { topicId } = req.nextUrl.searchParams;

  // Check database, not localStorage
  const submission = await Submission.findOne({
    userId: user.id,
    topicId: topicId,
  });

  return NextResponse.json({
    completed: !!submission,
    submission: submission || null,
  });
}
```

#### Frontend Protection (Multiple Layers):

```typescript
// dashboard/quiz/page.tsx

// Layer 1: Check on page load
useEffect(() => {
  const checkCompletion = async () => {
    const res = await fetch(`/api/quiz/check-completion?topicId=${topicId}`);
    const { completed } = await res.json();

    if (completed) {
      router.push("/dashboard"); // Redirect immediately
    }
  };
  checkCompletion();
}, [topicId]);

// Layer 2: When starting quiz
const handleStartQuiz = async () => {
  const res = await fetch("/api/quiz/start", {
    method: "POST",
    body: JSON.stringify({ topicId: selectedTopic.id }),
  });

  if (res.status === 403) {
    // Already completed - backend blocked it
    alert("Quiz already completed");
    router.push("/dashboard");
    return;
  }

  const { sessionToken } = await res.json();
  // Store session token temporarily in state, not localStorage
};
```

**Benefits:**

- ✅ Server enforces retake prevention
- ✅ Can't bypass by clearing localStorage
- ✅ Frontend and backend both check

---

### 4️⃣ Security Monitoring & Violations

**Current:** Tab switches counted locally only
**Goal:** Log all violations with context for admin review

#### New Model: QuizViolation

```typescript
// models/QuizViolation.ts
export interface IQuizViolation extends Document {
  userId: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  topicId: string;
  violationType: "tab_switch" | "page_focus_loss" | "copy_paste" | "devtools";
  severity: "low" | "medium" | "high";
  count: number;
  timestamp: Date;
  details: {
    ip: string;
    userAgent: string;
    timeIntoQuiz: number; // seconds
  };
}

const QuizViolationSchema = new Schema<IQuizViolation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "QuizSession",
      required: true,
    },
    topicId: { type: String, required: true },
    violationType: {
      type: String,
      enum: ["tab_switch", "page_focus_loss", "copy_paste", "devtools"],
    },
    severity: { type: String, enum: ["low", "medium", "high"] },
    count: { type: Number, default: 1 },
    timestamp: { type: Date, default: Date.now },
    details: {
      ip: String,
      userAgent: String,
      timeIntoQuiz: Number,
    },
  },
  { timestamps: true }
);
```

#### Report Violations During Quiz

```typescript
// api/quiz/violations/route.ts
export async function POST(req: NextRequest) {
  const user = await verifyToken(cookieString);
  const { sessionToken, violationType, count } = await req.json();

  // Find session
  const session = await QuizSession.findOne({ sessionToken });

  // Log violation
  const severity =
    violationType === "tab_switch"
      ? count > 5
        ? "high"
        : count > 2
        ? "medium"
        : "low"
      : "high";

  await QuizViolation.create({
    userId: user.id,
    sessionId: session._id,
    topicId: session.topicId,
    violationType,
    severity,
    count,
    details: {
      ip: req.ip,
      userAgent: req.headers.get("user-agent"),
      timeIntoQuiz: (Date.now() - session.startedAt) / 1000,
    },
  });

  return NextResponse.json({ logged: true });
}
```

#### Admin Dashboard to View Violations

```typescript
// api/admin/quiz-violations/route.ts
export async function GET(req: NextRequest) {
  // Verify admin
  const user = await verifyToken(cookieString);
  if (user.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const violations = await QuizViolation.find()
    .populate("userId", "fullName email")
    .sort({ timestamp: -1 })
    .limit(100);

  return NextResponse.json(violations);
}
```

---

### 5️⃣ API Route Protection

**Current:** Frontend redirects if quiz completed
**Goal:** Backend validates every submission request

#### Updated Submissions Route:

```typescript
// api/submissions/route.ts
export async function POST(req: NextRequest) {
  const user = await verifyToken(cookieString);
  const data = await req.json();

  // ✅ PROTECTION LAYER 1: Check if already submitted
  const existing = await Submission.findOne({
    userId: user.id,
    topicId: data.topicId,
  });

  if (existing) {
    return NextResponse.json(
      { error: "Quiz already completed. No retakes allowed." },
      { status: 403 }
    );
  }

  // ✅ PROTECTION LAYER 2: Validate session
  const session = await QuizSession.findOne({
    sessionToken: data.sessionToken,
    userId: user.id,
    status: "active",
  });

  if (!session || new Date() > session.expiresAt) {
    return NextResponse.json(
      { error: "Invalid or expired session" },
      { status: 401 }
    );
  }

  // ✅ PROTECTION LAYER 3: Verify answers haven't been tampered with
  const questions = await Question.find({ topicId: data.topicId });
  for (const q of questions) {
    // Validate answer is valid (0-3 for multiple choice)
    if (
      data.answers[q._id] &&
      (data.answers[q._id] < 0 || data.answers[q._id] > 3)
    ) {
      return NextResponse.json(
        { error: "Invalid answers submitted" },
        { status: 400 }
      );
    }
  }

  // ✅ PROTECTION LAYER 4: Calculate score server-side
  let correctAnswers = 0;
  for (const q of questions) {
    if (data.answers[q._id] === q.correctAnswer) {
      correctAnswers++;
    }
  }

  // ✅ PROTECTION LAYER 5: Log suspension if too many violations
  const violations = await QuizViolation.countDocuments({
    userId: user.id,
    severity: { $in: ["high"] },
    createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
  });

  if (violations > 10) {
    // Flag user for admin review
    await User.findByIdAndUpdate(user.id, {
      flaggedForReview: true,
      flagReason: "Multiple high-severity quiz violations",
    });
  }

  // Create submission
  const submission = await Submission.create({
    userId: user.id,
    topicId: data.topicId,
    answers: data.answers,
    score: correctAnswers,
    percentage: Math.round((correctAnswers / questions.length) * 100),
    timeSpent: data.timeSpent,
    tabSwitches: data.tabSwitches,
  });

  // Mark session as completed
  await session.updateOne({
    status: "completed",
    tabSwitches: data.tabSwitches,
  });

  return NextResponse.json({ submission }, { status: 201 });
}
```

---

## Implementation Roadmap

### Phase 1: Answer Validation (2-3 hours)

1. Update Submission model to add `tabSwitches` field
2. Modify frontend to NOT send score/percentage
3. Update backend to calculate score from answers
4. Test with sample quiz submission

### Phase 2: Session Management (2-3 hours)

1. Create QuizSession model
2. Create `/api/quiz/start` endpoint
3. Modify `/api/submissions` to validate session
4. Update frontend to get session token on quiz start

### Phase 3: Retake Prevention (1 hour)

1. Create `/api/quiz/check-completion` endpoint
2. Add completion check on page load
3. Add error handling for blocked submissions

### Phase 4: Violation Monitoring (2-3 hours)

1. Create QuizViolation model
2. Create `/api/quiz/violations` endpoint
3. Update session to track violations
4. Create admin endpoint to view violations

### Phase 5: Security Hardening (1-2 hours)

1. Add all validation layers to submission endpoint
2. Add user flagging for suspicious activity
3. Add IP tracking and user agent logging

---

## Database Schema Changes Required

```typescript
// models/Submission.ts - ADD FIELD
tabSwitches: { type: Number, default: 0 }

// models/User.ts - ADD FIELDS
flaggedForReview: { type: Boolean, default: false }
flagReason: { type: String }
suspendedUntil: { type: Date }

// NEW MODELS
// - QuizSession
// - QuizViolation
```

---

## Frontend Changes Summary

1. **Quiz Page:** Remove score calculation, send only answers
2. **Start Quiz:** Get sessionToken from backend
3. **Submit Quiz:** Validate session before submission
4. **Dashboard:** Check backend for completion status

---

## Testing Checklist

- [ ] Normal quiz submission works
- [ ] Can't retake completed quiz (backend blocks)
- [ ] Tab switches logged to database
- [ ] Admin can view violations
- [ ] Invalid answers rejected
- [ ] Expired sessions blocked
- [ ] Tampering attempts detected
