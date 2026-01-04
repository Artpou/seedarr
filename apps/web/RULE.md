# Frontend Development Rules (Web App)

> These rules are specific to the web application. See [`/rules/GENERAL.md`](../../rules/GENERAL.md) for general development guidelines.

## 🏗️ Architecture

### Feature-Based Structure
```
src/features/
├── auth/
│   ├── components/
│   ├── hooks/
│   └── auth-store.ts
├── media/
│   ├── components/
│   ├── hooks/
│   └── helpers/
└── ...
```

- Each feature is self-contained with its components, hooks, and utilities
- Shared code goes in `src/shared/`
- Cross-feature dependencies should be minimal

### Routing
- Use **TanStack Router** file-based routing
- Route files in `src/routes/` directory
- Use route layouts:
  - `_app.*` - Authenticated routes (require login)
  - `_auth.*` - Public routes (login, signup)
- Dynamic routes: `$paramName` (e.g., `_app.movies.$movieId.tsx`)

## ⚛️ React Patterns

### Components

#### Component Structure
```typescript
import { useState } from "react";
import type { ComponentProps } from "react";

interface MyComponentProps {
  title: string;
  onAction: (id: string) => void;
  className?: string;
}

export function MyComponent({ title, onAction, className }: MyComponentProps) {
  const [state, setState] = useState(false);

  return (
    <div className={cn("base-classes", className)}>
      {/* Component content */}
    </div>
  );
}
```

#### Component Guidelines
- **Functional components only** - no class components
- Use **named exports** for components
- Extract complex JSX into separate components
- Keep components under 200 lines
- One component per file (except small, tightly coupled components)

### Hooks

#### Custom Hooks
- Name with `use` prefix: `useAuth`, `useMediaDetails`
- Extract reusable logic into custom hooks
- Return stable references (use `useMemo`/`useCallback` when needed)
- Keep hooks focused on a single responsibility

Example:
```typescript
export function useMediaLike(mediaId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (isLiked: boolean) => api.toggleLike(mediaId, isLiked),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media", mediaId] });
    },
  });
}
```

#### State Management
- Use **Zustand** for global state
- Use **TanStack Query** for server state
- Use React `useState`/`useReducer` for local component state
- Minimize prop drilling - use context or global state when needed

### Data Fetching

#### TanStack Query
- Use for all API calls
- Define query keys consistently: `["resource", id, filters]`
- Implement optimistic updates for mutations
- Use query invalidation properly
- Set appropriate `staleTime` and `cacheTime`

Example:
```typescript
export function useMovie(movieId: number) {
  return useQuery({
    queryKey: ["movie", movieId],
    queryFn: () => unwrap(api.media.movie[":id"].$get({ param: { id: movieId.toString() } })),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

## 🎨 Styling

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

### UI Components
- Use **Radix UI** primitives for complex components
- Extend and customize components in `src/shared/ui/`
- Follow shadcn/ui patterns
- Support both light and dark modes
- Ensure accessibility (keyboard navigation, ARIA labels)

### Component Variants
- Use `class-variance-authority` (cva) for component variants

Example:
```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-input bg-background hover:bg-accent",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3",
        lg: "h-10 px-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

## 🌐 API Integration

### Hono RPC Client
- Use typed API client: `api.resource.endpoint.$method()`
- Use `unwrap()` helper for error handling
- Type API responses properly
- Handle loading and error states

Example:
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ["torrents"],
  queryFn: () => unwrap(api.torrents.download.$get()),
});

if (isLoading) return <Loader />;
if (error) return <Error message={error.message} />;
if (!data) return null;
```

### Error Handling
- Display user-friendly error messages
- Use toast notifications for transient errors
- Implement error boundaries for catastrophic errors
- Log errors to console in development

## 🔄 Forms

### Form Handling
- Use **React Hook Form** for complex forms
- Use **Zod** for form validation
- Implement proper error messages
- Handle loading/submitting states

Example:
```typescript
const form = useForm<FormData>({
  resolver: zodResolver(formSchema),
  defaultValues: {
    username: "",
    password: "",
  },
});

const onSubmit = async (data: FormData) => {
  try {
    await api.auth.login.$post({ json: data });
    navigate({ to: "/" });
  } catch (error) {
    form.setError("root", { message: "Login failed" });
  }
};
```

## 🌍 Internationalization (i18n)

### Lingui Usage
- Wrap translatable strings in `<Trans>` component
- Use `t` macro for programmatic translations
- Extract messages: `pnpm lingui:extract`
- Compile messages: `pnpm lingui:compile`

Example:
```typescript
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react/macro";

// In JSX
<Trans>Welcome to Seedarr</Trans>

// Programmatic
const { t } = useLingui();
const message = t`User not found`;
```

## 🎭 Icons

- Use **Lucide React** for icons
- Import only needed icons (tree-shaking)
- Use consistent icon sizing
- Apply proper accessibility labels

```typescript
import { Home, Settings, User } from "lucide-react";

<Button>
  <Home className="size-4" />
  <span>Home</span>
</Button>
```

## 📱 Responsive Design

### Breakpoints
- Mobile-first approach
- Tailwind breakpoints: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- Test on multiple device sizes
- Use responsive utilities for layouts

### Mobile Considerations
- Touch-friendly tap targets (minimum 44x44px)
- Optimize for slower connections
- Reduce bundle size
- Test on actual devices

## ⚡ Performance

### Optimization Strategies
- **Code splitting**: Use lazy loading for routes
  ```typescript
  const MovieDetails = lazy(() => import("./movies/MovieDetails"));
  ```
- **Memoization**: Use `React.memo()` for expensive components
- **Virtual lists**: Use virtualization for long lists
- **Image optimization**: Use appropriate formats and lazy loading
- **Bundle analysis**: Monitor bundle size regularly

### React Query Best Practices
- Set appropriate cache times
- Use `staleTime` to reduce refetches
- Implement pagination for large datasets
- Use `select` option to transform data

## 🔧 Development Tools

### Browser DevTools
- Use React DevTools for component inspection
- Use TanStack Query DevTools for cache debugging
- Use TanStack Router DevTools for routing
- Monitor network requests and bundle size

### VS Code Extensions (Recommended)
- Biome extension for linting
- Tailwind CSS IntelliSense
- TypeScript error lens
- Path Autocomplete

## 🧪 Testing

### Component Testing
- Test user interactions
- Test edge cases and error states
- Mock API calls
- Use React Testing Library

Example:
```typescript
test("displays error message on failed login", async () => {
  render(<LoginForm />);
  
  fireEvent.change(screen.getByLabelText("Username"), {
    target: { value: "invalid" }
  });
  fireEvent.click(screen.getByRole("button", { name: "Login" }));
  
  expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
});
```

## 🚨 Common Pitfalls to Avoid

❌ **DON'T:**
- Use `any` type
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
- Keep components small and focused
- Extract reusable logic into hooks
- Handle all data fetching states
- Use proper ARIA labels
- Follow React best practices
- Implement proper error boundaries
- Use semantic HTML

## 📋 Checklist Before Commit

- [ ] Component is properly typed
- [ ] No TypeScript errors
- [ ] Linting passes (`pnpm lint`)
- [ ] Code is formatted (`pnpm format`)
- [ ] Strings are internationalized
- [ ] Handles loading and error states
- [ ] Responsive on mobile/tablet/desktop
- [ ] Accessible (keyboard nav, ARIA labels)
- [ ] No console errors in browser
- [ ] Tested in both light and dark mode

