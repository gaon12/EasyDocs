# Contributing to EasyDocs

Thank you for your interest in contributing to EasyDocs! This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style Guide](#code-style-guide)
- [Submitting Changes](#submitting-changes)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm, pnpm, or yarn
- Git
- A code editor (VS Code recommended)

### Setting Up Development Environment

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/gaon12/EasyDocs.git
   cd easydocs
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create a branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Development Workflow

### Project Structure

```
app/
├── api/              # API routes (proxy, services)
├── components/       # React components
│   └── modals/      # Modal components
├── lib/             # Utility functions
├── viewer/          # Main viewer pages
├── embed/           # Embed pages
└── layout.tsx       # Root layout
```

### Key Technologies

- **Next.js 16**: App Router, Server Components
- **React 19**: Latest React features
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **@embedpdf/react-pdf-viewer**: PDF rendering

### Making Changes

1. **Write clean, readable code**
   - Use meaningful variable and function names
   - Add comments for complex logic
   - Keep functions small and focused

2. **Follow TypeScript best practices**
   - Always define types
   - Avoid `any` type
   - Use strict mode

3. **Test your changes**
   - Test on multiple browsers (Chrome, Firefox, Safari)
   - Test responsive design
   - Test keyboard navigation
   - Test with screen readers (accessibility)

4. **Update documentation**
   - Update README.md if adding features
   - Add JSDoc comments to new functions
   - Update inline comments

## Code Style Guide

### TypeScript/React

```typescript
// ✅ Good
export function MyComponent({ title, isActive }: MyComponentProps) {
  const handleClick = useCallback(() => {
    // ...
  }, []);

  return (
    <div className="container">
      <h1>{title}</h1>
    </div>
  );
}

// ❌ Bad
export function MyComponent(props: any) {
  function handleClick() { /* ... */ }

  return <div><h1>{props.title}</h1></div>
}
```

### Naming Conventions

- **Components**: PascalCase (`MyComponent`)
- **Functions**: camelCase (`handleClick`, `fetchData`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_SIZE`)
- **Types/Interfaces**: PascalCase (`UserProps`, `ApiResponse`)

### File Organization

```typescript
// 1. Imports
import { useState } from "react";
import { MyUtil } from "@/app/lib/utils";

// 2. Types
type MyComponentProps = {
  title: string;
};

// 3. Constants
const DEFAULT_TIMEOUT = 5000;

// 4. Component
export function MyComponent({ title }: MyComponentProps) {
  // ...
}
```

### CSS/Tailwind

- Use Tailwind utility classes
- Group related classes together
- Use meaningful class names for custom CSS
- Prefer dark mode variants: `dark:bg-slate-800`

```tsx
// ✅ Good
<div className="flex items-center gap-4 rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
  {/* ... */}
</div>

// ❌ Bad
<div className="flex gap-4 p-4 items-center rounded-lg bg-white border dark:bg-slate-900 border-black/10 dark:border-white/10">
  {/* ... */}
</div>
```

### Comments

Add JSDoc comments for public functions:

```typescript
/**
 * Fetches a document from a URL and returns the blob
 * @param url - The URL to fetch from
 * @param options - Fetch options
 * @returns Promise resolving to a Blob
 * @throws Error if fetch fails or URL is invalid
 */
export async function fetchDocument(
  url: string,
  options?: RequestInit
): Promise<Blob> {
  // Implementation
}
```

## Submitting Changes

### Before Submitting

1. **Run linter**:
   ```bash
   npm run lint
   ```

2. **Check types**:
   ```bash
   npm run type-check
   ```

3. **Test build**:
   ```bash
   npm run build
   ```

4. **Format code**:
   ```bash
   npm run format
   ```

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
feat: add image export for PDFs
fix: resolve CORS issue in proxy
docs: update README with deployment instructions
style: improve button styling on mobile
refactor: extract modal components
perf: optimize image loading
test: add unit tests for file-type detection
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Pull Request Process

1. **Push your changes**:
   ```bash
   git add .
   git commit -m "feat: add your feature"
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request**:
   - Go to GitHub and create a PR
   - Fill in the PR template
   - Link related issues
   - Add screenshots for UI changes

3. **PR Template**:
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Tested on Chrome
   - [ ] Tested on Firefox
   - [ ] Tested on Safari
   - [ ] Tested responsive design
   - [ ] Tested accessibility

   ## Screenshots
   (if applicable)
   ```

4. **Review Process**:
   - Address review comments
   - Keep discussion constructive
   - Update code as needed

## Reporting Bugs

### Before Reporting

1. Check if the bug has already been reported
2. Try to reproduce the bug consistently
3. Gather information about your environment

### Bug Report Template

```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- Browser: Chrome 120
- OS: Windows 11
- Device: Desktop
- Version: 1.0.0

## Screenshots
(if applicable)

## Additional Context
Any other relevant information
```

## Suggesting Features

### Feature Request Template

```markdown
## Feature Description
Clear description of the proposed feature

## Problem Statement
What problem does this solve?

## Proposed Solution
How should this feature work?

## Alternatives Considered
What other approaches did you consider?

## Additional Context
Mockups, examples, references
```

## Questions?

- Open a [Discussion](https://github.com/gaon12/EasyDocs/discussions)
- Join our community chat
- Email: support@easydocs.example

---

Thank you for contributing to EasyDocs! 🎉
