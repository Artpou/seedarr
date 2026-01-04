---
alwaysApply: true
---

# Seedarr Project Rules

> For specific patterns, see [API Rules](.cursor/rules/api/RULE.md) and [Web Rules](.cursor/rules/web/RULE.md)

## Tech Stack

- **Package Manager**: pnpm (v9.0.0+)
- **Runtime**: Node.js v18+ (tsx for API)
- **API**: Hono with TypeScript
- **Web**: React 19 + TanStack Router + Vite
- **Database**: SQLite with Drizzle ORM
- **Validation**: Zod (zValidator from @hono/zod-validator)
- **Styling**: Tailwind CSS v4 + Radix UI
- **i18n**: Lingui
- **State**: Zustand with persist middleware
- **Linting**: Biome (not ESLint/Prettier)
- **Torrent**: WebTorrent for downloads and streaming

## Project Structure

- **Monorepo**: pnpm workspaces with 2 apps
  - `apps/api` - Hono backend (port 3002)
  - `apps/web` - React frontend (port 3000)
- **Aliases**: Use `@/` for local imports, `@basement/api` for API types

## Code Style (Biome)

### Formatting

- 2 space indentation
- 100 character line width
- No semicolons (Biome default)
- Double quotes for strings

### Linting

- React recommended rules enabled
- a11y rules enabled
- Import type coercion disabled (`useImportType: off`)
- Auto-fix on save via `biome check --write`

### File Naming

- kebab-case for files: `user-service.ts`, `movie-card.tsx`, `use-theme.ts`
- PascalCase for components: `MovieCard`, `Button`
- camelCase for functions/variables
- SCREAMING_SNAKE_CASE for constants
- Feature folders: singular noun (`media/`, `auth/`, not `medias/`, `auths/`)

## Development Workflow

### Commands

- `pnpm dev` - Start both API and web
- `pnpm dev:api` - API only (port 3002)
- `pnpm dev:web` - Web only (port 3000)
- `pnpm lint` - Check all packages
- `pnpm lint:fix` - Auto-fix linting issues
- `pnpm format` - Format code with Biome
- `pnpm type-check` - TypeScript validation
- `pnpm check` - Run lint:fix + type-check + lint (comprehensive check)

### Database Commands

- `pnpm db:generate` - Generate migrations
- `pnpm db:migrate` - Apply migrations
- `pnpm db:push` - Push schema (dev only)
- `pnpm db:studio` - Open Drizzle Studio

### Git Hooks (Husky + lint-staged)

- Pre-commit: Biome check on staged files
- Runs on `*.{ts,tsx,js,jsx}` and `*.{json,md}`
- Auto-formats and fixes linting issues

### Type Safety

- Strict TypeScript enabled
- **Never use `any`** - use `unknown` if type is truly unknown
- Use `as const` for constant objects/arrays
- Prefer type narrowing over type assertions
- Share types via workspace packages (`@basement/api`)
- API types exported for web consumption
- Use Zod for runtime validation

## Common Patterns

### Error Handling

- API: Throw errors, caught by Hono error handling middleware
- Web: Use `unwrap()` helper, let React Query handle errors naturally
- Avoid try-catch blocks unless specific fallback behavior is needed
- Use custom error classes when appropriate (e.g., `UnauthorizedError`)

### Async/Await

- Always use async/await (no `.then()`)
- Handle errors with try-catch when needed
- Services return promises

### Import Organization (Biome)

- **Group 1**: React packages (`react`, `react-dom`)
- **Group 2**: External packages (npm dependencies)
- **Group 3**: `@/lib/**` imports
- **Group 4**: `@/shared/**` imports
- **Group 5**: Other `@/**` imports (features, routes)
- **Group 6**: Relative imports (`./`, `../`)
- Blank lines between groups
- Use `import type` for type-only imports when possible

### Environment Variables

- API: Use `process.env.*`
- Web: Use `import.meta.env.VITE_*`
- Load with `@dotenvx/dotenvx` in API
- Never commit `.env` files
- Use `.env.example` for documentation
- Validate required env vars at startup

## Security

### Authentication & Authorization

- Session-based auth with httpOnly cookies
- Password hashing with salt (custom util)
- Session validation via `validateSession(token)`
- Never store passwords in plain text
- Roles: `viewer`, `member`, `admin`, `owner`
- Use `authGuard` middleware for protected routes
- Use `requireRole()` middleware for role-specific routes

### Input Validation

- Validate ALL user inputs with Zod
- Sanitize data before database queries
- Don't trust client-side data
- Return appropriate HTTP status codes
- Don't expose internal errors to clients

## Common Pitfalls to Avoid

❌ **DON'T:**

- Use `any` type (use `unknown` or proper types)
- Mutate props directly
- Create large monolithic components/functions
- Forget to handle loading/error states
- Hardcode strings (use i18n with Lingui)
- Skip input validation
- Trust client-side data
- Expose internal errors to clients
- Store derived state
- Use `index` as key in lists

✅ **DO:**

- Use TypeScript properly with strict mode
- Keep components and functions small and focused
- Extract reusable logic into hooks/services
- Use semantic HTML

## Checklist Before Commit

- [ ] No TypeScript errors
- [ ] Linting passes: `pnpm check`
- [ ] No console.log in production code
- [ ] Properly typed (no `any`)
- [ ] Error handling implemented
- [ ] Validation schemas defined (Zod)
- [ ] Sensitive data not exposed
- [ ] Resources cleaned up properly

## Additional Resources

- See [`.cursor/rules/api/RULE.md`](.cursor/rules/api/RULE.md) for API-specific patterns
- See [`.cursor/rules/web/RULE.md`](.cursor/rules/web/RULE.md) for web-specific patterns
- See [`/rules/GENERAL.md`](../../rules/GENERAL.md) for comprehensive guidelines
- [Hono Documentation](https://hono.dev/)
- [React Docs](https://react.dev/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [TanStack Query](https://tanstack.com/query/latest)
- [TanStack Router](https://tanstack.com/router/latest)
- [Biome](https://biomejs.dev/)
