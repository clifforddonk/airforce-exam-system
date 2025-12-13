# Contributing to Airforce Quiz System

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing.

## Getting Started

1. **Fork the repository**

   ```bash
   git clone https://github.com/YOUR_USERNAME/airforce-quiz-system.git
   cd airforce-quiz-system
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Running Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Type Checking

```bash
npx tsc --noEmit
```

### Building for Production

```bash
npm run build
```

## Code Guidelines

### TypeScript

- Use TypeScript for all new code
- Avoid `any` types - use proper type annotations
- Run `npx tsc --noEmit` to check types

### React Components

- Use functional components with hooks
- Add `"use client"` directive for client components
- Prefer named exports for components
- Use proper prop types

Example:

```typescript
"use client";

import React from "react";

interface MyComponentProps {
  title: string;
  onClick: () => void;
}

export default function MyComponent({ title, onClick }: MyComponentProps) {
  return <button onClick={onClick}>{title}</button>;
}
```

### API Routes

- Validate input with proper error responses
- Use HTTP status codes correctly (200, 201, 400, 403, 404, 500)
- Add meaningful error messages

Example:

```typescript
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate
    if (!data.title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Process
    const result = await Model.create(data);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### Styling

- Use Tailwind CSS classes
- Avoid inline styles
- Follow the existing color scheme

### Comments & Documentation

- Add comments for complex logic
- Document public functions
- Keep README.md updated

## Commit Messages

Follow conventional commits:

```
feat: Add student quiz timer feature
fix: Correct score calculation bug
docs: Update installation instructions
style: Format code with Prettier
refactor: Simplify authentication logic
test: Add unit tests for scoring
```

## Pull Request Process

1. **Update your branch**

   ```bash
   git pull origin main
   ```

2. **Commit your changes**

   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

3. **Push to your fork**

   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create Pull Request**
   - Go to GitHub and click "New Pull Request"
   - Write a clear description of changes
   - Reference any related issues (#123)
   - Wait for review and address feedback

## PR Title & Description Template

**Title**: `[Type] Brief description`

**Description**:

```markdown
## Changes

- Brief description of changes

## Related Issues

Closes #123

## Testing

- [ ] Tested locally
- [ ] No TypeScript errors
- [ ] No console errors

## Screenshots (if applicable)

[Add before/after screenshots]
```

## Areas for Contribution

### High Priority

- [ ] Mobile responsiveness improvements
- [ ] Performance optimizations
- [ ] Bug fixes
- [ ] Documentation improvements

### Medium Priority

- [ ] New features (please discuss first)
- [ ] Tests
- [ ] Code refactoring
- [ ] UI/UX improvements

### Low Priority

- [ ] Comments and documentation
- [ ] Code style improvements
- [ ] Build optimizations

## Reporting Bugs

1. **Check existing issues** - Avoid duplicates
2. **Create a new issue** with:
   - Clear title
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots/logs

## Suggesting Enhancements

1. **Discuss first** - Open an issue to discuss
2. **Provide details**:
   - Use case
   - Proposed solution
   - Alternative approaches
   - Potential drawbacks

## Questions?

- Check existing documentation
- Review closed issues for similar questions
- Open a discussion issue

---

**Thank you for contributing! 🙏**
