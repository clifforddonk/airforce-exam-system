# ✈️ Airforce Quiz System

A comprehensive **Learning Management System (LMS)** built for aviation safety training and assessment. Students take interactive quizzes on aviation topics and submit group assignments, while admins manage questions, view results, and grade submissions.

## 🚀 Features

### For Students

- **Interactive Quizzes**: 4 aviation safety topics with timed quizzes (10 minutes each)
- **Quiz Scoring**: Real-time feedback with score breakdowns and percentages
- **Review Mode**: Compare your answers with correct answers and explanations
- **Score Tracking**: View all submitted quizzes and performance metrics
- **Group Assignments**: Collaborate on group projects and submit files
- **Responsive Dashboard**: Track progress and upcoming assignments

### For Admins

- **Question Management**: Create, edit, and delete quiz questions by topic
- **Bulk Import**: Upload multiple questions via CSV/JSON (extensible)
- **Student Results**: View aggregated performance data with export functionality
- **Group Grading**: Review and grade group submissions with feedback
- **Analytics Dashboard**: Track completion rates, score distributions, and top performers
- **User Management**: Manage students and admin accounts

### Security & Performance

- ✅ **Server-Side Scoring**: Prevents client-side tampering
- ✅ **JWT Authentication**: Secure token-based auth with HTTPOnly cookies
- ✅ **Role-Based Access**: Student vs Admin route protection
- ✅ **React Query Caching**: Optimized data fetching and performance
- ✅ **Password Hashing**: bcryptjs with salt rounds
- ✅ **Answer Validation**: Server validates all submissions

## 📊 Scoring System

| Component          | Points  | Details                                          |
| ------------------ | ------- | ------------------------------------------------ |
| Individual Quizzes | 80      | 4 topics × 20 points (10 questions × 2 pts each) |
| Group Assignment   | 20      | Graded by admin                                  |
| **Total**          | **100** | Max possible score                               |

## 🛠️ Tech Stack

### Frontend

- **Next.js 16** - React framework with App Router
- **React 19** - UI components and hooks
- **Tailwind CSS 4** - Styling
- **TanStack Query** - Data fetching & caching
- **Lucide React** - Icon library

### Backend

- **Next.js API Routes** - Node.js backend
- **MongoDB** - Document database
- **Mongoose** - ODM for MongoDB
- **JWT (jose)** - Token authentication

### Additional Services

- **Supabase Storage** - File uploads for group assignments
- **bcryptjs** - Password hashing

## 📦 Installation

### Prerequisites

- Node.js 18+
- MongoDB instance
- Supabase project (for file storage)

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/clifforddonk/airforce-quiz-system.git
   cd airforce-quiz-system
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env.local` file:

   ```env
   # Database
   MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/airforce-quiz

   # Authentication
   JWT_SECRET=your-super-secret-key-min-32-chars

   # Supabase (File Storage)
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # Environment
   NODE_ENV=development
   ```

4. **Run development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

5. **Initialize groups** (Admin only)

   ```bash
   # Option 1: Call the API endpoint
   POST /api/admin/groups/initialize

   # Option 2: Run the script directly
   npx ts-node app/scripts/initializeGroups.ts
   ```

## 📚 Project Structure

```
airforce-quiz-system/
├── app/
│   ├── api/                    # API endpoints
│   │   ├── auth/              # Authentication (login, signup, logout)
│   │   ├── questions/         # Quiz question CRUD
│   │   ├── submissions/       # Quiz & group submissions
│   │   ├── admin/             # Admin endpoints (results, grading)
│   │   └── quiz/              # Quiz helpers (start, check-completion)
│   │
│   ├── auth/                   # Auth pages (login, signup)
│   ├── dashboard/              # Student dashboard & quiz pages
│   ├── admin/                  # Admin pages (results, grading, questions)
│   ├── components/             # Shared components (sidebars, etc)
│   │
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Landing page
│   ├── providers.tsx           # React Query provider
│   └── globals.css             # Global styles
│
├── hooks/                      # Custom React hooks
│   ├── useAuth.ts             # Authentication hooks
│   ├── useSubmissions.ts      # Submission queries
│   ├── useGroupSubmission.ts  # Group submission queries
│   └── useQuestions.ts        # Question queries
│
├── lib/                        # Utility functions
│   ├── auth.ts                # JWT verification
│   ├── db.ts                  # MongoDB connection
│   ├── topicsConfig.ts        # Quiz topics configuration
│   └── getNextGroup.ts        # Group utilities
│
├── models/                     # Mongoose schemas
│   ├── User.ts                # Student & Admin users
│   ├── Question.ts            # Quiz questions
│   ├── Submission.ts          # Individual quiz submissions
│   ├── Group.ts               # Student groups
│   └── GroupSubmission.ts     # Group assignment files
│
├── middleware.ts              # Next.js middleware (route protection)
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
└── next.config.ts             # Next.js config
```

## 🔐 User Roles & Access

### Student Role

| Feature                 | Access |
| ----------------------- | ------ |
| View Dashboard          | ✅     |
| Take Quizzes            | ✅     |
| View Scores             | ✅     |
| Review Answers          | ✅     |
| Submit Group Assignment | ✅     |
| Access Admin            | ❌     |

### Admin Role

| Feature                  | Access |
| ------------------------ | ------ |
| View Dashboard           | ✅     |
| Manage Questions         | ✅     |
| View Student Results     | ✅     |
| Grade Group Submissions  | ✅     |
| Access Student Dashboard | ❌     |

## 🚀 API Endpoints

### Authentication

```
POST   /api/auth/signup          # Register new user
POST   /api/auth/login           # Login user
POST   /api/auth/logout          # Logout user
GET    /api/auth/me              # Get current user
```

### Questions (Admin)

```
GET    /api/questions?category=topic1   # Get questions by topic
POST   /api/questions                    # Create question
GET    /api/questions/[id]               # Get single question
PUT    /api/questions/[id]               # Update question
DELETE /api/questions/[id]               # Delete question
POST   /api/questions/bulk               # Bulk import questions
```

### Submissions (Student)

```
POST   /api/submissions                  # Submit quiz
GET    /api/submissions                  # Get my submissions
POST   /api/submissions/group            # Submit group assignment
GET    /api/submissions/group            # Get group submission status
GET    /api/submissions/review           # Review quiz with answers
```

### Admin

```
GET    /api/admin/submissions            # Get all student results
GET    /api/admin/submissions/groups     # Get group submissions
POST   /api/admin/submissions/[id]/grade # Grade group submission
POST   /api/admin/groups/initialize      # Initialize groups
GET    /api/admin/stats                  # Get system statistics
```

## 📖 Usage Guide

### For Students

1. **Sign Up**

   - Navigate to `/auth/signup`
   - Enter name, email, password, and select group
   - Account is created and you're ready to quiz!

2. **Take a Quiz**

   - Go to `/dashboard`
   - Click on a quiz topic card
   - Answer 10 questions in 10 minutes
   - Submit to see your score

3. **Review Results**

   - Go to `/dashboard/scores` to see all quiz scores
   - Click "Review" to see detailed answer explanations
   - Compare your answers with correct answers

4. **Submit Group Assignment**
   - Go to `/dashboard`
   - Find "Group Assignment" section
   - Upload a PDF file (max 10MB)
   - Wait for admin to grade

### For Admins

1. **Create Questions**

   - Navigate to `/admin/questions`
   - Select topic
   - Fill in question, 4 options, and correct answer
   - Save

2. **View Results**

   - Go to `/admin/results`
   - See all students' scores by topic
   - Filter by group or export to CSV

3. **Grade Assignments**
   - Go to `/admin/grading`
   - Review submitted group files
   - Enter score (0-20) and feedback
   - Save grade

## 🔧 Configuration

### Topics Configuration

Edit `lib/topicsConfig.ts` to add/modify quiz topics:

```typescript
export const TOPICS = [
  { id: "topic1", label: "DIRTY DOZEN", description: "..." },
  { id: "topic2", label: "Risk Management", description: "..." },
  // Add more topics
];
```

### Scoring System

Modify scoring in `lib/topicsConfig.ts`:

```typescript
export const QUIZ_CONFIG = {
  pointsPerQuestion: 2,
  totalQuestions: 10,
  quizDurationSeconds: 600, // 10 minutes
  pointsPerQuiz: 20,
  groupProjectPoints: 20,
};
```

## 🚢 Deployment

### Deploy to Vercel

1. **Push to GitHub**

   ```bash
   git push origin main
   ```

2. **Connect to Vercel**

   - Import your GitHub repository
   - Add environment variables
   - Deploy!

3. **Environment Variables (Vercel)**
   ```
   MONGO_URL
   JWT_SECRET
   NEXT_PUBLIC_SUPABASE_URL
   SUPABASE_SERVICE_ROLE_KEY
   NODE_ENV=production
   ```

### Deploy to Other Platforms

- **Netlify**: Not recommended (requires serverless functions)
- **Railway**: Supports Node.js and MongoDB
- **Render**: Full-stack deployment
- **AWS EC2**: Manual deployment with PM2

## 🐛 Troubleshooting

### "Group not found" Error

- Run `/api/admin/groups/initialize` to create missing groups
- Or the system now auto-creates groups on first submission

### Quiz Timer Issues

- Clear browser cache
- Ensure browser system time is correct
- Timer runs for 10 minutes (600 seconds)

### File Upload Fails

- Check Supabase credentials are correct
- Ensure file is PDF and under 10MB
- Check browser has network connection

### Authentication Issues

- Verify JWT_SECRET is set correctly
- Check MongoDB connection string
- Clear cookies and login again

## 📈 Future Enhancements

- [ ] Real-time notifications for grade updates
- [ ] Advanced analytics dashboard
- [ ] Email notifications
- [ ] Student progress tracking charts
- [ ] Question bank by difficulty level
- [ ] Timed retakes with penalties
- [ ] Mobile app (React Native)
- [ ] Proctoring integration

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 👨‍💻 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📧 Support

For issues and questions:

- Open a GitHub issue
- Contact: [clifforddonk@gmail.com]
- Documentation: Check `DOCUMENTATION_INDEX.md` in repo

## 🙏 Acknowledgments

- Aviation safety training framework
- Next.js and React communities
- MongoDB and Mongoose documentation
- Vercel for hosting platform

---

**Made with ❤️ by Clifford Donkor**
