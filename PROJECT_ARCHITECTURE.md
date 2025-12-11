# Airforce Quiz System - Complete Architecture & Flow Guide

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [User Roles & Access](#user-roles--access)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Frontend Components & Pages](#frontend-components--pages)
7. [User Flows](#user-flows)
8. [Key Features](#key-features)
9. [Security & Validation](#security--validation)
10. [Future Changes - Where to Go](#future-changes---where-to-go)

---

## System Overview

The Airforce Quiz System is a Next.js-based learning management platform that allows:

- **Students** to take quizzes on aviation safety topics and submit group assignments
- **Admins** to manage questions, view results, and grade group submissions
- **Groups** to collaborate on assignments and receive group scores

### Tech Stack

- **Frontend**: Next.js 14, React 18+, Tailwind CSS, React Query (TanStack Query)
- **Backend**: Node.js with Next.js API routes
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) with HTTPOnly cookies
- **UI Components**: Lucide React icons
- **Date Handling**: No external library (using native Date)

### Scoring System

- **Individual Quizzes**: 4 topics × 20 points (10 questions × 2 points each) = 80 points total
- **Group Assignment**: 20 points
- **Maximum Score**: 100 points
- **Quiz Duration**: 10 minutes per quiz

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Landing Page (/)                  Not Authenticated             │
│      ↓                                                            │
│  Auth Pages (Login/Signup)         ← JWT Token ↔ Browser       │
│      ↓                                                            │
│  ┌─────────────────────────────┬──────────────────────────────┐ │
│  │ Student Dashboard           │ Admin Dashboard              │ │
│  │ (/dashboard)                │ (/admin)                     │ │
│  │                              │                              │ │
│  │ - View Quizzes              │ - View Metrics               │ │
│  │ - Take Quizzes              │ - Manage Questions           │ │
│  │ - View My Scores            │ - View Student Results       │ │
│  │ - Submit Group Assignment   │ - Grade Group Submissions    │ │
│  └─────────────────────────────┴──────────────────────────────┘ │
│           ↓ HTTP Requests (Axios/Fetch) ↓                       │
└─────────────────────────────────────────────────────────────────┘
         ↑                                     ↑
         │                                     │
         │ (1) Middleware                      │ (2) API Routes
         │ - Token verification               │ - Auth endpoints
         │ - Role-based access                │ - Question endpoints
         │                                     │ - Submission endpoints
         ↓                                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Next.js API)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  API Routes (app/api/)                                           │
│  ├── /auth/ (Login, Signup, Logout, Me)                         │
│  ├── /questions/ (Get, Create, Update questions)                │
│  ├── /submissions/ (Submit quiz, Get submissions)               │
│  ├── /admin/ (Admin-specific endpoints)                         │
│  │   ├── /submissions (Get all student results)                 │
│  │   ├── /groups/initialize (Initialize groups)                │
│  │   └── /groups (Group management)                            │
│  │                                                               │
│  └── /quiz/ (Quiz-related endpoints)                            │
│                                                                   │
│  Authentication & Validation                                     │
│  ├── verifyToken() - JWT validation                             │
│  ├── Server-side scoring - Score calculation                   │
│  └── Password hashing - bcryptjs                               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
         ↓ Database Queries ↓
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE (MongoDB)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Collections                                                     │
│  ├── users          - Student & Admin accounts                  │
│  ├── questions      - Quiz questions by topic                   │
│  ├── submissions    - Individual quiz submissions               │
│  ├── groups         - Group definitions & members               │
│  └── groupsubmissions - Group assignment files & grades         │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## User Roles & Access

### Student Role

| Feature                 | Access | Routes                                  |
| ----------------------- | ------ | --------------------------------------- |
| View Landing Page       | ✅     | `/`                                     |
| Login                   | ✅     | `/auth/login`                           |
| Signup                  | ✅     | `/auth/signup`                          |
| Access Dashboard        | ✅     | `/dashboard` (Protected)                |
| View Quizzes            | ✅     | `/dashboard`                            |
| Take Quiz               | ✅     | `/dashboard/quiz`                       |
| View Scores             | ✅     | `/dashboard/scores`                     |
| Review Answers          | ✅     | `/dashboard/review`                     |
| Submit Group Assignment | ✅     | `/dashboard` (Group Assignment section) |
| Access Admin            | ❌     | `/admin` (Redirected)                   |

### Admin Role

| Feature                  | Access | Routes                    |
| ------------------------ | ------ | ------------------------- |
| View Admin Dashboard     | ✅     | `/admin` (Protected)      |
| View Metrics             | ✅     | `/admin`                  |
| Manage Questions         | ✅     | `/admin/questions`        |
| View Student Results     | ✅     | `/admin/results`          |
| Grade Group Submissions  | ✅     | `/admin/grading`          |
| Access Student Dashboard | ❌     | `/dashboard` (Redirected) |

### Access Control

- **Middleware** (`middleware.ts`): Validates JWT tokens and enforces role-based routing
- **Route Protection**: Protected routes check user role before rendering
- **Token Verification**: All API endpoints verify JWT tokens before processing

---

## Database Schema

### 1. User Schema

```typescript
{
  _id: ObjectId,
  fullName: String (required),
  email: String (required, unique),
  password: String (hashed, required),
  role: "student" | "admin" (default: "student"),
  group: Number (required) // 1-5 for students
  timestamps: { createdAt, updatedAt }
}
```

### 2. Question Schema

```typescript
{
  _id: ObjectId,
  question: String (required),
  options: String[] (required, 4 options),
  correctAnswer: Number (0-3, required),
  category: String (required) // "topic1", "topic2", etc.
  timestamps: { createdAt, updatedAt }
}
```

### 3. Submission Schema (Individual Quiz)

```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, required),
  topicId: String (required) // "topic1", "topic2", etc.
  topicName: String (required),
  answers: Map<QuestionId, AnswerIndex>,
  score: Number (0-20, calculated server-side),
  totalQuestions: Number (usually 10),
  percentage: Number (0-100, calculated),
  timeSpent: Number (in seconds),
  tabSwitches: Number (default: 0),
  timestamps: { createdAt, updatedAt }
}
```

### 4. Group Schema

```typescript
{
  _id: ObjectId,
  groupNumber: Number (required, unique) // 1-5
  students: ObjectId[] (ref: User),
  submissionId: ObjectId (ref: GroupSubmission),
  score: Number (0-20, set by admin during grading),
  locked: Boolean (default: false),
  timestamps: { createdAt, updatedAt }
}
```

### 5. GroupSubmission Schema

```typescript
{
  _id: ObjectId,
  groupId: ObjectId (ref: Group, required),
  groupNumber: Number (required),
  fileUrl: String (required),
  fileName: String (required),
  uploadedBy: ObjectId (ref: User, required),
  uploadedAt: Date (default: now),
  score: Number (0-20, optional, set during grading),
  gradedBy: ObjectId (ref: User),
  gradedAt: Date,
  feedback: String,
  timestamps: { createdAt, updatedAt }
}
```

### Database Indexes

```typescript
// For performance optimization
GroupSubmission:
  - groupId (1)
  - groupNumber (1)
  - uploadedBy (1)

Submission:
  - userId + topicId (unique constraint - no retakes)
```

---

## API Endpoints

### Authentication Endpoints

#### POST `/api/auth/signup`

**Purpose**: Register new student or admin user
**Request Body**:

```json
{
  "fullName": "John Mitchell",
  "email": "john@example.com",
  "password": "securePassword123",
  "group": 1
}
```

**Response** (200):

```json
{
  "message": "Signup successful",
  "user": {
    "id": "...",
    "email": "john@example.com",
    "role": "student",
    "fullName": "John Mitchell",
    "group": 1
  }
}
```

**File**: `app/api/auth/signup/route.ts`
**Security**: Passwords hashed with bcryptjs before storage

#### POST `/api/auth/login`

**Purpose**: Authenticate user and issue JWT token
**Request Body**:

```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response** (200):

```json
{
  "message": "Login successful",
  "user": { ... }
}
```

**Cookie Set**: `token` (HTTPOnly, 7-day expiry)
**File**: `app/api/auth/login/route.ts`

#### GET `/api/auth/me`

**Purpose**: Get current authenticated user
**Headers**: Cookie with JWT token (auto-sent by browser)
**Response** (200):

```json
{
  "user": {
    "_id": "...",
    "fullName": "John Mitchell",
    "email": "john@example.com",
    "role": "student",
    "group": 1
  }
}
```

**File**: `app/api/auth/me/route.ts`

#### POST `/api/auth/logout`

**Purpose**: Clear authentication token
**Response** (200):

```json
{ "message": "Logout successful" }
```

**File**: `app/api/auth/logout/route.ts`

---

### Question Endpoints

#### GET `/api/questions?category=topic1`

**Purpose**: Fetch quiz questions (without correct answers for security)
**Query Parameters**:

- `category` (optional): Filter by topic ID
  **Response** (200):

```json
[
  {
    "_id": "...",
    "question": "What is the main cause of aviation accidents?",
    "options": ["Weather", "Pilot error", "Mechanical failure", "ATC error"],
    "category": "topic1"
    // ⚠️ correctAnswer NOT included for security
  }
]
```

**File**: `app/api/questions/route.ts`

#### POST `/api/questions`

**Purpose**: Create new question (Admin only)
**Auth**: Requires valid admin JWT token
**Request Body**:

```json
{
  "question": "Question text",
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "correctAnswer": 1,
  "category": "topic1"
}
```

**Response** (201):

```json
{
  "message": "Question created",
  "question": { ... }
}
```

**File**: `app/api/questions/route.ts`

#### GET `/api/questions/[id]`

**Purpose**: Get single question with correct answer (Admin only for review)
**Auth**: Requires valid JWT token
**File**: `app/api/questions/[id]/route.ts`

---

### Submission Endpoints (Individual Quizzes)

#### POST `/api/submissions`

**Purpose**: Submit completed quiz with answers
**Request Body**:

```json
{
  "topicId": "topic1",
  "topicName": "DIRTY DOZEN",
  "answers": {
    "questionId1": 0,
    "questionId2": 2,
    "questionId3": 1
  },
  "timeSpent": 450
}
```

**Response** (201):

```json
{
  "message": "Submission recorded",
  "submission": {
    "userId": "...",
    "topicId": "topic1",
    "score": 16,
    "percentage": 80,
    "totalQuestions": 10
  }
}
```

**Security Features**:

- ✅ Validates no retakes allowed (one submission per topic per user)
- ✅ Fetches questions from DB to validate answers
- ✅ Calculates score server-side (doesn't trust client score)
- ✅ Validates all answers are 0-3 range
- ✅ Checks correct answers against DB values

**File**: `app/api/submissions/route.ts`

#### GET `/api/submissions`

**Purpose**: Get all submissions for current user
**Response** (200):

```json
{
  "submissions": [
    {
      "_id": "...",
      "topicId": "topic1",
      "topicName": "DIRTY DOZEN",
      "score": 16,
      "percentage": 80,
      "timeSpent": 450,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**File**: `app/api/submissions/route.ts`

---

### Admin Endpoints

#### GET `/api/admin/submissions`

**Purpose**: Get aggregated student results for admin dashboard
**Auth**: Requires admin role
**Response** (200):

```json
[
  {
    "userId": "...",
    "fullName": "John Mitchell",
    "email": "john@example.com",
    "group": 1,
    "topic1": 16, // Score for each quiz topic
    "topic2": 18,
    "topic3": 14,
    "topic4": 20,
    "groupScore": 18, // Score from group assignment
    "total": 86 // Sum of all topics + group score
  }
]
```

**Calculation**:

- Fetches all Submission records
- Fetches all GroupSubmission records with scores
- Maps group scores by groupNumber
- Aggregates by userId
- Sums all scores for total

**File**: `app/api/admin/submissions/route.ts`

#### GET `/api/admin/submissions/groups`

**Purpose**: Get group submissions for grading
**Response** (200):

```json
{
  "submissions": [
    {
      "_id": "...",
      "groupNumber": 1,
      "fileName": "assignment.pdf",
      "uploadedBy": { "fullName": "John Mitchell" },
      "uploadedAt": "2024-01-15T10:30:00Z",
      "score": null,
      "feedback": null
    }
  ]
}
```

**File**: `app/api/admin/submissions/groups/route.ts`

#### POST `/api/admin/submissions/[id]/grade`

**Purpose**: Grade group submission (set score and feedback)
**Request Body**:

```json
{
  "score": 18,
  "feedback": "Good work!"
}
```

**Response** (200):

```json
{
  "message": "Submission graded",
  "submission": { ... }
}
```

**File**: `app/api/admin/submissions/[id]/grade/route.ts`

#### POST `/api/admin/groups/initialize`

**Purpose**: Create and populate groups with students
**Request Body**:

```json
{
  "groupAssignments": [
    { "groupNumber": 1, "studentIds": [...] },
    { "groupNumber": 2, "studentIds": [...] }
  ]
}
```

**File**: `app/api/admin/groups/initialize/route.ts`

---

## Frontend Components & Pages

### Layout Structure

```
app/
├── layout.tsx              (Root layout, providers)
├── page.tsx                (Landing page)
├── auth/
│   ├── login/page.tsx      (Login page)
│   └── signup/page.tsx     (Signup page)
├── dashboard/
│   ├── layout.tsx          (Student dashboard layout with sidebar)
│   ├── page.tsx            (Student dashboard overview)
│   ├── quiz/page.tsx       (Quiz taker page)
│   ├── scores/page.tsx     (View student scores)
│   └── review/page.tsx     (Review submitted answers)
├── admin/
│   ├── layout.tsx          (Admin dashboard layout with sidebar)
│   ├── page.tsx            (Admin metrics/overview)
│   ├── questions/page.tsx  (Manage questions)
│   ├── results/page.tsx    (View student results)
│   ├── grading/page.tsx    (Grade group submissions)
│   └── assignment/page.tsx (View assignments)
└── components/
    ├── AdminSidebar.tsx    (Admin navigation)
    ├── StudentSidebar.tsx  (Student navigation)
    └── Animatedplane.tsx   (Animated icon component)
```

### Key Pages

#### 1. Landing Page (`app/page.tsx`)

**Purpose**: Unauthenticated homepage
**Features**:

- Redirect authenticated users to dashboard/admin
- Show quiz topics with descriptions
- Call-to-action buttons (Login/Signup)
- Display Airforce branding

**Component Hierarchy**:

```
LandingPage
├── Header (Logo + Navigation)
├── Hero Section
├── Topics Grid
└── Footer
```

#### 2. Login Page (`app/auth/login/page.tsx`)

**Purpose**: User authentication
**Form Fields**:

- Email (text input, validation)
- Password (password input, show/hide toggle)

**Features**:

- Form validation before submit
- Error message display
- Loading state during submission
- Redirect to dashboard/admin on success
- Link to signup page

**Hooks Used**:

- `useLogin()` - Mutation for login API call
- `useRouter()` - Navigation
- `useQueryClient()` - Cache invalidation

#### 3. Signup Page (`app/auth/signup/page.tsx`)

**Purpose**: New user registration
**Form Fields**:

- Full Name
- Email
- Password
- Group Selection (Dropdown: Groups 1-5)

**Features**:

- Password strength validation
- Email uniqueness check (backend)
- Group assignment during signup
- Redirect to login on success

#### 4. Student Dashboard (`app/dashboard/page.tsx`)

**Purpose**: Student hub - quizzes, scores, group assignment
**Sections**:

- Welcome banner with user name and group
- Stats grid (quizzes completed, scores, etc.)
- Quiz cards (4 individual topics + 1 group assignment)
- Group status (submission status, uploaded file)

**State Management**:

- `useCurrentUser()` - Get logged-in user info
- `useSubmissionsWithRefetch()` - Fetch student's quiz submissions
- `useGroupSubmissions()` - Fetch group assignment status

**Key Logic**:

```
Quizzes Completed = Number of submissions where topicId exists
Completion % = (completedCount / totalQuizzes) * 100
Student's Total Score = Sum of all submissions + group score
```

#### 5. Quiz Taker Page (`app/dashboard/quiz/page.tsx`)

**Purpose**: Interactive quiz interface
**Features**:

- Timer (10 minutes)
- Question navigation buttons
- Answer selection (multiple choice)
- Progress tracker (X of Y questions answered)
- Submit button

**Security**:

- Timer prevents cheating
- Tab switching detection (counts tab switches)
- Answer validation on submit
- Server-side score calculation

**Component Flow**:

```
Quiz Page
├── Timer Component
├── Question Display
│   ├── Question Text
│   └── Answer Options (radio/checkbox)
├── Navigation Buttons
├── Progress Bar
└── Submit Button
```

**Data Submission**:

```
User submits → POST /api/submissions
  ↓
Server validates answers
  ↓
Server calculates score
  ↓
Store in Submission collection
  ↓
Return score and percentage
```

#### 6. Scores Page (`app/dashboard/scores/page.tsx`)

**Purpose**: Display student's quiz results
**Table Columns**:

- Quiz Topic
- Score (X/20)
- Time Spent
- Date Taken

**Features**:

- Sorted by date (latest first)
- Shows completion status
- Group score included (if graded)
- Total score calculation

#### 7. Review Page (`app/dashboard/review/page.tsx`)

**Purpose**: Review submitted answers with corrections
**Features**:

- Display original answers
- Show correct answers
- Explain why answer was wrong/right
- Navigate between questions

**Data Flow**:

```
User clicks "Review" on quiz
  ↓
GET /api/questions/review?topicId=topic1&submissionId=...
  ↓
Fetch submission record + question data
  ↓
Match user answers with correct answers
  ↓
Display comparison view
```

#### 8. Admin Dashboard (`app/admin/page.tsx`)

**Purpose**: Admin overview and metrics
**Metrics Displayed**:

- Total Students
- Average Score
- Highest Score
- Lowest Score
- Completion Rate
- Top Performer

**Components**:

- Key metrics cards
- Score distribution chart
- Quick action buttons (links to other admin pages)

**Data Fetch**:

```
GET /api/admin/submissions
  ↓
Filter by students with submissions
  ↓
Calculate aggregated metrics
  ↓
Display on dashboard
```

#### 9. Questions Management (`app/admin/questions/page.tsx`)

**Purpose**: CRUD operations for quiz questions
**Features**:

- List all questions by topic
- Create new question
- Edit existing question
- Delete question
- Bulk upload (if implemented)

#### 10. Results Page (`app/admin/results/page.tsx`)

**Purpose**: View detailed student results
**Table Columns**:

- Student Name
- Email
- Group
- Topic 1-4 Scores
- Group Score
- Total Score

**Features**:

- Export/Download results (CSV/Excel)
- Filter by group
- Sort by score

#### 11. Grading Page (`app/admin/grading/page.tsx`)

**Purpose**: Grade group submissions
**Features**:

- List pending group submissions
- Download submitted file
- Enter score (0-20)
- Add feedback/comments
- Mark as graded

**Data Flow**:

```
Display ungraded submissions
  ↓
Admin reviews file
  ↓
Admin enters score + feedback
  ↓
POST /api/admin/submissions/[id]/grade
  ↓
Update GroupSubmission record
  ↓
Update Group.score field
  ↓
Student's total score updated
```

---

## User Flows

### 1. Student Login & Quiz Flow

```
┌─────────────────────────────────────────────────┐
│ 1. User visits landing page (/)                 │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
        ┌──────────────────────┐
        │ Authenticated?       │
        │ (useCurrentUser)     │
        └──────┬───────────┬───┘
               │           │
        No     │           │     Yes
               ▼           ▼
         Login/Signup   Dashboard
              Page      (Redirect)
               │
               ▼
    ┌──────────────────────────────┐
    │ 2. Fill login form           │
    │    - Email                   │
    │    - Password                │
    └──────────┬───────────────────┘
               │
               ▼
    ┌──────────────────────────────┐
    │ 3. POST /api/auth/login      │
    │    - Verify credentials      │
    │    - Generate JWT token      │
    │    - Set HTTPOnly cookie     │
    └──────────┬───────────────────┘
               │
               ▼
    ┌──────────────────────────────┐
    │ 4. Redirect to /dashboard    │
    │ (Browser sends cookie)       │
    └──────────┬───────────────────┘
               │
               ▼
    ┌──────────────────────────────┐
    │ 5. Dashboard Layout Check    │
    │ - Middleware verifies token  │
    │ - Renders StudentSidebar     │
    └──────────┬───────────────────┘
               │
               ▼
    ┌──────────────────────────────┐
    │ 6. Dashboard Page Loads      │
    │ - Fetch current user         │
    │ - Fetch submissions          │
    │ - Display quiz cards         │
    └──────────┬───────────────────┘
               │
               ▼
    ┌──────────────────────────────┐
    │ 7. Student clicks quiz       │
    │    (e.g., "Start Topic 1")   │
    └──────────┬───────────────────┘
               │
               ▼
    ┌──────────────────────────────┐
    │ 8. Navigate to /dashboard/   │
    │    quiz?topicId=topic1       │
    └──────────┬───────────────────┘
               │
               ▼
    ┌──────────────────────────────┐
    │ 9. Quiz Page Loads           │
    │ - GET /api/questions?        │
    │   category=topic1            │
    │ - Start 10-minute timer      │
    │ - Display first question     │
    └──────────┬───────────────────┘
               │
               ▼
    ┌──────────────────────────────┐
    │ 10. Student answers questions│
    │ - Select answers             │
    │ - Navigate between questions │
    │ - Track progress             │
    └──────────┬───────────────────┘
               │
               ▼
    ┌──────────────────────────────┐
    │ 11. Student submits quiz     │
    │ - POST /api/submissions      │
    │ - Sends: answers, time spent │
    │ - Server calculates score    │
    │ - NO score sent from client  │
    └──────────┬───────────────────┘
               │
               ▼
    ┌──────────────────────────────┐
    │ 12. Result Shown to Student  │
    │ - Score (X/20)               │
    │ - Percentage                 │
    │ - Option to review answers   │
    │ - Redirect to dashboard      │
    └─────────────────────────────┘
```

### 2. Student Group Assignment Flow

```
Dashboard
   │
   ▼
Student views Group Assignment card
   │
   ▼
Checks if group has submitted
   │
   ├─ No submission yet
   │  └─→ Show "Upload Assignment" button
   │
   └─ Already submitted
      └─→ Show uploaded file + status
         (Awaiting grading / Graded)

Student clicks "Upload Assignment"
   │
   ▼
File upload dialog appears
   │
   ▼
Student selects PDF/DOC file
   │
   ▼
POST /api/submissions/group
   - groupId
   - groupNumber
   - file (uploaded to storage/S3)
   │
   ▼
GroupSubmission record created
   │
   ▼
Admin notified of submission
   │
   ▼
Dashboard shows "Submitted" status
   │
   ▼
(Awaiting Admin Grading)
   │
   ▼
Admin grades submission
(See Admin flow below)
   │
   ▼
Student's total score updated
```

### 3. Admin Grading Flow

```
Admin visits /admin/grading
   │
   ▼
GET /api/admin/submissions/groups
   │
   ▼
Display list of ungraded submissions
   │
   │ Column headers:
   ├─ Group Number
   ├─ Upload Date
   ├─ Uploaded By
   ├─ File Name
   └─ Status (Ungraded/Graded)
   │
   ▼
Admin clicks on a submission
   │
   ▼
Preview/Download file
   │
   ▼
Review student work
   │
   ▼
Enter score (0-20 points)
Enter feedback/comments
   │
   ▼
Click "Grade Submission"
   │
   ▼
POST /api/admin/submissions/[id]/grade
   - score: 18
   - feedback: "Excellent work!"
   │
   ▼
Update GroupSubmission:
   - Set score = 18
   - Set gradedAt = now
   - Set gradedBy = admin ID
   - Set feedback = message
   │
   ▼
Update Group.score = 18
   │
   ▼
Admin confirms submission graded
   │
   ▼
Student can now see:
   - Group score on dashboard
   - Updated total score
   - Feedback in group details
```

### 4. Admin Viewing Results Flow

```
Admin visits /admin/results
   │
   ▼
GET /api/admin/submissions
   │
   ▼
Aggregate data:
   - Fetch all submissions
   - Group by userId
   - Sum scores for each topic
   - Include group scores
   - Calculate totals
   │
   ▼
Display table:
┌──────────────────────────────────┐
│ Name  │ Topic1 │ Topic2 │ Total  │
├──────────────────────────────────┤
│ John  │  16    │  18    │  34    │
│ Jane  │  20    │  14    │  34    │
│ Mike  │  12    │  16    │  28    │
└──────────────────────────────────┘
   │
   ▼
Admin can:
├─ Sort by column
├─ Filter by group
├─ Export results (CSV)
└─ Click on student to see details
```

---

## Key Features

### 1. Authentication & Authorization

- **JWT Tokens**: 7-day expiry, stored in HTTPOnly cookies
- **Role-based Access**: Student vs Admin enforcement at middleware level
- **Password Hashing**: bcryptjs with salt rounds
- **Token Verification**: All API routes verify token before processing

### 2. Quiz Management

- **4 Topics + Group Assignment**: 5 total quizzes/assignments
- **Timed Quizzes**: 10 minutes per quiz
- **No Retakes**: Server validates one submission per topic per user
- **Server-side Scoring**: Prevents client-side tampering
- **Answer Validation**: Ensures answers are within valid range (0-3)

### 3. Scoring System

- **Points Per Question**: 2 points (10 questions × 2 = 20 points per quiz)
- **Percentage Calculation**: (Correct Answers / Total Questions) × 100
- **Total Score**: Sum of all quiz scores (0-80) + group score (0-20) = 0-100
- **Group Score**: Set by admin during grading (0-20 points)

### 4. Group System

- **5 Groups**: Groups 1-5, each with multiple students
- **Group Assignment**: Collaborative project submission
- **File Upload**: Students upload PDF/document for group project
- **Grading**: Admin grades submission, assigns score, adds feedback
- **Score Distribution**: Group score distributed to all members

### 5. Security Measures

- ✅ **No Client Score Calculation**: Server calculates all scores
- ✅ **Answer Validation**: Checks answers are 0-3 range
- ✅ **JWT Token Verification**: All endpoints verify token
- ✅ **No Duplicate Submissions**: Checks existing submissions
- ✅ **No Correct Answers to Client**: Frontend never receives correct answers
- ✅ **HTTPOnly Cookies**: Token can't be accessed by JavaScript
- ✅ **Password Hashing**: Bcryptjs with salt
- ✅ **Role Enforcement**: Middleware blocks unauthorized access

### 6. Caching & Performance

- **React Query**: Efficient data fetching with caching
- **Stale Time**: User data cached for 10 minutes
- **GC Time**: Data kept in cache for 30 minutes
- **Refetch Strategy**: Refetch on window focus, not on mount
- **Lazy Loading**: Questions fetched only when quiz starts

### 7. User Experience

- **Animated Components**: Plane icons for branding
- **Loading States**: Spinners while fetching data
- **Error Handling**: User-friendly error messages
- **Toast Notifications**: Success/error feedback
- **Responsive Design**: Mobile, tablet, desktop optimized

---

## Security & Validation

### Server-side Protection Layers

#### 1. Submission Scoring Protection

```typescript
// Layer 1: Verify user is authenticated
const user = await verifyToken(cookieString);

// Layer 2: Check no duplicate submission
const existing = await Submission.findOne({
  userId: user.id,
  topicId: data.topicId
});

// Layer 3: Fetch questions from DB (source of truth)
const questions = await Question.find({
  category: data.topicId
});

// Layer 4: Validate all answers are in range (0-3)
for (const answer of Object.values(data.answers)) {
  if (answer < 0 || answer > 3) {
    return error: "Invalid answers submitted"
  }
}

// Layer 5: Compare answers to DB correctAnswer
let correctCount = 0;
for (const question of questions) {
  if (userAnswer === question.correctAnswer) {
    correctCount++;
  }
}

// Layer 6: Calculate score server-side (NOT from client)
const score = correctCount * 2; // Server calculates
```

### Password Security

```typescript
// Signup: Hash password before storing
import bcrypt from "bcryptjs";
const hashedPassword = await bcrypt.hash(password, 10);
await User.create({ password: hashedPassword, ... });

// Login: Compare hashed password
const isValid = await bcrypt.compare(
  submittedPassword,
  user.password
);
```

### JWT Token Security

```typescript
// Generate token
const token = await new SignJWT({
  id: user._id,
  role: user.role,
})
  .setProtectedHeader({ alg: "HS256" })
  .setExpirationTime("7d")
  .sign(secret);

// Set as HTTPOnly cookie (can't be accessed by JS)
res.cookies.set("token", token, {
  httpOnly: true, // ✅ Can't access from JS
  secure: isProd, // ✅ HTTPS only in production
  sameSite: "lax", // ✅ CSRF protection
  maxAge: 7 * 24 * 60 * 60, // ✅ 7 day expiry
});
```

### Input Validation

```typescript
// All API routes validate inputs
if (!email || !password) {
  return error: "All fields required"
}

if (email.length > 255 || !email.includes("@")) {
  return error: "Invalid email"
}

if (password.length < 8) {
  return error: "Password too short"
}
```

### Middleware Route Protection

```typescript
// All /admin routes check role
if (decoded.role !== "admin") {
  return redirect("/unauthorized");
}

// All /dashboard routes check role
if (decoded.role !== "student") {
  return redirect("/unauthorized");
}

// Invalid tokens clear cookie and redirect
if (tokenVerificationFails) {
  res.cookies.set("token", "", { maxAge: 0 });
  return redirect("/auth/login");
}
```

---

## Future Changes - Where to Go

### Adding New Features

#### ✅ Add a New Quiz Topic

1. **Add to Config**: `lib/topicsConfig.ts`

   ```typescript
   export const TOPICS = [
     // ... existing topics
     {
       id: "topic6",
       label: "New Topic",
       description: "Description",
     },
   ];
   ```

2. **Create Questions**: Use admin page `/admin/questions`

   - Click "Create Question"
   - Select category: `topic6`
   - Add question, options, correct answer
   - Save

3. **Update Dashboard**: `app/dashboard/page.tsx`

   - Automatically displays all topics from TOPICS config
   - No changes needed! (Uses TOPICS from config)

4. **Update Scoring**: If changing points per question
   - Edit `QUIZ_CONFIG.pointsPerQuiz` in `lib/topicsConfig.ts`
   - Edit calculation in `app/api/submissions/route.ts`

---

#### ✅ Change Scoring System

**Current**: 4 quizzes × 20 points + 20 group = 100 total

**To change**:

1. Edit `lib/topicsConfig.ts`:

   ```typescript
   export const QUIZ_CONFIG = {
     pointsPerQuiz: 25, // ← Change this
     questionsPerQuiz: 10,
     groupProjectPoints: 30, // ← Or this
   };
   ```

2. Update API calculation in `app/api/submissions/route.ts`:

   ```typescript
   const pointsPerQuestion = 2.5; // 25 points / 10 questions
   const scoreInPoints = correctAnswers * pointsPerQuestion;
   ```

3. Update frontend display in `app/dashboard/scores/page.tsx`
   - May need to adjust table formatting for new max score

---

#### ✅ Add New User Role (e.g., Instructor)

1. **Update User Schema**: `models/User.ts`

   ```typescript
   role: "student" | "admin" | "instructor";
   ```

2. **Update Middleware**: `middleware.ts`

   ```typescript
   if (req.nextUrl.pathname.startsWith("/instructor")) {
     if (decoded.role !== "instructor") {
       return redirect("/unauthorized");
     }
   }
   ```

3. **Create New Routes**: `app/instructor/`

   - Copy structure from `/admin` or `/dashboard`
   - Add new pages/components

4. **Update Login Logic**: `app/auth/login/page.tsx`
   ```typescript
   if (user.role === "admin") router.push("/admin");
   else if (user.role === "instructor") router.push("/instructor");
   else router.push("/dashboard");
   ```

---

#### ✅ Modify Question Format

**Current**: Multiple choice (4 options, 1 correct)

**To add True/False questions**:

1. Update `Question Schema`: `models/Question.ts`

   ```typescript
   questionType: "multiple-choice" | "true-false",
   options: String[] // For MC, [] for T/F
   ```

2. Update Question Creation: `app/api/questions/route.ts`

   - Add questionType field
   - Validate based on type

3. Update Quiz Page: `app/dashboard/quiz/page.tsx`

   - Render different UI for T/F vs MC
   - Handle answer indexing differently

4. Update Submission: `app/api/submissions/route.ts`
   - Validate answer based on question type

---

#### ✅ Add File Upload for Group Assignment

**Current**: Basic form submission

**To add file upload**:

1. Choose storage: AWS S3, Google Cloud Storage, or local
2. Update GroupSubmission form: `app/dashboard/page.tsx`

   ```typescript
   const handleFileUpload = async (file: File) => {
     const formData = new FormData();
     formData.append("file", file);
     const response = await fetch("/api/submissions/group/upload", {
       method: "POST",
       body: formData,
     });
   };
   ```

3. Create endpoint: `app/api/submissions/group/upload/route.ts`

   - Handle multipart form data
   - Upload to storage service
   - Get file URL
   - Create GroupSubmission record

4. Update Admin Grading: `app/admin/grading/page.tsx`
   - Display file preview/download link
   - Show file info (name, size, upload date)

---

#### ✅ Add Real-time Notifications

**Use Cases**: Submission graded, Group uploaded, Admin alerts

**Implementation**:

1. Install WebSocket library: `socket.io` or `ws`
2. Create Socket server in Next.js
3. Setup event listeners in components:
   ```typescript
   useEffect(() => {
     socket.on("submissionGraded", (data) => {
       queryClient.invalidateQueries({ queryKey: ["submissions"] });
       showNotification("Your submission has been graded!");
     });
   }, []);
   ```

---

#### ✅ Add Dashboard Analytics

**New Features**: Score trends, time analysis, comparison charts

**Where to add**:

1. Create new page: `app/admin/analytics/page.tsx`
2. Add new endpoints:

   - `GET /api/admin/analytics/trends` - Score trends over time
   - `GET /api/admin/analytics/time-analysis` - Time spent analysis
   - `GET /api/admin/analytics/topic-performance` - Per-topic stats

3. Use charting library (Chart.js, Recharts):
   ```tsx
   import { LineChart, Line } from "recharts";
   <LineChart data={trendData}>
     <Line dataKey="averageScore" />
   </LineChart>;
   ```

---

#### ✅ Add Email Notifications

**Events**: Account created, Quiz submitted, Results ready

**Implementation**:

1. Install: `nodemailer` or SendGrid SDK
2. Create email service: `lib/email.ts`

   ```typescript
   export async function sendSubmissionEmail(user, submission) {
     const mailOptions = {
       to: user.email,
       subject: "Quiz Submitted",
       html: `<p>Your quiz score: ${submission.score}/20</p>`,
     };
     await transporter.sendMail(mailOptions);
   }
   ```

3. Call from API endpoints:
   ```typescript
   // In POST /api/submissions
   await sendSubmissionEmail(user, submission);
   ```

---

#### ✅ Add Bulk Question Import

**Feature**: Import questions from CSV/JSON

**Where to add**:

1. Create endpoint: `app/api/questions/bulk/route.ts`
2. Add UI in admin page: `app/admin/questions/page.tsx`

   - File upload input
   - Preview before import
   - Progress bar for batch insert

3. Parse CSV/JSON:
   ```typescript
   const questions = parseCSV(file);
   await Question.insertMany(questions);
   ```

---

#### ✅ Add Student Groups Export

**Feature**: Export results to Excel/PDF

**Where to add**:

1. Install: `exceljs` or `pdfkit`
2. Create endpoint: `app/api/admin/export/results`
3. Add button in results page: `app/admin/results/page.tsx`
   ```tsx
   <button onClick={handleExport}>Download Excel</button>
   ```

---

### Common Code Locations

| Task                         | File                             | Lines           |
| ---------------------------- | -------------------------------- | --------------- |
| Change scoring system        | `lib/topicsConfig.ts`            | 1-30            |
| Add/edit quiz topics         | `lib/topicsConfig.ts`            | 15-30           |
| Modify authentication        | `app/api/auth/*/route.ts`        | Varies          |
| Change quiz duration         | `app/dashboard/quiz/page.tsx`    | ~20             |
| Update dashboard metrics     | `app/admin/page.tsx`             | 200-350         |
| Modify question creation     | `app/api/questions/route.ts`     | 1-50            |
| Change submission validation | `app/api/submissions/route.ts`   | 50-120          |
| Update UI themes             | `globals.css` or Tailwind config | Varies          |
| Add new API endpoint         | `app/api/*/route.ts`             | Create new file |
| Create new admin page        | `app/admin/*/page.tsx`           | Create new file |

---

## Database Connection & Environment Setup

### Required Environment Variables

```bash
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=your-super-secret-key-min-32-chars
NODE_ENV=development  # or production
```

### Initial Setup

1. Ensure MongoDB is running/connected
2. On first run, groups are initialized via:
   - `app/scripts/initializeGroups.ts` (manual script)
   - OR `POST /api/admin/groups/initialize` (API endpoint)

### Database Connection

- Uses `mongoose.connect()` in `lib/db.ts`
- Connection established on each API route call
- Checks connection state to avoid duplicate connections

---

## Deployment Checklist

- [ ] Set environment variables in production
- [ ] Set `NODE_ENV=production`
- [ ] Ensure JWT_SECRET is strong (32+ characters)
- [ ] Set `secure: true` for cookies in production (HTTPS)
- [ ] Test all API endpoints in production
- [ ] Verify database backups
- [ ] Set up monitoring/logging
- [ ] Configure CORS if needed
- [ ] Test file uploads if using external storage
- [ ] Verify email sending if implemented

---

## Support & Documentation

**File Locations Reference**:

- Authentication logic: `lib/auth.ts`, `app/api/auth/`
- Database models: `models/`
- API routes: `app/api/`
- Frontend pages: `app/*/page.tsx`
- Components: `app/components/`
- Utilities: `lib/`
- Hooks: `hooks/`

**Common Questions**:

1. **Where do I add new quiz topics?**
   → `lib/topicsConfig.ts` in TOPICS array

2. **How do I change the total score?**
   → `lib/topicsConfig.ts` QUIZ_CONFIG values

3. **Where is question security implemented?**
   → `app/api/submissions/route.ts` validation layers

4. **How do I add a new admin page?**
   → Create `app/admin/newpage/page.tsx` (follows Next.js conventions)

5. **How do I modify student dashboard?**
   → `app/dashboard/page.tsx` main dashboard or `/quiz`, `/scores`, etc. for subpages

---

**Last Updated**: December 2024
**System Version**: 1.0
**Framework**: Next.js 14 + React 18+
