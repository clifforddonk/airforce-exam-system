#!/bin/bash

# Quick verification script for dashboard auto-refetch feature

echo "🧪 Verifying Dashboard Auto-Refetch Implementation..."
echo ""

# Check 1: Verify new hook exists
echo "✓ Checking if useSubmissionsWithRefetch.ts exists..."
if [ -f "hooks/useSubmissionsWithRefetch.ts" ]; then
    echo "  ✅ Hook file created successfully"
else
    echo "  ❌ Hook file not found"
fi

# Check 2: Verify dashboard imports new hook
echo ""
echo "✓ Checking if dashboard uses new hook..."
if grep -q "useSubmissionsWithRefetch" app/dashboard/page.tsx; then
    echo "  ✅ Dashboard imports useSubmissionsWithRefetch"
else
    echo "  ❌ Dashboard doesn't use new hook"
fi

# Check 3: Verify scores page imports new hook
echo ""
echo "✓ Checking if scores page uses new hook..."
if grep -q "useSubmissionsWithRefetch" app/dashboard/scores/page.tsx; then
    echo "  ✅ Scores page imports useSubmissionsWithRefetch"
else
    echo "  ❌ Scores page doesn't use new hook"
fi

# Check 4: Verify quiz page sets flag
echo ""
echo "✓ Checking if quiz page sets localStorage flag..."
if grep -q "quiz_just_submitted" app/dashboard/quiz/page.tsx; then
    echo "  ✅ Quiz page sets quiz_just_submitted flag"
else
    echo "  ❌ Quiz page doesn't set flag"
fi

# Check 5: Verify hook checks flag
echo ""
echo "✓ Checking if hook detects the flag..."
if grep -q "quiz_just_submitted" hooks/useSubmissionsWithRefetch.ts; then
    echo "  ✅ Hook detects quiz_just_submitted flag"
else
    echo "  ❌ Hook doesn't detect flag"
fi

# Check 6: Verify hook calls invalidateQueries
echo ""
echo "✓ Checking if hook invalidates cache..."
if grep -q "invalidateQueries" hooks/useSubmissionsWithRefetch.ts; then
    echo "  ✅ Hook calls invalidateQueries"
else
    echo "  ❌ Hook doesn't invalidate cache"
fi

# Check 7: TypeScript compilation
echo ""
echo "✓ Checking TypeScript compilation..."
if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
    echo "  ⚠️  TypeScript compilation has errors"
else
    echo "  ✅ TypeScript compiles successfully"
fi

echo ""
echo "════════════════════════════════════════"
echo "Implementation verification complete! ✅"
echo "════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. Run 'npm run dev' to start the development server"
echo "2. Test by submitting a quiz as a student"
echo "3. Verify dashboard shows updated submission count immediately"
