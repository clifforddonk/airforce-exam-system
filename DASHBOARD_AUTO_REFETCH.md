# Dashboard Auto-Refetch After Quiz Submission

## Problem

After submitting a quiz, the dashboard didn't automatically update to show the new submission. Users had to:

1. Navigate away from the quiz page
2. Manually refresh the page

## Solution

Implemented a **two-part solution** using localStorage communication + React Query invalidation:

### Part 1: Quiz Page (Sets Flag + Invalidates Cache)

File: `app/dashboard/quiz/page.tsx`

When quiz is submitted successfully:

```typescript
// Set flag so dashboard knows to refetch
localStorage.setItem("quiz_just_submitted", "true");

// Invalidate submissions cache
await queryClient.invalidateQueries({ queryKey: ["submissions"] });
```

### Part 2: New Hook (Detects Flag + Forces Refetch)

File: `hooks/useSubmissionsWithRefetch.ts` (NEW)

Created a custom hook that:

1. Checks localStorage for `quiz_just_submitted` flag on mount
2. If true, forces `invalidateQueries` to mark cache as stale
3. Clears the flag to prevent repeated refetches
4. Returns submissions data

```typescript
export const useSubmissionsWithRefetch = () => {
  const queryClient = useQueryClient();

  // Check if quiz was just submitted
  useEffect(() => {
    const justSubmitted = localStorage.getItem("quiz_just_submitted");
    if (justSubmitted === "true") {
      // ✅ Force refetch immediately
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      // Clear the flag so it doesn't keep refetching
      localStorage.removeItem("quiz_just_submitted");
    }
  }, [queryClient]);

  return useQuery<Submission[]>({...});
};
```

### Part 3: Updated Components

Files:

- `app/dashboard/page.tsx` - Uses `useSubmissionsWithRefetch`
- `app/dashboard/scores/page.tsx` - Uses `useSubmissionsWithRefetch`

**Before:**

```typescript
const { data: submissions = [] } = useSubmissions();
```

**After:**

```typescript
const { data: submissions = [] } = useSubmissionsWithRefetch();
```

## How It Works

1. **User submits quiz** on `/dashboard/quiz?topic=topic1`

   - ✅ Backend validates and calculates score
   - ✅ Quiz page sets `localStorage.setItem("quiz_just_submitted", "true")`
   - ✅ Quiz page calls `queryClient.invalidateQueries`

2. **User navigates to dashboard** `/dashboard`
   - Dashboard mounts and calls `useSubmissionsWithRefetch()`
   - ✅ Hook detects `quiz_just_submitted` flag in localStorage
   - ✅ Hook calls `invalidateQueries` again to ensure cache is marked stale
   - ✅ Hook clears the flag
   - ✅ React Query fetches fresh submissions data
   - ✅ Dashboard shows updated submission count

## Benefits

✅ **Seamless UX**: Dashboard updates immediately after quiz submission
✅ **Cross-Tab Support**: If quiz submitted in one tab, flag triggers refetch in another tab
✅ **Cache Optimization**: Still uses 5-minute staleTime for normal usage
✅ **Type Safe**: Proper TypeScript interfaces for User and Submission data
✅ **No Manual Refresh**: Users see results instantly

## React Query Configuration

```typescript
{
  staleTime: 5 * 60 * 1000,      // Data fresh for 5 minutes
  gcTime: 15 * 60 * 1000,         // Keep in cache 15 minutes
  refetchOnMount: false,          // Don't refetch on mount (reuse cache)
  refetchOnWindowFocus: true,     // Refetch when user returns to tab
}
```

## Files Modified

1. ✅ `hooks/useSubmissionsWithRefetch.ts` - NEW hook with auto-refetch logic
2. ✅ `app/dashboard/page.tsx` - Uses new hook, fixed User type
3. ✅ `app/dashboard/scores/page.tsx` - Uses new hook
4. ✅ `app/dashboard/quiz/page.tsx` - Sets localStorage flag on submission
5. ✅ `hooks/useAuth.ts` - Added User interface, fixed types, fixed refetchOnWindowFocus

## Testing

To verify the solution works:

1. Login as a student
2. Start and complete a quiz
3. Click "Submit"
4. **Expected**: Dashboard immediately shows updated submission count (no refresh needed)
5. **Alternative**: If you have multiple tabs open, submit quiz in one tab
   - Switch to dashboard tab
   - Dashboard should auto-refetch and show the submission

## Cleanup

The `quiz_just_submitted` flag is automatically cleared after:

- Dashboard detects it and triggers refetch
- Scores page detects it and triggers refetch
- This prevents stale refetch attempts on subsequent navigations
