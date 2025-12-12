# Quick Start Guide - Finding & Modifying Features

When you need to make a change to the system, this guide shows you exactly where to go.

---

## 🎯 Feature: Quiz Topics

### View/Edit Topics

1. **See what topics exist**: `lib/topicsConfig.ts` → `TOPICS` array

   ```typescript
   export const TOPICS = [
     {
       id: "topic1",
       label: "DIRTY DOZEN",
       description: "Learn about the 12 most common aviation errors",
     },
     // ... 4 more topics
   ];
   ```

2. **Student sees them at**:

   - Landing page: `app/page.tsx` (displays TOPICS list)
   - Dashboard: `app/dashboard/page.tsx` (shows as quiz cards)

3. **Admin creates questions**:
   - `/admin/questions` page
   - POST `/api/questions` (creates questions for a topic)

### To Add New Topic:

1. Open `lib/topicsConfig.ts`
2. Add object to TOPICS array:
   ```typescript
   {
     id: "topic6",
     label: "New Topic Name",
     description: "Description here"
   }
   ```
3. Update max quiz count:
   ```typescript
   export const QUIZ_CONFIG = {
     totalQuizzes: 6, // ← Change from 5
   };
   ```
4. Create 10 questions via `/admin/questions` for `topic6`

---

## 🎯 Feature: Scoring & Points

### View Current Scoring

**File**: `lib/topicsConfig.ts`

```typescript
export const QUIZ_CONFIG = {
  totalQuizzes: 5, // 5 topics
  pointsPerQuiz: 20, // Each = 20 points
  questionsPerQuiz: 10, // 10 questions per quiz
  groupProjectPoints: 20, // Group assignment
  quizDurationSeconds: 600, // 10 minutes
};
// Max possible: 5*20 + 20 = 120 points
```

### To Change Scoring:

1. **Increase points per quiz** (e.g., 25 instead of 20):

   - Edit `lib/topicsConfig.ts`: `pointsPerQuiz: 25`
   - Edit `app/api/submissions/route.ts`: `const pointsPerQuestion = 2.5;`
   - Max possible now: 125 + 20 = 145

2. **Increase group points** (e.g., 30 instead of 20):

   - Edit `lib/topicsConfig.ts`: `groupProjectPoints: 30`
   - Max possible now: 100 + 30 = 130

3. **Change number of questions** (e.g., 15 instead of 10):
   - Edit `lib/topicsConfig.ts`: `questionsPerQuiz: 15`
   - When creating questions in admin, add 15 questions per topic

### Scoring Calculation Happens At:

- **Server-side** (security critical): `app/api/submissions/route.ts`
  ```typescript
  let correctAnswers = 0;
  for (const question of questions) {
    if (userAnswer === question.correctAnswer) {
      correctAnswers++;
    }
  }
  const scoreInPoints = correctAnswers * pointsPerQuestion;
  ```

---

## 🎯 Feature: Quiz Duration/Time Limit

### View Current Duration

**File**: `lib/topicsConfig.ts`

```typescript
quizDurationSeconds: 600,  // 10 minutes
```

### To Change Duration:

**Option 1** (Recommended): Edit config file

1. Open `lib/topicsConfig.ts`
2. Change `quizDurationSeconds: 300` (5 minutes)
3. This cascades to all quizzes automatically

**Option 2** (Override in quiz page):

1. Open `app/dashboard/quiz/page.tsx`
2. Find: `const QUIZ_DURATION = QUIZ_CONFIG.quizDurationSeconds;`
3. Change to: `const QUIZ_DURATION = 300;` (5 minutes)

### Time Display

- Timer shows in quiz page header
- Format: MM:SS (e.g., "9:45" for 9 minutes 45 seconds)
- Warning alert at 1 minute remaining
- Auto-submit when time expires

---

## 🎯 Feature: User Registration / Signup

### Where Signup Happens

- **Page**: `app/auth/signup/page.tsx`
- **API Endpoint**: POST `/api/auth/signup`
- **Database**: `models/User.ts`

### Signup Fields

Currently required:

- Full Name (string)
- Email (string, unique)
- Password (string, hashed)
- Group (number 1-5)

### To Add New Field (e.g., Phone Number):

1. **Update User Model** (`models/User.ts`):

   ```typescript
   const UserSchema = new Schema<IUser>(
     {
       fullName: { type: String, required: true },
       email: { type: String, required: true, unique: true },
       password: { type: String, required: true },
       role: { type: String, enum: ["student", "admin"], default: "student" },
       group: { type: Number, required: true },
       phone: { type: String }, // ← ADD THIS
     },
     { timestamps: true }
   );
   ```

2. **Update Signup API** (`app/api/auth/signup/route.ts`):

   ```typescript
   const { fullName, email, password, group, phone } = await req.json(); // ← Add phone
   const hashedPassword = await bcrypt.hash(password, 10);
   const user = await User.create({
     fullName,
     email,
     password: hashedPassword,
     role: "student",
     group,
     phone, // ← ADD THIS
   });
   ```

3. **Update Signup Form** (`app/auth/signup/page.tsx`):

   ```tsx
   const [formData, setFormData] = useState({
     fullName: "",
     email: "",
     password: "",
     group: 1,
     phone: "", // ← ADD THIS
   });

   // Add input in form:
   <input
     type="tel"
     name="phone"
     value={formData.phone}
     onChange={handleChange}
     placeholder="Phone Number"
   />;
   ```

4. **Update Hook** (`hooks/useAuth.ts`):
   ```typescript
   interface SignupData {
     fullName: string;
     email: string;
     password: string;
     group: number;
     phone?: string; // ← ADD THIS
   }
   ```

---

## 🎯 Feature: Login & Authentication

### Login Flow

1. **User enters** email + password
2. **Frontend validates** form fields not empty
3. **POST** `/api/auth/login`
4. **Server verifies**:
   - User exists (email lookup)
   - Password matches (bcrypt comparison)
5. **Generate JWT token** (valid 7 days)
6. **Set HTTPOnly cookie** (secure, can't access via JS)
7. **Redirect** based on role:
   - Admin → `/admin`
   - Student → `/dashboard`

### Files Involved

- **Login Page**: `app/auth/login/page.tsx`
- **Login API**: `app/api/auth/login/route.ts`
- **Token Verification**: `lib/auth.ts`
- **Middleware**: `middleware.ts`

### To Extend Login (e.g., Add 2FA):

1. **Modify Login API** (`app/api/auth/login/route.ts`):

   - After password match, generate 2FA code
   - Send code via email (need email service)
   - Return: `{ requiresVerification: true }`

2. **Create Verify Endpoint** (`app/api/auth/verify-2fa/route.ts`):

   - Accept: `{ email, code }`
   - Verify code matches sent code
   - Then generate JWT and set cookie

3. **Create 2FA Page** (`app/auth/verify-2fa/page.tsx`):
   - After login, show code entry form
   - POST `/api/auth/verify-2fa`
   - On success, redirect to dashboard

---

## 🎯 Feature: Student Dashboard

### Dashboard Components

- **Page**: `app/dashboard/page.tsx`
- **Layout**: `app/dashboard/layout.tsx` (with sidebar)
- **Sidebar**: `app/components/StudentSidebar.tsx`

### What's Displayed

1. Welcome banner with student name and group
2. Stats grid:
   - Quizzes completed (count)
   - Completion percentage
   - Total score
3. Quiz cards (one for each topic + group assignment)
4. Group assignment status and upload form

### Key Data Sources

- `useCurrentUser()` → Current logged-in student
- `useSubmissionsWithRefetch()` → All quiz scores
- `useGroupSubmissions()` → Group assignment status

### To Add New Stat Card:

1. **Open** `app/dashboard/page.tsx`
2. **Find** Stats Grid section
3. **Add card**:
   ```tsx
   <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
     <div className="flex items-center justify-between mb-4">
       <h3 className="text-gray-600 font-medium">New Stat</h3>
       <Icon className="w-6 h-6 text-blue-600" />
     </div>
     <p className="text-4xl font-bold text-gray-800 mb-2">{calculatedValue}</p>
     <p className="text-sm text-gray-500">Description here</p>
   </div>
   ```

---

## 🎯 Feature: Admin Dashboard & Metrics

### Admin Dashboard Components

- **Page**: `app/admin/page.tsx`
- **Layout**: `app/admin/layout.tsx` (with sidebar)
- **Sidebar**: `app/components/AdminSidebar.tsx`

### Metrics Calculated

- Total Students (count of users with submissions)
- Average Score (sum of all total scores / count)
- Highest Score (max total score)
- Lowest Score (min total score)
- Completion Rate (submitted students / all students)
- Top Performer (student with highest score)

### Where Metrics Come From

**Endpoint**: `GET /api/admin/submissions`
**File**: `app/api/admin/submissions/route.ts`

```
Process:
1. Fetch all Submissions (quiz scores)
2. Fetch all GroupSubmissions with scores (grades)
3. Group by userId
4. Sum scores: topic1 + topic2 + topic3 + topic4 + groupScore
5. Calculate metrics from sums
```

### To Add New Metric (e.g., Median Score):

1. **Modify Admin Page** (`app/admin/page.tsx`):

   ```tsx
   // Calculate median after fetching data
   const sortedScores = allScores.sort((a, b) => a - b);
   const medianScore = sortedScores[Math.floor(sortedScores.length / 2)];

   // Add metric card
   <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
     <p className="text-xs font-semibold text-gray-500 uppercase">
       Median Score
     </p>
     <p className="text-2xl font-bold text-gray-800 mt-1">{medianScore}/100</p>
   </div>;
   ```

---

## 🎯 Feature: Questions Management (Admin)

### Admin Questions Page

- **Page**: `app/admin/questions/page.tsx`
- **Create Endpoint**: `POST /api/questions`
- **Get Endpoint**: `GET /api/questions?category=topic1`
- **Update Endpoint**: `PUT /api/questions/[id]`
- **Delete Endpoint**: `DELETE /api/questions/[id]`

### Question Schema

```
{
  question: "Question text?",
  options: ["Option A", "Option B", "Option C", "Option D"],
  correctAnswer: 1,  // 0-3 (index)
  category: "topic1" // topic1-topic5
}
```

### Creating Questions

1. Go to `/admin/questions`
2. Select topic (category filter)
3. Click "Create Question"
4. Fill form with question, 4 options, correct answer
5. Save

### To Bulk Import Questions (CSV):

1. **Create Bulk Import Endpoint** (`app/api/questions/bulk/route.ts`):

   ```typescript
   export async function POST(req: NextRequest) {
     const { questions } = await req.json();
     // questions = [
     //   { question: "...", options: [...], correctAnswer: 0, category: "topic1" },
     //   ...
     // ]
     const result = await Question.insertMany(questions);
     return NextResponse.json({ created: result.length }, { status: 201 });
   }
   ```

2. **Update Admin Page** (`app/admin/questions/page.tsx`):
   ```tsx
   const handleBulkUpload = async (file: File) => {
     const text = await file.text();
     const rows = text.split("\n");
     const questions = rows.map((row) => {
       const [question, ...rest] = row.split(",");
       return {
         question,
         options: rest.slice(0, 4),
         correctAnswer: parseInt(rest[4]),
         category: rest[5],
       };
     });

     await fetch("/api/questions/bulk", {
       method: "POST",
       body: JSON.stringify({ questions }),
     });
   };
   ```

---

## 🎯 Feature: Group Grading (Admin)

### Admin Grading Page

- **Page**: `app/admin/grading/page.tsx`
- **Get Submissions**: `GET /api/admin/submissions/groups`
- **Grade Endpoint**: `POST /api/admin/submissions/[id]/grade`

### Grading Flow

1. Admin visits `/admin/grading`
2. See list of ungraded submissions
3. Click submission
4. Download/preview file
5. Enter score (0-20) and feedback
6. Submit grade
7. GroupSubmission and Group records updated

### File Structure

```typescript
interface GroupSubmission {
  _id: ObjectId;
  groupNumber: number;
  fileUrl: string;
  fileName: string;
  uploadedBy: ObjectId; // User who uploaded
  uploadedAt: Date;
  score: number | null; // null until graded
  gradedBy: ObjectId | null; // Admin who graded
  gradedAt: Date | null;
  feedback: string | null;
}
```

### To Add Comments/Rubric:

1. **Update GroupSubmission Schema** (`models/GroupSubmission.ts`):

   ```typescript
   rubricScores: {
     creativity: Number,
     accuracy: Number,
     presentation: Number
   },
   rubricTotal: Number
   ```

2. **Update Grading API** (`app/api/admin/submissions/[id]/grade/route.ts`):

   ```typescript
   const { rubricScores } = req.json();
   const rubricTotal = Object.values(rubricScores).reduce((a, b) => a + b, 0);
   await GroupSubmission.findByIdAndUpdate(id, {
     rubricScores,
     rubricTotal,
     score: rubricTotal,
     gradedAt: new Date(),
   });
   ```

3. **Update Grading Form** (`app/admin/grading/page.tsx`):
   ```tsx
   <div>
     <label>
       Creativity: <input type="number" />
     </label>
     <label>
       Accuracy: <input type="number" />
     </label>
     <label>
       Presentation: <input type="number" />
     </label>
   </div>
   ```

---

## 🎯 Feature: Quiz Submission & Scoring

### How Quiz Submission Works

1. **Student takes quiz** at `/dashboard/quiz?topicId=topic1`
2. **Selects answers** to 10 questions
3. **Clicks Submit**
4. **Frontend collects**:
   - Answer indices (0-3 for each question)
   - Time spent
   - Topic info
5. **POST** `/api/submissions` with data
6. **Server validates**:
   - User authenticated
   - No duplicate submission
   - Answers in valid range (0-3)
   - Questions exist in DB
7. **Server calculates score**:
   - Compares to correct answers from DB
   - score = (correctCount / totalQuestions) \* pointsPerQuiz
   - Example: 8 correct out of 10 = 16 points
8. **Store submission** in Submission collection
9. **Return score** to student

### Security Protections

```typescript
// File: app/api/submissions/route.ts

// LAYER 1: Verify user
const user = await verifyToken(cookieString);

// LAYER 2: Check no duplicate
const existing = await Submission.findOne({
  userId: user.id,
  topicId: data.topicId
});
if (existing) return error "No retakes";

// LAYER 3: Fetch questions from DB (source of truth)
const questions = await Question.find({ category: data.topicId });

// LAYER 4: Validate answers
for (const answer of Object.values(data.answers)) {
  if (answer < 0 || answer > 3) return error;
}

// LAYER 5: Calculate score server-side (not from client)
let correctCount = 0;
for (const question of questions) {
  if (data.answers[question._id] === question.correctAnswer) {
    correctCount++;
  }
}

// LAYER 6: Store with server-calculated score
const submission = await Submission.create({
  userId: user.id,
  score: correctCount * 2,  // ← Server calculated
  ...
});
```

### To Add Time Penalty:

```typescript
// If student used too much time, reduce score
const timeLimit = 600; // 10 minutes
const timeBonus = Math.max(0, (timeLimit - data.timeSpent) / timeLimit);
const score = correctCount * 2 * timeBonus;
```

---

## 🎯 Feature: Results Export (Admin)

### Current: View Results

**Page**: `/admin/results`
Shows table of all student results

### To Add CSV Export:

1. **Install library**:

   ```bash
   npm install csv-writer
   ```

2. **Create export endpoint** (`app/api/admin/export/route.ts`):

   ```typescript
   import { createObjectCsvWriter } from "csv-writer";

   export async function GET(req: NextRequest) {
     const submissions = await fetch("/api/admin/submissions");
     const data = await submissions.json();

     const csv = data.map((student) => ({
       name: student.fullName,
       email: student.email,
       group: student.group,
       topic1: student.topic1,
       topic2: student.topic2,
       total: student.total,
     }));

     // Generate CSV...
     return new Response(csvContent, {
       headers: { "Content-Type": "text/csv" },
     });
   }
   ```

3. **Add button to page** (`app/admin/results/page.tsx`):

   ```tsx
   const handleExport = async () => {
     const response = await fetch("/api/admin/export");
     const blob = await response.blob();
     const url = window.URL.createObjectURL(blob);
     const a = document.createElement("a");
     a.href = url;
     a.download = "results.csv";
     a.click();
   };

   <button onClick={handleExport}>Download CSV</button>;
   ```

---

## 🎯 Feature: Middleware & Route Protection

### How Routes Are Protected

**File**: `middleware.ts`

```
Every request to /admin or /dashboard:
  ↓
Check: Cookie has token?
  ├─ No → Redirect to /auth/login
  └─ Yes → Continue
  ↓
Verify token with JWT
  ├─ Invalid → Clear cookie, redirect to /auth/login
  └─ Valid → Continue
  ↓
Check role from token payload
  ├─ /admin → Must be role="admin"
  ├─ /dashboard → Must be role="student"
  └─ Redirect if wrong role
  ↓
Allow request through ✓
```

### To Add Route Protection:

1. **Update matcher** in `middleware.ts`:

   ```typescript
   export const config = {
     matcher: [
       "/admin/:path*",
       "/dashboard/:path*",
       "/instructor/:path*", // ← ADD THIS
     ],
   };
   ```

2. **Add role check**:
   ```typescript
   if (req.nextUrl.pathname.startsWith("/instructor")) {
     if (decoded.role !== "instructor") {
       return NextResponse.redirect(new URL("/unauthorized", req.url));
     }
   }
   ```

---

## 🎯 Quick Command Reference

### Start Development Server

```bash
npm run dev
```

Runs on `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Lint Code

```bash
npm run lint
```

### View Database (MongoDB)

Use MongoDB Compass or Atlas UI to view collections

### Check Database Connection

Add to any API route:

```typescript
await connectDB();
console.log("Connected to MongoDB");
```

---

## 📍 Where to Find Things

| What                 | Location                       |
| -------------------- | ------------------------------ |
| Quiz topics config   | `lib/topicsConfig.ts`          |
| Scoring calculation  | `app/api/submissions/route.ts` |
| User model           | `models/User.ts`               |
| Group model          | `models/Group.ts`              |
| Login form           | `app/auth/login/page.tsx`      |
| Quiz page            | `app/dashboard/quiz/page.tsx`  |
| Admin dashboard      | `app/admin/page.tsx`           |
| Grading page         | `app/admin/grading/page.tsx`   |
| Manage questions     | `app/admin/questions/page.tsx` |
| Authentication hooks | `hooks/useAuth.ts`             |
| Route protection     | `middleware.ts`                |
| JWT verification     | `lib/auth.ts`                  |
| Database connection  | `lib/db.ts`                    |

---

## 💡 Pro Tips

1. **After adding fields to schema**: Restart development server

   ```bash
   # Stop (Ctrl+C), then:
   npm run dev
   ```

2. **Check token in browser**:

   - Open DevTools → Application → Cookies
   - Look for `token` cookie
   - Can't see value (HTTPOnly)

3. **Debug quiz scoring**:

   - Add logs in `app/api/submissions/route.ts`
   - `console.log("Correct answers:", correctAnswers);`
   - Check server terminal for output

4. **Test as admin**: Create account with role="admin" directly in MongoDB

5. **Find broken links**: Search for file paths in code

   - Missing import? Search for component name
   - Wrong route? Check `middleware.ts` patterns

6. **Before deploying**: Test all flows
   - Login as student
   - Take a quiz
   - View results
   - Login as admin
   - View admin metrics
   - Grade submission

---

**Keep this file handy!** It's your map to the codebase.
