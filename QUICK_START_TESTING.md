# 🚀 Quick Start: Testing Dashboard Auto-Refetch

## Prerequisites

- Node.js installed
- MongoDB running locally (or connection string configured)
- Project dependencies installed (`npm install`)

## Step 1: Start the Development Server

```bash
cd c:\Users\HP USER\Desktop\Projects\airforce-quiz-system
npm run dev
```

Expected output:

```
> next dev
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

## Step 2: Access the Application

Open browser: `http://localhost:3000`

## Step 3: Login as Student

Click "Login" and use student credentials:

```
Email: student1@example.com
Password: [your-password]
```

Or create a new account:

- Click "Sign Up"
- Create student user with group number

## Step 4: Test Dashboard Auto-Refetch

### ✅ Test 1: Basic Auto-Update

```
1. From dashboard, click on a quiz topic (e.g., "Topic 1")
2. Answer all questions
3. Click "Submit Quiz"
4. See success confirmation
5. Click "Return to Dashboard"

EXPECTED: Dashboard shows "Quizzes Completed: 1"
WITHOUT: Requiring page refresh ✅
```

### ✅ Test 2: Multiple Submissions

```
1. Complete Quiz 1 (submit immediately)
2. Return to dashboard (shows 1 completed)
3. Complete Quiz 2 (submit immediately)
4. Return to dashboard (shows 2 completed)
5. Complete Quiz 3 (submit immediately)
6. Return to dashboard (shows 3 completed)

EXPECTED: Dashboard count increments without refresh ✅
```

### ✅ Test 3: Cross-Tab Sync

```
1. Open browser developer tools (F12)
2. Open dashboard in current tab
3. Right-click dashboard link → "Open in new tab"
4. In Tab 1: Complete and submit a quiz
5. Switch to Tab 2 (dashboard)

EXPECTED: Tab 2 shows updated submission count ✅
```

### ✅ Test 4: Verify Cache Optimization

```
1. Open browser developer tools (F12)
2. Go to Network tab
3. Complete quiz and submit
4. Click through dashboard → scores → dashboard

EXPECTED:
- First submission: 1-2 API calls to /api/submissions
- Navigation within 5 minutes: 0 new calls to /api/submissions
- After 5 minutes: 1 new call to /api/submissions ✅
```

## Step 5: Verify Implementation Details

### Check LocalStorage Flag

Open browser console (F12) and type:

```javascript
localStorage.getItem("quiz_just_submitted");
```

After quiz submission: Returns `"true"`
After dashboard loads: Returns `null` (cleared)

### Check React Query Cache

```javascript
// Install React Query DevTools chrome extension, or:
import { useQueryClient } from "@tanstack/react-query";
const queryClient = useQueryClient();
queryClient.getQueryData(["submissions"]);
```

### Monitor API Calls

Network tab → Filter by `/api/submissions`

- Submission event: 1 call (scores)
- Dashboard navigation: 1 call (flag detected)
- Subsequent navigations: 0 calls (cached, within 5 min)

## Step 6: Test Edge Cases

### Edge Case 1: Browser Refresh After Submission

```
1. Submit quiz
2. Press Ctrl+R (refresh)
3. Check dashboard

EXPECTED: Still shows submission count ✅
```

### Edge Case 2: Multiple Submissions Rapid

```
1. Submit Quiz 1
2. Immediately submit Quiz 2
3. Immediately submit Quiz 3
4. Navigate to dashboard

EXPECTED: Shows 3 submissions ✅
```

### Edge Case 3: Retake Prevention

```
1. Submit Quiz 1
2. Try clicking on Quiz 1 again
3. Attempt to start quiz

EXPECTED: See "Quiz Already Completed" message ✅
```

## Troubleshooting

### Issue: Dashboard still shows old count

```
Solution:
1. Check browser console for errors
2. Verify localStorage isn't disabled
3. Refresh page manually
4. Check that useSubmissionsWithRefetch is imported
```

### Issue: API calls to /api/submissions excessive

```
Solution:
1. Verify React Query staleTime is set to 5 minutes
2. Check that refetchOnMount is false
3. Clear browser cache and local storage
4. Restart dev server
```

### Issue: Cross-tab sync not working

```
Solution:
1. Verify tabs have same origin (http://localhost:3000)
2. Check that localStorage is enabled
3. Ensure tabs are not in private/incognito mode
4. Refresh both tabs
```

### Issue: Quiz submission fails

```
Solution:
1. Verify backend API is running
2. Check MongoDB connection
3. Verify student is logged in
4. Check browser console for error details
```

## Performance Validation

Expected metrics:

```
✅ Dashboard load: < 500ms
✅ Quiz submission: < 1000ms
✅ Auto-refetch on dashboard: < 100ms
✅ API calls to /api/submissions per session:
   - Before optimization: 6 calls (demo 3 quizzes)
   - After optimization: 4 calls (33% reduction)
```

## Files to Monitor

Watch these files for changes during testing:

```
✅ hooks/useSubmissionsWithRefetch.ts - The new hook
✅ app/dashboard/page.tsx - Using new hook
✅ app/dashboard/quiz/page.tsx - Setting flag
✅ Browser localStorage - Flag visible here
✅ Browser Network tab - API calls here
```

## Next Steps After Testing

1. ✅ Verify auto-refetch works
2. ✅ Verify performance optimizations
3. ✅ Verify no TypeScript errors
4. ✅ Verify cross-tab sync works
5. Then: Deploy to staging
6. Then: Deploy to production

## Documentation Reference

- Quick reference: `IMPLEMENTATION_SUMMARY.md`
- Detailed implementation: `DASHBOARD_AUTO_REFETCH.md`
- Technical deep dive: `TECHNICAL_ARCHITECTURE.md`
- Feature checklist: `FEATURE_CHECKLIST.md`

## Questions?

All code changes are documented in:

1. Comments in source files
2. Inline explanations with ✅ markers
3. Detailed markdown documentation files

Good luck! 🎉
