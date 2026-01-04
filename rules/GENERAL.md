# General Development Rules

## 📋 Code Organization

### Project Structure

- Follow feature-based architecture in `apps/web/src/features/`
- Keep shared/reusable code in `apps/web/src/shared/` and `apps/api/src/helpers/`
- Each feature should contain its own components, hooks, and utilities
- Module-based organization in API with routes and services co-located

### File Naming

- Use **kebab-case** for files: `user-settings.tsx`, `auth.service.ts`
- Component files should match component name: `UserProfile.tsx` exports `UserProfile`
- Route files follow TanStack Router conventions: `_app.movies.$movieId.tsx`
- Test files: `*.test.ts` or `*.spec.ts`

## 🎨 Code Style

### TypeScript

- **Always use TypeScript** - no plain JavaScript files
- Enable strict mode in `tsconfig.json`
- Prefer interfaces over types for object shapes
- Use type inference when obvious, explicit types when clarity is needed

### Formatting & Linting

- Use **Biome** for linting and formatting
- Run `pnpm lint:fix` before committing
- Follow existing code style patterns
- No `console.log` in production code (use logger helper in API)

### Imports

- Organize imports: external libraries → internal modules → types
- Use path aliases: `@/` for src root
- Group related imports together
- Remove unused imports

Example:

```typescript
// External libraries
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

// Internal modules
import { Button } from "@/shared/ui/button";
import { useAuth } from "@/features/auth/auth-store";

// Types
import type { User } from "@basement/api/types";
```

## 🔒 Type Safety

### General Rules

- Never use `any` - use `unknown` if type is truly unknown
- Use `as const` for constant objects/arrays
- Prefer type narrowing over type assertions
- Use discriminated unions for complex state management

### API Types

- Use **Zod** for runtime validation
- Define schemas in route files or separate schema files
- Share types between API and web using `@basement/api/types`
- Export inferred types from Zod schemas

### Frontend Types

- Use TypeScript for all React components
- Properly type component props
- Use generics for reusable components
- Type event handlers explicitly

## 🧪 Testing

### Unit Tests

- Write tests for business logic and utilities
- Use descriptive test names: `it("should return user when ID is valid")`
- Mock external dependencies
- Aim for high coverage on critical paths

### Integration Tests

- Test API routes with real database (use test DB)
- Test component integration with hooks
- Use realistic test data

## 📦 Dependencies

### Adding Dependencies

- Use `pnpm add` for production dependencies
- Use `pnpm add -D` for dev dependencies
- Check package size and maintenance status before adding
- Prefer packages with TypeScript support

### Updating Dependencies

- Keep dependencies up to date regularly
- Test thoroughly after major version updates
- Use `pnpm outdated` to check for updates

## 🔐 Security

### Authentication

- Never store passwords in plain text
- Use bcrypt for password hashing
- Implement proper session management
- Validate all user inputs

### API Security

- Always use authentication guards for protected routes
- Implement role-based access control (RBAC)
- Validate and sanitize all inputs
- Use CORS properly

### Environment Variables

- Never commit `.env` files
- Use `.env.example` for documentation
- Validate required env vars at startup
- Use different values for dev/staging/prod

## 📝 Git Practices

### Commits

- Write clear, descriptive commit messages
- Use conventional commits format when possible:
  - `feat:` for new features
  - `fix:` for bug fixes
  - `refactor:` for code refactoring
  - `docs:` for documentation
  - `chore:` for maintenance tasks

### Branches

- Use descriptive branch names: `feature/user-profile`, `fix/auth-bug`
- Keep branches small and focused
- Delete branches after merging
- Rebase on main before merging

### Pull Requests

- Write clear PR descriptions
- Reference related issues
- Request reviews from team members
- Address review comments promptly

## 🚀 Performance

### General

- Avoid premature optimization
- Profile before optimizing
- Consider bundle size for frontend dependencies
- Use pagination for large data sets

### Frontend

- Use React.memo() for expensive components
- Implement virtualization for long lists
- Lazy load routes and components
- Optimize images (use appropriate formats and sizes)

### Backend

- Use database indexes appropriately
- Implement caching where beneficial
- Stream large responses
- Use connection pooling

## ♿ Accessibility

- Use semantic HTML elements
- Include proper ARIA labels
- Ensure keyboard navigation works
- Test with screen readers
- Maintain proper color contrast
- Support both light and dark modes

## 🌍 Internationalization

- Use Lingui for translations
- Extract strings to translation files: `pnpm lingui:extract`
- Compile translations: `pnpm lingui:compile`
- Support English and French (extensible to more)
- Use `<Trans>` component for translatable strings

## 📚 Documentation

### Code Documentation

- Write JSDoc comments for complex functions
- Document non-obvious decisions
- Keep comments up to date
- Prefer self-documenting code over comments

### README Files

- Keep README files updated
- Include setup instructions
- Document environment variables
- Provide usage examples

## 🎯 Best Practices

### React

- Use functional components with hooks
- Keep components small and focused
- Lift state up when needed
- Use custom hooks for reusable logic
- Implement error boundaries

### API

- Follow RESTful conventions
- Return appropriate HTTP status codes
- Use middleware for cross-cutting concerns
- Implement proper error handling
- Log important events and errors

### Database

- Use migrations for schema changes
- Never modify the database directly in production
- Use transactions for related operations
- Implement soft deletes where appropriate
