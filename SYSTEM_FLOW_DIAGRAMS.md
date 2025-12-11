# System Flow - Visual Guide

## 1. User Authentication Flow

```
START: User visits site
  │
  ├─ Has token in cookie?
  │  │
  │  ├─ YES → Verify token in middleware
  │  │        │
  │  │        ├─ Valid? → Check role
  │  │        │          │
  │  │        │          ├─ Admin → /admin
  │  │        │          └─ Student → /dashboard
  │  │        │
  │  │        └─ Invalid → Clear cookie → /auth/login
  │  │
  │  └─ NO → Show login/signup options
  │           │
  │           ├─ New user? → Click Signup
  │           │              │
  │           │              ├─ Enter: name, email, password, group
  │           │              ├─ Validation (email unique, pass strong)
  │           │              └─ POST /api/auth/signup
  │           │                 │
  │           │                 └─ Success → Auto login → /dashboard
  │           │
  │           └─ Returning user? → Click Login
  │                                 │
  │                                 ├─ Enter: email, password
  │                                 ├─ Validation
  │                                 └─ POST /api/auth/login
  │                                    │
  │                                    ├─ Credentials match?
  │                                    │  │
  │                                    │  ├─ YES → Generate JWT
  │                                    │  │         Set HTTPOnly cookie
  │                                    │  │         Redirect to /dashboard or /admin
  │                                    │  │
  │                                    │  └─ NO → Show error
  │                                    │
  │                                    └─ Retry or signup
  │
  END: User authenticated & redirected
```

## 2. Student Quiz Taking Flow

```
START: Student on dashboard
  │
  ├─ Click "Start Quiz" on topic card
  │
  ├─ Redirect to /dashboard/quiz?topicId=topic1
  │
  ├─ Page loads:
  │  ├─ GET /api/questions?category=topic1
  │  │  └─ Returns 10 questions (WITHOUT correct answers)
  │  │
  │  ├─ Initialize 10-minute timer
  │  │
  │  └─ Display Question 1/10
  │
  ├─ Student fills quiz:
  │  │
  │  ├─ Select answer
  │  ├─ Progress updates (e.g., 3/10 answered)
  │  ├─ Click "Next" button
  │  ├─ Navigate through all questions
  │  └─ Can jump to any question via progress bar
  │
  ├─ Timer runs (10 minutes = 600 seconds):
  │  │
  │  ├─ Time display: "9:45"
  │  ├─ 1 minute warning: "1:00" (alert)
  │  └─ Auto-submit when timer ends
  │
  ├─ Student clicks "Submit Answers"
  │  │
  │  └─ POST /api/submissions
  │     │
  │     ├─ Request body:
  │     │  {
  │     │    topicId: "topic1",
  │     │    topicName: "DIRTY DOZEN",
  │     │    answers: {
  │     │      "questionId1": 0,  ← Index of selected option
  │     │      "questionId2": 2,
  │     │      ...
  │     │    },
  │     │    timeSpent: 450       ← Seconds
  │     │  }
  │     │
  │     └─ Server processes:
  │        │
  │        ├─ STEP 1: Verify user (token)
  │        ├─ STEP 2: Check no duplicate submission
  │        ├─ STEP 3: Fetch questions from DB
  │        ├─ STEP 4: Validate all answers (0-3 range)
  │        ├─ STEP 5: Compare to correct answers
  │        ├─ STEP 6: Calculate score
  │        │         score = (correctCount / 10) * 20
  │        │         e.g., 8 correct = 16/20 points
  │        ├─ STEP 7: Store in DB
  │        │
  │        └─ Response:
  │           {
  │             message: "Success",
  │             submission: {
  │               score: 16,
  │               percentage: 80,
  │               totalQuestions: 10
  │             }
  │           }
  │
  ├─ Result page shown:
  │  ├─ Score: 16/20
  │  ├─ Percentage: 80%
  │  ├─ Passed/Failed message
  │  ├─ Button: "Review Answers"
  │  └─ Button: "Back to Dashboard"
  │
  ├─ Optional: Click "Review Answers"
  │  │
  │  └─ Navigate to /dashboard/review?topicId=topic1
  │     │
  │     ├─ GET submission + questions
  │     ├─ Show side-by-side:
  │     │  ├─ Your answer
  │     │  ├─ Correct answer (✓ or ✗)
  │     │  └─ Explanation
  │     │
  │     └─ Navigate through review
  │
  └─ Click "Back to Dashboard"
     │
     └─ Redirect to /dashboard
        │
        ├─ Fetch updated submissions
        ├─ Topic card shows: "✓ Completed 16/20"
        └─ Total score updated
```

## 3. Group Assignment Submission Flow

```
START: Student on dashboard
  │
  ├─ Scroll to "Group Assignment" section
  │
  ├─ Check group status:
  │  │
  │  ├─ Already submitted?
  │  │  │
  │  │  ├─ YES → Show file details
  │  │  │        ├─ Uploaded by: (group member name)
  │  │  │        ├─ Date: (upload date)
  │  │  │        ├─ Status: Awaiting Grading / Graded
  │  │  │        ├─ Button: "Download File"
  │  │  │        └─ If graded:
  │  │  │           ├─ Score: 18/20
  │  │  │           └─ Feedback: (admin comments)
  │  │  │
  │  │  └─ NO → Show upload form
  │  │           ├─ File input (PDF, DOCX, etc.)
  │  │           └─ Button: "Upload Assignment"
  │  │
  │  └─ Only group leader can upload (typically)
  │
  ├─ Student selects file
  │
  ├─ Click "Upload Assignment"
  │
  ├─ POST /api/submissions/group
  │  │
  │  ├─ Request:
  │  │  {
  │  │    groupId: "...",
  │  │    groupNumber: 1,
  │  │    file: <File>
  │  │  }
  │  │
  │  └─ Server:
  │     ├─ Verify user
  │     ├─ Verify user in group
  │     ├─ Upload to storage (S3/local)
  │     ├─ Create GroupSubmission record
  │     └─ Return file URL
  │
  ├─ Success message shown
  │
  ├─ Dashboard updates:
  │  └─ Group section now shows "Submitted"
  │
  └─ Admin notified (if email implemented)
     └─ Admin sees submission in /admin/grading
```

## 4. Admin Grading Flow

```
START: Admin on /admin/grading
  │
  ├─ Page loads
  │
  ├─ GET /api/admin/submissions/groups
  │  │
  │  └─ Returns list of all group submissions:
  │     {
  │       submissions: [
  │         {
  │           _id: "...",
  │           groupNumber: 1,
  │           fileName: "project.pdf",
  │           uploadedBy: { fullName: "John Mitchell" },
  │           uploadedAt: "2024-01-15T10:30:00Z",
  │           score: null,        ← Not yet graded
  │           feedback: null
  │         },
  │         ...
  │       ]
  │     }
  │
  ├─ Display table:
  │  ├─ Group Number | Uploaded By | File | Status
  │  ├─ Group 1     | John Mitchell | project.pdf | Ungraded
  │  ├─ Group 2     | Jane Smith    | report.pdf  | Graded
  │  └─ ...
  │
  ├─ Admin clicks "Group 1" row
  │
  ├─ Submission details expand/modal:
  │  ├─ File name: project.pdf
  │  ├─ Uploaded by: John Mitchell
  │  ├─ Uploaded at: Jan 15, 2024 10:30 AM
  │  ├─ Button: "Download / Preview File"
  │  │
  │  ├─ Admin downloads and reviews file
  │  │
  │  ├─ Grading form appears:
  │  │  ├─ Score input: [____] / 20
  │  │  ├─ Feedback textarea: [________________]
  │  │  └─ Button: "Submit Grade"
  │  │
  │  └─ Admin fills form:
  │     ├─ Enters score: 18
  │     ├─ Types feedback: "Excellent work! Good analysis."
  │     └─ Clicks "Submit Grade"
  │
  ├─ POST /api/admin/submissions/{submissionId}/grade
  │  │
  │  ├─ Request:
  │  │  {
  │  │    score: 18,
  │  │    feedback: "Excellent work! Good analysis."
  │  │  }
  │  │
  │  └─ Server:
  │     ├─ Verify admin role
  │     ├─ Update GroupSubmission:
  │     │  ├─ Set score = 18
  │     │  ├─ Set gradedBy = admin ID
  │     │  ├─ Set gradedAt = now
  │     │  └─ Set feedback = "Excellent..."
  │     │
  │     ├─ Update Group record:
  │     │  └─ Set score = 18
  │     │
  │     └─ Response: Success
  │
  ├─ UI updates:
  │  ├─ Form closes
  │  ├─ Status changes to "Graded"
  │  ├─ Submission moves to "Graded" section
  │  └─ Shows: "18/20 - Excellent work!..."
  │
  ├─ All 5 groups now graded?
  │  │
  │  └─ YES → Admin views /admin page (metrics update)
  │           ├─ Completion rate increases
  │           └─ Average scores include group scores now
  │
  └─ Students see updated scores:
     ├─ Login to /dashboard
     ├─ Group score: 18/20
     ├─ Total score now includes group points
     ├─ Total: (Quiz1 + Quiz2 + Quiz3 + Quiz4 + GroupScore)
     │         = (16 + 18 + 14 + 20 + 18) = 86/100
     │
     └─ Can see feedback in group section
```

## 5. Admin Dashboard Metrics Flow

```
START: Admin on /admin (dashboard)
  │
  ├─ Page mounts
  │
  ├─ GET /api/admin/submissions
  │  │
  │  └─ Server aggregates:
  │     │
  │     ├─ STEP 1: Fetch all Submissions
  │     │          (all quizzes taken by all students)
  │     │
  │     ├─ STEP 2: Fetch all GroupSubmissions with grades
  │     │          (only those with score set)
  │     │
  │     ├─ STEP 3: Create groupScoreMap
  │     │          Map: groupNumber → groupScore
  │     │          e.g., { 1: 18, 2: 20, 3: 14, ... }
  │     │
  │     ├─ STEP 4: Group submissions by userId
  │     │
  │     ├─ STEP 5: For each user, aggregate:
  │     │          {
  │     │            userId: "...",
  │     │            fullName: "John Mitchell",
  │     │            email: "john@...",
  │     │            group: 1,
  │     │            topic1: 16,    ← From Submission
  │     │            topic2: 18,    ← From Submission
  │     │            topic3: 14,    ← From Submission
  │     │            topic4: 20,    ← From Submission
  │     │            groupScore: 18,← From GroupSubmission
  │     │            total: 86      ← Sum of all above
  │     │          }
  │     │
  │     └─ Return array of above objects
  │
  ├─ Metrics calculated:
  │  │
  │  ├─ Total Students:
  │  │  └─ Count users with any submission: 45 students
  │  │
  │  ├─ Average Score:
  │  │  └─ (Sum of all totals) / (Students with submissions)
  │  │     = (86 + 92 + 78 + ... ) / 45
  │  │     = 80.5 average
  │  │
  │  ├─ Highest Score:
  │  │  └─ Max total: 96/100
  │  │     Student: Jane Smith
  │  │
  │  ├─ Lowest Score:
  │  │  └─ Min total: 45/100
  │  │     Student: Mike Wilson
  │  │
  │  ├─ Completion Rate:
  │  │  └─ (Students with submissions) / (Total users)
  │  │     = 45 / 50 = 90%
  │  │
  │  └─ Top Performer:
  │     └─ Student with highest score
  │        Jane Smith - 96/100
  │
  ├─ Display metrics on dashboard:
  │  ├─ 4 metric cards
  │  ├─ Score distribution chart
  │  └─ Quick action buttons
  │     ├─ Manage Questions → /admin/questions
  │     ├─ View Results → /admin/results
  │     └─ Grade Assignments → /admin/grading
  │
  └─ Admin can click into any section
     ├─ Click "View Results" → /admin/results
     │                       Shows detailed table
     │
     └─ Click "Grade Assignments" → /admin/grading
                                   Shows ungraded list
```

## 6. Database Write Operations Timeline

```
USER CREATES ACCOUNT
│
├─ POST /api/auth/signup
│  └─ User record created in DB:
│     {
│       _id: "ObjectId1",
│       fullName: "John Mitchell",
│       email: "john@example.com",
│       password: "hashed_password",
│       role: "student",
│       group: 1
│     }
│
│
USER TAKES QUIZ
│
├─ POST /api/submissions
│  └─ Submission record created:
│     {
│       _id: "ObjectId2",
│       userId: "ObjectId1",        ← Links to User
│       topicId: "topic1",
│       topicName: "DIRTY DOZEN",
│       answers: { "q1": 0, "q2": 2, ... },
│       score: 16,
│       percentage: 80,
│       timeSpent: 450
│     }
│
│
GROUP UPLOADS ASSIGNMENT
│
├─ POST /api/submissions/group
│  └─ GroupSubmission record created:
│     {
│       _id: "ObjectId3",
│       groupId: "ObjectId4",       ← Links to Group
│       groupNumber: 1,
│       fileUrl: "https://storage.../file.pdf",
│       fileName: "project.pdf",
│       uploadedBy: "ObjectId1",    ← Links to User
│       uploadedAt: "2024-01-15T10:30:00Z",
│       score: null                  ← Not yet graded
│     }
│
│
ADMIN GRADES ASSIGNMENT
│
├─ POST /api/admin/submissions/{id}/grade
│  │
│  ├─ Update GroupSubmission:
│  │  {
│  │    score: 18,                   ← ← SET BY ADMIN
│  │    gradedBy: "ObjectIdAdmin",   ← ← ADMIN ID
│  │    gradedAt: "2024-01-15T11:00:00Z",
│  │    feedback: "Excellent work!"
│  │  }
│  │
│  └─ Update Group:
│     {
│       score: 18                    ← ← Reflects group submission grade
│     }
│
│
QUERY RESULTS FOR ADMIN DASHBOARD
│
└─ GET /api/admin/submissions
   │
   ├─ Read Student (John Mitchell):
   │  └─ One record with:
   │     topic1: 16,
   │     topic2: 18,
   │     ...
   │     groupScore: 18,
   │     total: 86
   │
   └─ Display to admin
```

## 7. Error Handling Flow

```
ERROR SCENARIOS:

1. INVALID LOGIN
   │
   └─ User enters wrong password
      │
      ├─ Frontend: validate email + password present
      ├─ POST /api/auth/login
      ├─ Backend: bcrypt.compare(input, stored) = false
      └─ Response: 400 "Invalid email or password"
         └─ Frontend: Display error message

2. DUPLICATE QUIZ SUBMISSION (No Retakes)
   │
   └─ Student takes quiz again
      │
      ├─ POST /api/submissions
      ├─ Backend: Check for existing submission
      │           (SELECT * FROM submissions WHERE userId=X AND topicId=Y)
      ├─ Found! → Error
      └─ Response: 403 "Quiz already completed. No retakes allowed."
         └─ Frontend: Show error, prevent resubmission

3. INVALID ANSWERS (Client Tampering)
   │
   └─ User submits answers outside 0-3 range
      │
      ├─ POST /api/submissions
      ├─ Backend: Validate each answer
      │           if (answer < 0 || answer > 3) → Error
      ├─ Invalid found! → Reject
      └─ Response: 400 "Invalid answers submitted"
         └─ Frontend: Alert user

4. EXPIRED TOKEN
   │
   └─ User's JWT expires (7 days)
      │
      ├─ Next API call includes stale token
      ├─ Backend: verifyToken() fails
      ├─ Clear cookie
      └─ Response: 401 Unauthorized
         └─ Frontend: Redirect to /auth/login

5. UNAUTHORIZED ACCESS (Wrong Role)
   │
   └─ Student tries to access /admin
      │
      ├─ Request to /admin
      ├─ Middleware checks: decode.role === "admin"?
      ├─ NO → Block
      └─ Response: Redirect to /unauthorized
         └─ Show error page

6. MISSING REQUIRED FIELDS
   │
   └─ User submits form missing email/password
      │
      ├─ POST /api/auth/login
      ├─ Backend: if (!email || !password) → Error
      └─ Response: 400 "All fields required"
         └─ Frontend: Validation error shown

7. DATABASE CONNECTION FAILED
   │
   └─ MongoDB is down or unreachable
      │
      ├─ API route: connectDB() fails
      └─ Response: 500 "Server error"
         └─ Frontend: Retry or show connection error
```

## 8. Data Flow Summary

```
┌──────────────────────────────────────────────────────────────┐
│                    USER INTERACTION                          │
│                                                               │
│  Student: Fills quiz → Submit → View score                  │
│  Admin: Reviews results → Grades group → Updates metrics    │
└──────────────────────────────────────────────────────────────┘
         ↓                           ↑
         │ HTTP Requests            │ JSON Response
         │ (POST/GET/PUT)           │ (with data)
         ↓                           ↑
┌──────────────────────────────────────────────────────────────┐
│                    API ROUTES                                │
│                                                               │
│  1. Validate request (token, inputs)                         │
│  2. Process business logic (calculate score)                 │
│  3. Query/Update database                                    │
│  4. Return response                                          │
└──────────────────────────────────────────────────────────────┘
         ↓                           ↑
         │ DB Query                  │ Query Result
         │ (find, update, create)    │ (documents)
         ↓                           ↑
┌──────────────────────────────────────────────────────────────┐
│                      DATABASE                                │
│                                                               │
│  Collections:                                                │
│  - users (45 documents)                                      │
│  - questions (50 documents)                                  │
│  - submissions (180 documents)                               │
│  - groups (5 documents)                                      │
│  - groupsubmissions (5 documents)                            │
└──────────────────────────────────────────────────────────────┘

TYPICAL REQUEST-RESPONSE TIMELINE:

0ms    ┌─ User clicks "Submit Quiz"
       │  Frontend triggers POST /api/submissions
       │
10ms   │ ┌─ HTTP travels to server
       │ │  Middleware verifies token
       │ │
20ms   │ │ ┌─ API route starts processing
       │ │ │  connectDB() connects to MongoDB
       │ │ │
30ms   │ │ │ ┌─ Server validates inputs
       │ │ │ │  Checks answer range
       │ │ │ │
40ms   │ │ │ │ ┌─ Query: Fetch existing submission
       │ │ │ │ │  SELECT submissions WHERE userId=X topicId=Y
       │ │ │ │ │
50ms   │ │ │ │ │ ┌─ Query: Fetch questions
       │ │ │ │ │ │  SELECT questions WHERE category=topic1
       │ │ │ │ │ │
70ms   │ │ │ │ │ │ ┌─ Calculate score server-side
       │ │ │ │ │ │ │  Compare answers to correct answers
       │ │ │ │ │ │ │
80ms   │ │ │ │ │ │ │ ┌─ Create submission record
       │ │ │ │ │ │ │ │  INSERT INTO submissions VALUES(...)
       │ │ │ │ │ │ │ │
100ms  │ │ │ │ │ │ │ └─ Response JSON created
       │ │ │ │ │ │ │
110ms  │ │ │ │ │ │ └─ HTTP response sent to browser
       │ │ │ │ │ │
120ms  │ │ │ │ │ └─ Browser receives response
       │ │ │ │ │
       │ │ │ │ └─ JavaScript parses JSON
       │ │ │ │
       │ │ │ └─ Display result to user ✓
       │ │ │
       └─ User sees: "Your score: 16/20"

TOTAL TIME: ~120ms from click to result
```

---

**Key Takeaways**:

1. **Authentication**: JWT tokens in HTTPOnly cookies, verified in middleware
2. **Quiz Flow**: Answer submission → Server validation → Server scoring → Result
3. **Security**: All scoring done server-side, no client calculation trusted
4. **Aggregation**: Admin dashboard aggregates from multiple collections
5. **Groups**: Group scores calculated once during grading, then used in aggregation
6. **Errors**: Comprehensive validation at API level prevents data corruption

---
