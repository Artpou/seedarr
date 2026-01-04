# Frontend Development Rules (Web)

> These rules are specific to the web application. See [`.cursor/rules/RULE.md`](../.cursor/rules/RULE.md) for general project guidelines.

## Project Structure (Feature-Based)

```
apps/web/src/
├── features/           # Feature modules (domain-driven)
│   ├── auth/          # Authentication feature
│   │   └── auth-store.ts
│   ├── media/         # Media management
│   │   ├── components/
│   │   ├── helpers/
│   │   ├── hooks/
│   │   ├── parsers/
│   │   └── media.d.ts
│   ├── movies/        # Movie-specific UI
│   │   ├── components/
│   │   └── hooks/
│   ├── person/        # Person/cast features
│   ├── torrent/       # Torrent search
│   └── downloads/     # Downloads management
├── shared/            # Shared/reusable code
│   ├── ui/           # Radix UI components
│   ├── hooks/        # Global hooks (use-theme, use-mobile)
│   ├── helpers/      # Utility functions
│   ├── app-sidebar.tsx
│   └── app-topbar.tsx
├── lib/              # Core utilities
│   ├── api.ts       # Hono RPC client + unwrap() helper
│   └── utils.ts     # cn() and helpers
├── routes/           # TanStack Router routes
│   ├── _app.*       # Authenticated routes
│   └── _auth.*      # Public routes
└── locales/          # i18n translations
```

## Feature Organization

### Features (`features/[feature]/`)

- `components/` - Feature-specific UI components
- `hooks/` - Feature-specific React hooks
- `helpers/` - Feature-specific utilities
- `parsers/` - Data transformation logic
- `[feature].d.ts` - Feature type definitions
- `[feature]-store.ts` - Feature state (Zustand)

### Shared (`shared/`)

- `ui/` - Reusable UI components (Radix primitives)
- `hooks/` - Global hooks (theme, mobile, locale)
- `helpers/` - Cross-feature utilities
- Layout components (sidebar, topbar)

### Lib (`lib/`)

- Core utilities and API client
- `api.ts` - Hono RPC client with `unwrap()` helper
- `utils.ts` - Utility functions like `cn()`
- No feature-specific code

## Routing (TanStack Router)

- File-based routes in `src/routes/`
- Route groups: `_app.*` (authenticated), `_auth.*` (public)
- Use `beforeLoad` for auth checks and redirects
- Protected routes check auth via `api.auth.me.$get()`
- Wrap route content in `<Container>` component for consistent layout and spacing

Example:

```typescript
export const Route = createFileRoute("/_app/movies")({
  component: MoviesPage,
  beforeLoad: async () => {
    const user = useAuth.getState().user;
    if (!user) {
      throw redirect({ to: "/login" });
    }
  },
});

function MoviesPage() {
  return (
    <Container>
      {/* Page content */}
    </Container>
  );
}
```

## API Client (Hono RPC)

### Setup

- Use Hono RPC client: `hc<AppType>(baseUrl, options)`
- Type-safe client from `AppType` export: `api.[module].[endpoint].$method()`
- Methods: `$get()`, `$post()`, `$put()`, `$delete()`, `$patch()`

### Response Handling

- **Use `unwrap()` helper** from `lib/api.ts` for all API calls
- Pattern: `unwrap(api.endpoint.$method(params))`
- Benefits: Consistent error handling, throws on non-ok responses
- Works with both Hono RPC responses and standard `fetch` Response
- Let React Query handle errors (don't use try-catch unless specific fallback needed)

Example:

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ["media", id],
  queryFn: () => unwrap(api.media[":id"].$get({ param: { id } })),
});
```

## Type Usage

### Import from API

- **Always** import types from `@basement/api/types`
- **Never** recreate types that exist in the API
- **Never** define inline types for API data structures
- **Use** existing DTO types for mutations and queries

### Examples

✅ **Good: Using API types**

```typescript
import type { 
  Torrent, 
  Media, 
  UserSerialized, 
  DownloadTorrentInput,
  UserRole 
} from "@basement/api/types";

// Use API types directly in hooks
export function useStartDownload() {
  return useMutation({
    mutationFn: (input: DownloadTorrentInput) =>
      unwrap(api.torrents.download.$post({ json: input })),
  });
}

// Use derived types from API types
type MediaType = Media["type"];

// Use enum types from API
const hasRole = (minRole: UserRole): boolean => {
  // ...
};
```

❌ **Bad: Recreating types**

```typescript
// DON'T recreate types that exist in the API
type UserRole = "owner" | "admin" | "member" | "viewer";

// DON'T define inline parameter types
export function useStartDownload() {
  return useMutation({
    mutationFn: ({
      magnetUri,
      name,
      mediaId,
    }: {
      magnetUri: string;
      name: string;
      mediaId?: number;
    }) => {
      // This is wrong! Use DownloadTorrentInput instead
    }
  });
}

// DON'T recreate API data structures
interface LocalTorrent {
  title: string;
  tracker: string;
  // ... duplicating API types
}
```

### Serialized Types

When working with API responses that contain dates, use serialized types:

```typescript
import type { UserSerialized, TorrentDownloadSerialized } from "@basement/api/types";

// API returns dates as strings in JSON
const user: UserSerialized = await api.auth.me.$get();
// user.createdAt is string, not Date
```

### Type Inference

Prefer inferring types from API responses when needed:

```typescript
import type { ApiData, api } from "@/lib/api";

// Infer type from API endpoint
type TorrentList = ApiData<ReturnType<typeof api.torrents.download.$get>>;
```

## React Components

### Component Structure

```typescript
import { useState } from "react";

import { Button } from "@/shared/ui/button";
import { useAuth } from "@/features/auth/auth-store";

import type { Media } from "@basement/api/types";

interface MediaCardProps {
  media: Media;
  onAction?: (id: number) => void;
  className?: string;
}

export function MediaCard({ media, onAction, className }: MediaCardProps) {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div className={cn("rounded-lg overflow-hidden", className)}>
      {/* Component content */}
    </div>
  );
}
```

### Component Guidelines

- **Functional components only** - no class components
- Use **named exports** for components
- Extract complex JSX into separate components
- Keep components under 300 lines
- One component per file (except small, tightly coupled components)
- Use TypeScript for all components
- Properly type all props
- Handle loading/error states

### Component Placement

- **Reusable UI components**: Place in `shared/ui/` (e.g., Button, Card, Dialog)
- **Feature-specific components**: Place in `features/[feature]/components/`
- **Shared layout components**: Place in `shared/` (e.g., app-sidebar, app-topbar)
- **Component reusability**: Extract common patterns into reusable components
- Use `<Container>` from `shared/ui/container` for route page layouts

## Hooks

### Custom Hooks

- Name with `use` prefix: `useAuth`, `useMediaDetails`
- Extract reusable logic into custom hooks
- Return stable references (use `useMemo`/`useCallback` when needed)
- Keep hooks focused on a single responsibility

Example:

```typescript
export function useMediaLike(mediaId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (isLiked: boolean) =>
      unwrap(api.media.like.$post({ json: { mediaId, isLiked } })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media", mediaId] });
    },
  });
}
```

### Hook Libraries

- Use `@uidotdev/usehooks` for common React patterns when available
- Examples: `useIntersectionObserver`, `useDebounce`, `useLocalStorage`
- Custom hooks in `shared/hooks/` for global behavior
- Feature-specific hooks in `features/[feature]/hooks/`

## State Management

### React Query (TanStack Query)

- Use for all API calls and server state
- Define query keys consistently: `["resource", id, filters]`
- Implement optimistic updates for mutations
- Use query invalidation properly
- Set appropriate `staleTime` and `cacheTime`

Example:

```typescript
export function useTorrents() {
  return useQuery({
    queryKey: ["torrents"],
    queryFn: () => unwrap(api.torrents.download.$get()),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useDownloadTorrent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (magnetUri: string) =>
      unwrap(api.torrents.download.$post({ json: { magnetUri } })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["torrents"] });
    },
  });
}
```

### Zustand

- Use for global client-side state
- Stores in `features/[feature]/[feature]-store.ts`
- Use `persist` middleware for localStorage
- Auth state in `features/auth/auth-store.ts` (synced with API)

Example:

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ThemeStore {
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
}

export const useTheme = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: "dark",
      setTheme: (theme) => set({ theme }),
    }),
    { name: "theme" }
  )
);
```

### Local Component State

- Use React `useState`/`useReducer` for local component state
- Don't store derived state - compute it
- Minimize prop drilling - use context or global state when needed

## Styling

### Tailwind CSS

- Use **Tailwind CSS v4** utility classes
- Follow mobile-first responsive design
- Use Tailwind's built-in modifiers: `hover:`, `focus:`, `dark:`
- Group related utilities logically
- Use `cn()` utility for conditional classes

Example:

```typescript
<button
  className={cn(
    "px-4 py-2 rounded-md font-medium",
    "bg-primary text-primary-foreground",
    "hover:bg-primary/90",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    className
  )}
>
```

### Design Tokens

- Tailwind v4 (no config file, use `@theme` in CSS)
- Design tokens via CSS variables in `styles.css`
- Dark mode support via `dark:` prefix
- Use `cn()` from `lib/utils.ts` for conditional classes

## Forms

### Form Handling

- Use **React Hook Form** for complex forms
- Use **Zod** for form validation with `@hookform/resolvers`
- Implement proper error messages
- Handle loading/submitting states

Example:

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginForm() {
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      await unwrap(api.auth.login.$post({ json: data }));
      navigate({ to: "/" });
    } catch (error) {
      form.setError("root", { message: "Login failed" });
    }
  };

  return <form onSubmit={form.handleSubmit(onSubmit)}>{/* ... */}</form>;
}
```

## Internationalization (i18n)

### Lingui Usage

- Wrap translatable strings in `<Trans>` component
- Use `t` macro for programmatic translations
- Extract messages: `pnpm lingui:extract` (in web package)
- Compile messages: `pnpm lingui:compile` (in web package)

Example:

```typescript
import { Trans, msg } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";

// In JSX
<Trans>Welcome to Seedarr</Trans>

// Programmatic
const { t } = useLingui();
const message = t(msg`User not found`);

// With variables
<Trans>Hello {username}</Trans>
```

## Icons

- Use **Lucide React** for icons
- use Icon suffix for icons: `HomeIcon`, `SettingsIcon`, `UserIcon`
- Import only needed icons (tree-shaking)

## Common Pitfalls to Avoid

❌ **DON'T:**

- Use `any` type
- Recreate types that exist in the API
- Mutate props directly
- Create large monolithic components
- Forget to handle loading/error states
- Hardcode strings (use i18n)
- Use inline styles (use Tailwind)
- Fetch data in components (use TanStack Query)
- Store derived state
- Use `index` as key in lists

✅ **DO:**

- Use TypeScript properly
- Import types from `@basement/api/types`
- Keep components small and focused
- Extract reusable logic into hooks
- Handle all data fetching states
- Use proper ARIA labels
- Follow React best practices
- Implement proper error boundaries
- Use semantic HTML

## Responsive Design

### Breakpoints

- Mobile-first approach
- Tailwind breakpoints: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- Test on multiple device sizes
- Use responsive utilities for layouts

Example:

```typescript
<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
  {/* Grid adjusts based on screen size */}
</div>
```
