# Security Implementation - Testing & Integration Guide

## What's Working Now

### ✅ Phase 1: Answer Validation (COMPLETE)

The backend now:

1. Accepts ONLY answers from frontend (not score/percentage)
2. Calculates score by comparing answers to database questions
3. Prevents retakes with database check
4. Validates answer format (0-3 range)
5. Stores tabSwitches count

### ✅ Phase 2: Backend Infrastructure (COMPLETE)

- QuizSession model created for session management
- QuizViolation model created for violation tracking
- 3 new API endpoints ready
- Database indexes optimized

---

## How to Test Phase 1

### Test 1: Normal Quiz Submission

1. Go to `/dashboard/quiz`
2. Take a quiz
3. Submit answers
4. **Expected**: Score displayed should match backend calculation
5. **Check database**: `Submission` collection should have `tabSwitches: 0`

### Test 2: Retake Prevention

1. Complete a quiz
2. Try to access that quiz again
3. **Expected**:
   - Backend returns 403 (forbidden)
   - Frontend shows "Quiz already completed"

### Test 3: Answer Tampering Detection

1. Open DevTools Network tab
2. Submit quiz normally
3. Try to intercept request and add fake score
4. **Expected**: Backend validates answers, rejects tampering

---

## Frontend Integration (Phase 3)

To fully activate Phase 2, update `app/dashboard/quiz/page.tsx`:

### Step 1: Import and initialize session token

```typescript
const [sessionToken, setSessionToken] = useState<string | null>(null);

// After topic is selected, before loading quiz:
useEffect(() => {
  const startQuizSession = async () => {
    try {
      const res = await fetch("/api/quiz/start", {
        method: "POST",
        body: JSON.stringify({ topicId: selectedTopic.id }),
      });
      const data = await res.json();
      setSessionToken(data.sessionToken);
    } catch (error) {
      console.error("Failed to start session:", error);
    }
  };

  if (selectedTopic) startQuizSession();
}, [selectedTopic]);
```

### Step 2: Use backend completion check

```typescript
// Replace the localStorage check with API call
useEffect(() => {
  const checkCompletion = async () => {
    if (!topicParam) return;

    const res = await fetch(`/api/quiz/check-completion?topicId=${topicParam}`);
    const { completed } = await res.json();

    if (completed) {
      setQuizLocked(true);
      setLockMessage("Quiz already completed");
      setLoading(false);
      return;
    }

    // Continue with quiz loading...
  };
  checkCompletion();
}, [topicParam]);
```

### Step 3: Update submission to include sessionToken

```typescript
const response = await fetch("/api/submissions", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    topicId: selectedTopic.id,
    topicName: selectedTopic.label,
    answers: quizAnswers,
    timeSpent: timeSpent,
    tabSwitches: tabSwitchCount,
    sessionToken, // ← ADD THIS
  }),
});
```

### Step 4: Report violations in real-time

```typescript
// When tab switch is detected:
const handleVisibilityChange = () => {
  if (document.hidden) {
    setTabSwitchCount((prev) => prev + 1);

    // Report to backend
    if (sessionToken) {
      fetch("/api/quiz/violations", {
        method: "POST",
        body: JSON.stringify({
          sessionToken,
          violationType: "tab_switch",
          count: 1,
          timeIntoQuiz: Math.floor((Date.now() - startTime) / 1000),
        }),
      }).catch(console.error);
    }

    setShowTabWarning(true);
    setTimeout(() => setShowTabWarning(false), 3000);
  }
};
```

---

## Admin Violations Dashboard (Phase 4)

Create `/admin/violations/page.tsx`:

```typescript
"use client";
import { useEffect, useState } from "react";

interface Violation {
  _id: string;
  userId: { fullName: string; email: string };
  violationType: string;
  severity: "low" | "medium" | "high";
  count: number;
  timestamp: string;
}

export default function ViolationsPage() {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">(
    "all"
  );

  useEffect(() => {
    const fetchViolations = async () => {
      const params = filter !== "all" ? `?severity=${filter}` : "";
      const res = await fetch(`/api/quiz/violations${params}`);
      const data = await res.json();
      setViolations(data);
    };
    fetchViolations();
  }, [filter]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-red-600 bg-red-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-blue-600 bg-blue-50";
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Quiz Violations</h1>

      {/* Filter buttons */}
      <div className="flex gap-2 mb-6">
        {["all", "high", "medium", "low"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded ${
              filter === f
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Violations table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-gray-700">
                Student
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-700">
                Violation Type
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-700">
                Count
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-700">
                Severity
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-700">
                Timestamp
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {violations.map((v) => (
              <tr key={v._id} className="hover:bg-gray-50">
                <td className="px-6 py-3">
                  <div>
                    <p className="font-medium">{v.userId.fullName}</p>
                    <p className="text-sm text-gray-600">{v.userId.email}</p>
                  </div>
                </td>
                <td className="px-6 py-3">
                  {v.violationType.replace(/_/g, " ")}
                </td>
                <td className="px-6 py-3">{v.count}</td>
                <td className="px-6 py-3">
                  <span
                    className={`px-2 py-1 rounded text-sm font-medium ${getSeverityColor(
                      v.severity
                    )}`}
                  >
                    {v.severity}
                  </span>
                </td>
                <td className="px-6 py-3 text-sm text-gray-600">
                  {new Date(v.timestamp).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## Database Queries for Manual Testing

### Check a user's submissions

```javascript
db.submissions.find({ userId: ObjectId("user-id"), topicId: "topic1" });
```

### Check active sessions

```javascript
db.quizsessions.find({ status: "active", expiresAt: { $gt: new Date() } });
```

### Check violations for a user

```javascript
db.quizviolations
  .find({
    userId: ObjectId("user-id"),
    severity: "high",
  })
  .sort({ timestamp: -1 })
  .limit(20);
```

### Get all high-severity violations in last 24 hours

```javascript
db.quizviolations
  .find({
    severity: "high",
    timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  })
  .sort({ timestamp: -1 });
```

---

## Security Verification Checklist

### Answer Validation ✅

- [x] Backend calculates score
- [x] Frontend doesn't send score
- [x] Answers validated (0-3 range)
- [x] Retake check in API
- [ ] Test with wrong answer range

### Session Management

- [ ] Sessions created with token
- [ ] Sessions expire after 60 min
- [ ] Sessions marked "completed" after submission
- [ ] Can't start quiz without valid session

### Violation Tracking

- [ ] Tab switches recorded
- [ ] Violations have severity levels
- [ ] IP/UserAgent tracked
- [ ] Violations visible to admin

### Retake Prevention

- [ ] Database check blocks API
- [ ] Frontend redirects on load
- [ ] Multiple layers prevent bypass

---

## Common Issues & Solutions

### Issue: Quiz submission fails with "Quiz already completed"

- **Cause**: Submission already exists in DB
- **Solution**: Check `Submission` collection, delete test submission if needed

### Issue: Backend can't find questions

- **Cause**: Questions not seeded with correct category
- **Solution**: Verify questions have `category: "topic1"` etc.

### Issue: Session expires too quickly

- **Cause**: 60-minute expiration might be too short for testing
- **Solution**: Change `60 * 60 * 1000` to `24 * 60 * 60 * 1000` temporarily

### Issue: Violations not showing in DB

- **Cause**: Frontend not sending violation reports
- **Solution**: Check browser console for fetch errors, ensure sessionToken is set

---

## Next Phase: User Flagging System

To flag suspicious users for admin review:

```typescript
// models/User.ts - ADD FIELDS
flaggedForReview?: boolean;
flagReason?: string;
suspendedUntil?: Date;

// After 10 high-severity violations in 24 hours:
if (highSeverityCount > 10) {
  await User.findByIdAndUpdate(userId, {
    flaggedForReview: true,
    flagReason: "Multiple high-severity quiz violations",
  });
}
```
