# Component & Module Reference Guide

## Navigation Map

### Frontend Routes Structure

```
/ (Landing Page)
├── Unauthenticated users
├── Shows quiz topics overview
└── Links to /auth/login and /auth/signup

/auth/login (Login Page)
├── Email + Password form
├── POST /api/auth/login
└── Redirect: Success → /dashboard or /admin

/auth/signup (Signup Page)
├── Name + Email + Password + Group form
├── POST /api/auth/signup
└── Redirect: Success → /auth/login

/dashboard (Student Dashboard) [Protected]
├── Overview of student's progress
├── Quiz cards for each topic
├── Group assignment section
├── Stats (completed, score)
└── Links to /dashboard/quiz, /dashboard/scores

/dashboard/quiz (Quiz Taker) [Protected]
├── Interactive quiz interface
├── Timer countdown
├── Question/Answer display
├── POST /api/submissions on submit
└── Redirect to result page

/dashboard/scores (Student Scores) [Protected]
├── Table of all submissions
├── Score breakdown
├── Link to /dashboard/review

/dashboard/review (Review Answers) [Protected]
├── Side-by-side answer comparison
├── Shows correct answers
└── Answer explanations

/admin (Admin Dashboard) [Protected - Admin Only]
├── Metrics/KPIs
├── Average, highest, lowest scores
├── Completion rate
└── Quick action links

/admin/questions (Manage Questions) [Protected - Admin Only]
├── List all questions by topic
├── Create, edit, delete questions
├── Bulk import (if implemented)
└── GET /api/questions, POST /api/questions

/admin/results (Student Results) [Protected - Admin Only]
├── Table of all students + scores
├── Aggregated data from /api/admin/submissions
├── Export functionality
└── Filter/sort options

/admin/grading (Grade Group Submissions) [Protected - Admin Only]
├── List ungraded group submissions
├── Download/preview files
├── Enter score + feedback
└── POST /api/admin/submissions/[id]/grade

/admin/assignment (View Assignments) [Protected - Admin Only]
└── Browse all group assignments
```

---

## Component Dependency Tree

### Root Layout (`app/layout.tsx`)

```
RootLayout
├── Providers (React Query, etc.)
└── Children pages
    │
    ├── Landing Page
    │   ├── Header (Logo, Nav)
    │   ├── Hero Section
    │   ├── Topics Grid
    │   │   ├── Topic Card
    │   │   └── CTA Buttons
    │   └── Footer
    │
    ├── Auth Pages (Login/Signup)
    │   └── Form Component
    │       ├── Input Fields
    │       ├── Validation Messages
    │       └── Submit Button
    │
    ├── Dashboard Layout
    │   ├── StudentSidebar
    │   │   ├── Logo
    │   │   ├── Nav Items (5)
    │   │   ├── User Info
    │   │   └── Logout Button
    │   │
    │   └── Main Content
    │       ├── Dashboard Page
    │       │   ├── Welcome Banner
    │       │   ├── Stats Grid
    │       │   │   ├── Completed Count Card
    │       │   │   ├── Completion % Card
    │       │   │   └── Total Score Card
    │       │   ├── Quiz Cards Grid
    │       │   │   └── Topic Cards (5)
    │       │   └── Group Assignment Section
    │       │       ├── Status Display
    │       │       ├── File Upload Form
    │       │       └── Submitted File Display
    │       │
    │       ├── Quiz Page
    │       │   ├── Header (Back button, Timer)
    │       │   ├── Timer Display
    │       │   │   ├── Total time
    │       │   │   ├── Elapsed time
    │       │   │   └── Warnings
    │       │   ├── Question Container
    │       │   │   ├── Question Text
    │       │   │   ├── Answer Options
    │       │   │   │   └── Radio/Checkbox inputs
    │       │   │   └── Answer Indicator
    │       │   ├── Navigation Buttons
    │       │   │   ├── Previous Button
    │       │   │   ├── Next Button
    │       │   │   └── Submit Button
    │       │   └── Progress Tracker
    │       │       ├── Question numbers
    │       │       └── Answered count
    │       │
    │       ├── Scores Page
    │       │   ├── Table
    │       │   │   ├── Topic column
    │       │   │   ├── Score column
    │       │   │   ├── Percentage column
    │       │   │   ├── Date column
    │       │   │   └── Action column
    │       │   └── Summary stats
    │       │
    │       └── Review Page
    │           ├── Question Display
    │           │   ├── Your answer
    │           │   ├── Correct answer
    │           │   └── Explanation
    │           └── Navigation
    │
    └── Admin Layout
        ├── AdminSidebar
        │   ├── Logo
        │   ├── Nav Items (4)
        │   ├── Admin Info
        │   └── Logout Button
        │
        └── Main Content
            ├── Admin Dashboard Page
            │   ├── Header Section
            │   ├── Metrics Cards (4)
            │   │   ├── Total Students Card
            │   ├── Average Score Card
            │   ├── Highest Score Card
            │   └── Completion Rate Card
            │   ├── Score Distribution Chart
            │   └── Quick Actions
            │       ├── Manage Questions Button
            │       ├── View Results Button
            │       └── Grade Assignments Button
            │
            ├── Questions Page
            │   ├── Topic Filter Tabs
            │   ├── Question List
            │   │   ├── Question Item
            │   │   │   ├── Question Text
            │   │   │   ├── Options Display
            │   │   │   ├── Edit Button
            │   │   │   └── Delete Button
            │   │   └── Create Question Form
            │   │       ├── Question input
            │   │       ├── Options inputs (4)
            │   │       ├── Correct answer selector
            │   │       └── Submit button
            │   └── Bulk Upload (optional)
            │
            ├── Results Page
            │   ├── Filter Section
            │   │   └─ Filter by group
            │   ├── Results Table
            │   │   ├── Student Name
            │   │   ├── Email
            │   │   ├── Group
            │   │   ├── Topic 1 Score
            │   │   ├── Topic 2 Score
            │   │   ├── Topic 3 Score
            │   │   ├── Topic 4 Score
            │   │   ├── Group Score
            │   │   └── Total Score
            │   ├── Export Button
            │   └── Actions (View student detail)
            │
            ├── Grading Page
            │   ├── Submissions List
            │   │   ├── Group Number
            │   │   ├── File Name
            │   │   ├── Uploaded By
            │   │   ├── Date
            │   │   ├── Status Badge
            │   │   └── Grade Button
            │   └── Grading Modal
            │       ├── File Preview/Download
            │       ├── Score Input (0-20)
            │       ├── Feedback Textarea
            │       └── Submit Grade Button
            │
            └── Assignment Page
                ├── Group Filter
                └── Assignment Cards
                    ├── File info
                    └── Download button
```

---

## Hook Usage Map

### Authentication Hooks (`hooks/useAuth.ts`)

```
useCurrentUser()
├── Query key: ["currentUser"]
├── Endpoint: GET /api/auth/me
├── Returns: User | null
├── Usage locations:
│   ├── app/page.tsx (redirect if authenticated)
│   ├── app/dashboard/layout.tsx (check role)
│   ├── app/dashboard/page.tsx (welcome message)
│   ├── app/admin/layout.tsx (check role)
│   └── app/admin/page.tsx (admin checks)
└── Caching: 10 min stale, 30 min gc

useLogin()
├── Endpoint: POST /api/auth/login
├── Input: { email, password }
├── Returns: User object
├── Usage: app/auth/login/page.tsx
└── On success: invalidate currentUser query

useSignup()
├── Endpoint: POST /api/auth/signup
├── Input: { fullName, email, password, group }
├── Returns: User object
├── Usage: app/auth/signup/page.tsx
└── On success: redirect to login

useLogout()
├── Endpoint: POST /api/auth/logout
├── Returns: void
├── Usage: Both dashboard and admin layouts
├── On success:
│   ├── Invalidate currentUser query
│   └── Clear cache
└── Redirect to /auth/login
```

### Submission Hooks (`hooks/useSubmissionsWithRefetch.ts`)

```
useSubmissionsWithRefetch()
├── Query key: ["submissions"]
├── Endpoint: GET /api/submissions
├── Returns: Submission[] (with scores and metadata)
├── Usage: app/dashboard/page.tsx
├── Purpose: Get all quizzes completed by student
├── Special: Has refetch capability for post-submit
└── Caching: Regular react-query caching

useGroupSubmissions()
├── Query key: ["groupSubmissions", groupNumber]
├── Endpoint: GET /api/submissions/group?groupNumber=X
├── Input: groupNumber
├── Returns: GroupSubmission object
├── Usage: app/dashboard/page.tsx
├── Purpose: Get group assignment status
└── Shows: Uploaded file, grade, feedback
```

### Admin Hooks (Custom in components)

```
Admin-specific queries in components:

GET /api/admin/submissions
├── Used in: app/admin/page.tsx
├── Purpose: Calculate metrics (avg, highest, lowest)
└── Returns: StudentResult[]

GET /api/admin/submissions/groups
├── Used in: app/admin/grading/page.tsx
├── Purpose: List group submissions for grading
└── Returns: GroupSubmission[]

GET /api/questions?category=topic1
├── Used in: app/admin/questions/page.tsx
├── Purpose: List questions by topic
└── Returns: Question[] (without correct answers for students)
```

---

## Data Flow: From Click to Database

### Example: Student Submits Quiz

```
1. USER ACTION
   ├─ Student views quiz page (/dashboard/quiz?topicId=topic1)
   ├─ Selects answers to 10 questions
   └─ Clicks "Submit Answers" button

2. FRONTEND PROCESS
   ├─ Collect form data:
   │  {
   │    topicId: "topic1",
   │    topicName: "DIRTY DOZEN",
   │    answers: {
   │      "q1": 0,
   │      "q2": 2,
   │      ...
   │    },
   │    timeSpent: 450
   │  }
   ├─ Disable submit button (prevent duplicate)
   ├─ Show loading state
   └─ POST /api/submissions

3. NETWORK REQUEST
   ├─ Browser sends HTTP request to server
   ├─ Includes session cookie with JWT token
   └─ Body: JSON with quiz data

4. SERVER MIDDLEWARE
   ├─ next.js middleware.ts processes
   ├─ Extracts token from cookie
   ├─ Verifies JWT signature
   ├─ Checks token expiration
   ├─ Decodes payload: { id, role, email, group }
   ├─ Verifies role = "student"
   ├─ Allows request to continue
   └─ Passes user info to API route

5. API ROUTE HANDLER (/api/submissions/route.ts)
   ├─ POST handler invoked
   ├─ Verify token again (double-check)
   ├─ Extract user object: { id, role, email, group }
   ├─ Validate request body:
   │  ├─ topicId exists?
   │  ├─ topicName exists?
   │  ├─ answers is object?
   │  └─ timeSpent is number?
   ├─ Check for duplicate submission:
   │  └─ await Submission.findOne({
   │       userId: user.id,
   │       topicId: "topic1"
   │     })
   │     if found → return error 403
   ├─ Fetch questions from DB:
   │  └─ await Question.find({
   │       category: "topic1"
   │     })
   │     Returns: [q1, q2, q3, ...] with correctAnswer
   ├─ Validate all answers (0-3 range):
   │  └─ for (const answer of answers) {
   │       if (answer < 0 || answer > 3)
   │         return error 400
   │     }
   ├─ Calculate score server-side:
   │  └─ let correctCount = 0;
   │     for (const q of questions) {
   │       if (answers[q._id] === q.correctAnswer) {
   │         correctCount++;
   │       }
   │     }
   │     score = correctCount * 2; // 8 correct = 16 pts
   ├─ Create submission record:
   │  └─ await Submission.create({
   │       userId: ObjectId(user.id),
   │       topicId: "topic1",
   │       topicName: "DIRTY DOZEN",
   │       answers: answers,
   │       score: 16,
   │       totalQuestions: 10,
   │       percentage: 80,
   │       timeSpent: 450
   │     })
   └─ Return success response

6. DATABASE OPERATION
   ├─ MongoDB Submission collection:
   │  INSERT new document
   │  {
   │    _id: ObjectId("..."),
   │    userId: ObjectId("user123"),
   │    topicId: "topic1",
   │    topicName: "DIRTY DOZEN",
   │    answers: {"q1": 0, "q2": 2, ...},
   │    score: 16,
   │    totalQuestions: 10,
   │    percentage: 80,
   │    timeSpent: 450,
   │    createdAt: ISODate("2024-01-15T10:30:00Z"),
   │    updatedAt: ISODate("2024-01-15T10:30:00Z")
   │  }
   ├─ Write succeeds
   └─ Return created document

7. SERVER RESPONSE
   ├─ API sends JSON response:
   │  {
   │    message: "Submission recorded",
   │    submission: {
   │      _id: "...",
   │      score: 16,
   │      percentage: 80,
   │      totalQuestions: 10
   │    }
   │  }
   ├─ Status: 201 (Created)
   └─ Network response sent

8. BROWSER RECEIVES RESPONSE
   ├─ JavaScript parses JSON
   ├─ React Query cache updates: ["submissions"]
   ├─ Local state updates with result
   ├─ Loading state removed
   ├─ Show result to user:
   │  "Quiz submitted successfully!"
   │  "Your score: 16/20 (80%)"
   ├─ Button re-enabled
   ├─ Set flag: quiz_just_submitted = true
   └─ After 2 seconds: navigate to result page

9. RESULT DISPLAY
   ├─ Show score breakdown
   ├─ Show pass/fail status
   ├─ Offer options:
   │  ├─ Review Answers
   │  └─ Back to Dashboard
   └─ Database now contains permanent record

10. DASHBOARD UPDATE
    ├─ When user navigates back to /dashboard
    ├─ useSubmissionsWithRefetch() refetches
    ├─ GET /api/submissions called
    ├─ Returns updated list with new submission
    ├─ Topic card now shows:
    │  ├─ ✓ Completed
    │  ├─ 16/20 points
    │  └─ Last taken: just now
    └─ Total score updated
```

---

## Database Collection Relationships

```
USERS
├─ _id: ObjectId (primary key)
├─ fullName: String
├─ email: String (unique)
├─ password: String (hashed)
├─ role: String ("student" or "admin")
└─ group: Number (1-5)
   │
   ├─ Referenced by ──→ SUBMISSIONS.userId
   ├─ Referenced by ──→ GROUPS.students[]
   ├─ Referenced by ──→ GROUPSUBMISSIONS.uploadedBy
   └─ Referenced by ──→ GROUPSUBMISSIONS.gradedBy

QUESTIONS
├─ _id: ObjectId
├─ question: String
├─ options: String[] (4 options)
├─ correctAnswer: Number (0-3)
└─ category: String ("topic1", "topic2", etc.)
   │
   └─ Queried by ──→ Quiz page (GET /api/questions?category=topic1)

SUBMISSIONS (Individual Quizzes)
├─ _id: ObjectId
├─ userId: ObjectId ──→ USERS._id
├─ topicId: String
├─ topicName: String
├─ answers: Map<String, Number>
├─ score: Number (0-20)
├─ percentage: Number (0-100)
├─ timeSpent: Number
├─ tabSwitches: Number
├─ createdAt: Date
└─ updatedAt: Date
   │
   └─ Aggregated by ──→ Admin dashboard (GET /api/admin/submissions)

GROUPS
├─ _id: ObjectId
├─ groupNumber: Number (1-5, unique)
├─ students: ObjectId[] ──→ USERS._id[]
├─ submissionId: ObjectId ──→ GROUPSUBMISSIONS._id
├─ score: Number (0-20, set during grading)
├─ locked: Boolean
├─ createdAt: Date
└─ updatedAt: Date
   │
   └─ Contains many ──→ USERS via students[]

GROUPSUBMISSIONS (Group Assignments)
├─ _id: ObjectId
├─ groupId: ObjectId ──→ GROUPS._id
├─ groupNumber: Number (1-5)
├─ fileUrl: String
├─ fileName: String
├─ uploadedBy: ObjectId ──→ USERS._id
├─ uploadedAt: Date
├─ score: Number (0-20, null until graded)
├─ gradedBy: ObjectId ──→ USERS._id (admin)
├─ gradedAt: Date
├─ feedback: String
├─ createdAt: Date
└─ updatedAt: Date
   │
   └─ Aggregated by ──→ Admin dashboard (GET /api/admin/submissions)
```

---

## File Structure for Future Reference

```
app/
├── api/
│   ├── auth/
│   │   ├── login/route.ts          [POST] Create JWT token
│   │   ├── signup/route.ts         [POST] Create user account
│   │   ├── logout/route.ts         [POST] Clear token
│   │   └── me/route.ts             [GET] Current user
│   ├── questions/
│   │   ├── route.ts                [GET/POST] Questions
│   │   ├── [id]/route.ts           [GET/PUT/DELETE] Single question
│   │   └── bulk/route.ts           [POST] Bulk import
│   ├── submissions/
│   │   ├── route.ts                [GET/POST] Student submissions
│   │   ├── group/route.ts          [GET/POST] Group assignments
│   │   └── review/route.ts         [GET] Review with answers
│   └── admin/
│       ├── submissions/
│       │   ├── route.ts            [GET] Aggregated results
│       │   ├── groups/route.ts     [GET] Group submissions
│       │   └── [id]/grade/route.ts [POST] Grade submission
│       └── groups/
│           ├── initialize/route.ts [POST] Create groups
│           └── test-initialize/route.ts [POST] Test data
├── auth/
│   ├── login/page.tsx              [PAGE] Login form
│   └── signup/page.tsx             [PAGE] Signup form
├── dashboard/
│   ├── layout.tsx                  [LAYOUT] Student layout with sidebar
│   ├── page.tsx                    [PAGE] Student dashboard
│   ├── quiz/page.tsx               [PAGE] Quiz taker
│   ├── scores/page.tsx             [PAGE] Student scores
│   └── review/page.tsx             [PAGE] Review answers
├── admin/
│   ├── layout.tsx                  [LAYOUT] Admin layout with sidebar
│   ├── page.tsx                    [PAGE] Admin metrics
│   ├── questions/page.tsx          [PAGE] Manage questions
│   ├── results/page.tsx            [PAGE] Student results table
│   ├── grading/page.tsx            [PAGE] Grade assignments
│   └── assignment/page.tsx         [PAGE] View assignments
├── components/
│   ├── AdminSidebar.tsx            [COMPONENT] Admin nav sidebar
│   ├── StudentSidebar.tsx          [COMPONENT] Student nav sidebar
│   └── Animatedplane.tsx           [COMPONENT] Animated icon
├── page.tsx                        [PAGE] Landing page
└── layout.tsx                      [LAYOUT] Root layout

hooks/
├── useAuth.ts                      [HOOK] Auth queries/mutations
├── useSubmissionsWithRefetch.ts   [HOOK] Student submissions
├── useGroupSubmissions.ts          [HOOK] Group submissions
├── useQuestions.ts                 [HOOK] Questions query
└── useStudentGroupSubmission.ts   [HOOK] Group assignment

lib/
├── auth.ts                         [LIB] JWT verification
├── db.ts                           [LIB] MongoDB connection
├── topicsConfig.ts                 [CONFIG] Quiz topics & settings
└── getNextGroup.ts                 [LIB] Group utility

models/
├── User.ts                         [SCHEMA] User model
├── Question.ts                     [SCHEMA] Question model
├── Submission.ts                   [SCHEMA] Quiz submission
├── Group.ts                        [SCHEMA] Group model
└── GroupSubmission.ts              [SCHEMA] Group assignment

scripts/
└── initializeGroups.ts             [SCRIPT] Setup groups manually

middleware.ts                       [MIDDLEWARE] Token verification & routing
```

---

## Common Modifications Quick Reference

| Need                     | File                                  | Change                                 |
| ------------------------ | ------------------------------------- | -------------------------------------- |
| Add quiz topic           | `lib/topicsConfig.ts`                 | Add to TOPICS array                    |
| Change max score         | `lib/topicsConfig.ts`                 | Edit pointsPerQuiz, groupProjectPoints |
| Change quiz time         | `app/dashboard/quiz/page.tsx`         | Change QUIZ_DURATION constant          |
| Modify scoring           | `app/api/submissions/route.ts`        | Change pointsPerQuestion calculation   |
| Update dashboard metrics | `app/admin/page.tsx`                  | Modify metrics calculation             |
| Change auth flow         | `middleware.ts`                       | Modify role checks                     |
| Add validation           | `app/api/*/route.ts`                  | Add checks in API route                |
| Update UI styling        | `globals.css` or `tailwind.config.ts` | Modify classes                         |
| Add new API              | `app/api/newpath/route.ts`            | Create new route file                  |
| Add user role            | `models/User.ts`                      | Update role enum                       |

---

**Navigation Tips**:

- API routes follow `/api/[resource]/[action]/route.ts` pattern
- Pages follow `/[section]/[page]/page.tsx` pattern
- Layouts wrap their section with sidebar + auth checks
- Hooks abstract API calls for reusability across components
- Models define database structure with Mongoose schemas
