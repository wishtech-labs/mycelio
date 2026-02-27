# Contributing to Mycelio.ai

Thank you for your interest in contributing to Mycelio.ai! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Submitting Changes](#submitting-changes)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Testing](#testing)

## Code of Conduct

This project and everyone participating in it is governed by our commitment to:

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Accept responsibility for mistakes

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/mycelio-hub.git
   cd mycelio-hub
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/wishtech-labs/mycelio-hub.git
   ```

## Development Setup

### Prerequisites

- Node.js 18.17+
- pnpm 9.0+
- Supabase account (free tier works)

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env.local

# Set up Supabase (see README.md for details)
# Then run development server
pnpm dev
```

The application will be available at `http://localhost:3000`.

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test types
pnpm test:unit
pnpm test:integration
pnpm test:e2e

# Run with coverage
pnpm test:coverage
```

## Making Changes

### Branch Naming

Create a branch with a descriptive name:

```bash
# Feature branches
git checkout -b feat/add-new-endpoint

# Bug fix branches
git checkout -b fix/api-response-error

# Documentation branches
git checkout -b docs/update-readme
```

### Project Structure

```
mycelio-hub/
├── app/              # Next.js App Router
│   ├── api/          # API Routes
│   ├── layout.tsx    # Root layout
│   └── page.tsx      # Homepage
├── components/       # React components
├── lib/              # Utility functions and clients
├── supabase/         # Database migrations
├── tests/            # Test suites
└── docs/             # Documentation
```

### Code Style

- **TypeScript**: Use strict typing, avoid `any`
- **Formatting**: Follow existing code style
- **Comments**: Document complex logic
- **Testing**: Add tests for new features

## Submitting Changes

### Before Submitting

1. **Sync with upstream**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run tests** to ensure nothing is broken:
   ```bash
   pnpm test
   ```

3. **Lint your code**:
   ```bash
   pnpm lint
   ```

### Pull Request Process

1. **Push your branch** to your fork:
   ```bash
   git push origin your-branch-name
   ```

2. **Create a Pull Request** on GitHub

3. **Fill out the PR template** with:
   - Description of changes
   - Related issue numbers
   - Screenshots (if UI changes)
   - Testing performed

4. **Wait for review** - maintainers will review and provide feedback

### PR Review Criteria

- Code follows project style
- Tests pass
- Documentation is updated
- Commit messages are clear
- Changes are focused and atomic

## Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only changes |
| `style` | Code style changes (formatting, semicolons, etc) |
| `refactor` | Code refactoring |
| `perf` | Performance improvements |
| `test` | Adding or updating tests |
| `chore` | Build process or auxiliary tool changes |

### Examples

```
feat(api): add task filtering by status

fix(auth): resolve key rotation race condition

docs(readme): update deployment instructions

test(integration): add task lifecycle tests
```

## Testing

### Test Structure

```
tests/
├── unit/          # Unit tests (functions, utilities)
├── integration/   # API integration tests
├── e2e/          # End-to-end tests
└── fixtures/     # Test data
```

### Writing Tests

```typescript
// Example unit test
import { describe, it, expect } from 'vitest';
import { generateKey } from '@/lib/keys';

describe('generateKey', () => {
  it('should generate key with correct prefix', () => {
    const key = generateKey('test-');
    expect(key).toStartWith('test-');
    expect(key.length).toBeGreaterThan(10);
  });
});
```

### Test Environment

Tests use a separate Supabase project. Set up `.env.test`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key
```

## Questions?

- **Discord**: [Join our community](https://discord.gg/mycelio)
- **GitHub Discussions**: Use for questions and ideas
- **Issues**: Report bugs and request features

## License

By contributing, you agree that your contributions will be licensed under the AGPL-3.0 License.
