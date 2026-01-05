import { DocRenderer } from "../../components/doc-renderer";

const CONTRIBUTING_CONTENT = `# Contributing

Help make EasyDocs better!

## Getting Started

### 1. Fork & Clone

\`\`\`bash
git clone https://github.com/gaon12/EasyDocs.git
cd easydocs
npm install
\`\`\`

### 2. Create Branch

\`\`\`bash
git checkout -b feature/amazing-feature
\`\`\`

### 3. Make Changes

- Write clean, readable code
- Follow TypeScript best practices
- Add JSDoc comments
- Test on multiple browsers

### 4. Commit

\`\`\`bash
git commit -m "feat: add amazing feature"
\`\`\`

Use conventional commits:
- \`feat:\` New feature
- \`fix:\` Bug fix
- \`docs:\` Documentation
- \`style:\` Formatting
- \`refactor:\` Code refactoring
- \`test:\` Tests
- \`chore:\` Maintenance

### 5. Push & PR

\`\`\`bash
git push origin feature/amazing-feature
\`\`\`

Then create a Pull Request on GitHub.

## Code Style

### TypeScript

\`\`\`typescript
// ✅ Good
export function myFunction(param: string): void {
  // ...
}

// ❌ Bad
export function myFunction(param: any) {
  // ...
}
\`\`\`

### React

\`\`\`typescript
// ✅ Good
export function MyComponent({ title }: Props) {
  const handleClick = useCallback(() => {
    // ...
  }, []);

  return <div>{title}</div>;
}
\`\`\`

### Tailwind

\`\`\`tsx
// ✅ Good - Grouped logically
<div className="flex items-center gap-4 rounded-lg border p-4">

// ❌ Bad - Random order
<div className="gap-4 p-4 flex rounded-lg items-center border">
\`\`\`

## Testing

\`\`\`bash
npm run lint      # Lint code
npm run build     # Test build
\`\`\`

## What to Contribute

### Good First Issues
- Documentation improvements
- Bug fixes
- UI enhancements
- Translations

### Advanced
- New file format support
- Performance optimizations
- API improvements

## Questions?

- Open a [Discussion](https://github.com/gaon12/EasyDocs/discussions)
- Join our community chat
- Email: support@easydocs.example

## For full guidelines, see [CONTRIBUTING.md](https://github.com/gaon12/EasyDocs/blob/main/CONTRIBUTING.md)
`;

export default function ContributingPage() {
  return <DocRenderer content={CONTRIBUTING_CONTENT} />;
}
