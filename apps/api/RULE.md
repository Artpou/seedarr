# Backend Development Rules (API)

> These rules are specific to the API server. See [`/rules/GENERAL.md`](../../rules/GENERAL.md) for general development guidelines.

## 🏗️ Architecture

### Module-Based Structure

```
src/modules/
├── auth/
│   ├── auth.route.ts
│   ├── auth.guard.ts
│   └── role.guard.ts
├── media/
│   ├── media.route.ts
│   └── media.service.ts
└── torrent/
    ├── torrent.route.ts
    ├── torrent.service.ts
    └── torrent-download.service.ts
```

- Each module contains related routes and services
- Keep business logic in service classes
- Use guards for authentication/authorization
- Share utilities in `src/helpers/`

### Service Pattern

- Extend `AuthenticatedService` for services needing database/user access
- Use dependency injection via context
- Keep services focused on business logic
- Handle errors appropriately

Example:

```typescript
export class MediaService extends AuthenticatedService {
  async getMediaById(id: number): Promise<Media | null> {
    return await this.db.select().from(media).where(eq(media.id, id)).get();
  }
}
```

## 🛣️ Hono Framework

### Route Definition

```typescript
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { HonoVariables } from "@/types/hono";

export const mediaRoutes = new Hono<{ Variables: HonoVariables }>()
  .use("*", authGuard) // Apply middleware
  .get("/", async (c) => {
    // Route handler
    return c.json(await MediaService.fromContext(c).getAll());
  })
  .post("/", zValidator("json", createMediaSchema), async (c) => {
    const data = c.req.valid("json");
    return c.json(await MediaService.fromContext(c).create(data));
  });
```

### Route Conventions

- Use RESTful conventions:
  - `GET /resource` - List resources
  - `GET /resource/:id` - Get single resource
  - `POST /resource` - Create resource
  - `PATCH /resource/:id` - Update resource
  - `DELETE /resource/:id` - Delete resource
- Group related routes in modules
- Apply middleware at appropriate levels
- Return appropriate HTTP status codes

### Middleware

- **authGuard**: Require authentication
- **requireRole**: Check user role
- Use middleware for cross-cutting concerns
- Order matters - apply in correct sequence

Example:

```typescript
export const adminRoutes = new Hono<{ Variables: HonoVariables }>()
  .use("*", authGuard) // First authenticate
  .use("*", requireRole("admin")) // Then check role
  .get("/users", async (c) => {
    // Only admins reach here
  });
```

## 🔐 Authentication & Authorization

### Session Management

- Use cookie-based sessions
- Set `httpOnly`, `secure`, `sameSite` flags
- Implement session expiration
- Clean up expired sessions

### Password Handling

```typescript
import { hashPassword, verifyPassword } from "@/auth/password.util";

// Hash before storing
const hashedPassword = await hashPassword(plainPassword);

// Verify on login
const isValid = await verifyPassword(plainPassword, hashedPassword);
```

### Role-Based Access Control (RBAC)

- Roles: `viewer`, `member`, `admin`, `owner`
- `viewer`: Read-only access
- `member`: Can download torrents
- `admin`: User management
- `owner`: Full access

```typescript
// In routes
.use("/download/*", requireRole("member"))

// In services
if (!["admin", "owner"].includes(user.role)) {
  throw new Error("Unauthorized");
}
```

## 🗄️ Database (Drizzle ORM)

### Schema Definition

```typescript
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: userRoleEnum }).notNull().default("viewer"),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
```

### Query Patterns

```typescript
// Select
const users = await db.select().from(user).where(eq(user.role, "admin"));

// Insert
await db.insert(user).values({ username, password, role });

// Update
await db.update(user).set({ role: "admin" }).where(eq(user.id, userId));

// Delete
await db.delete(user).where(eq(user.id, userId));

// Joins
const result = await db
  .select()
  .from(media)
  .leftJoin(mediaLike, eq(media.id, mediaLike.mediaId))
  .where(eq(mediaLike.userId, userId));
```

### Migrations

- Generate migrations: `pnpm db:generate`
- Apply migrations: `pnpm db:migrate`
- Push schema (dev): `pnpm db:push`
- Never edit migration files manually
- Test migrations before deploying

### Best Practices

- Use transactions for related operations
- Implement proper indexes for frequently queried columns
- Use prepared statements (Drizzle does this automatically)
- Implement soft deletes where appropriate
- Use foreign keys for referential integrity

## ✅ Validation

### Validation Rules

- Validate ALL user inputs
- Use Zod for type-safe validation
- Return clear error messages
- Validate at API boundary (routes)
- Don't trust client-side validation

## 🚨 Error Handling

### Error Responses

```typescript
// Validation error
if (!isValid) {
  return c.json({ error: "Invalid input", details: errors }, 400);
}

// Not found
if (!user) {
  return c.json({ error: "User not found" }, 404);
}

// Unauthorized
if (user.role !== "admin") {
  return c.json({ error: "Insufficient permissions" }, 403);
}

// Server error
try {
  // operation
} catch (error) {
  console.error("Operation failed:", error);
  return c.json({ error: "Internal server error" }, 500);
}
```

## 📊 Performance

### Database Optimization

- Use indexes on frequently queried columns
- Avoid N+1 queries (use joins)
- Implement pagination for large datasets
- Use database connection pooling
- Monitor slow queries

## 📦 Dependencies

### Core Dependencies

- **hono**: Web framework
- **drizzle-orm**: Database ORM
- **zod**: Schema validation
- **webtorrent**: Torrent client
- **ms**: Time utilities

### Adding Dependencies

- Check package size
- Verify TypeScript support
- Check maintenance status
- Review security vulnerabilities

## 📋 Checklist Before Commit

- [ ] Routes are properly typed
- [ ] Validation schemas are defined
- [ ] Authentication/authorization is implemented
- [ ] Error handling is proper
- [ ] No typescript error + Linting passes (`pnpm check`)
- [ ] Sensitive data is not exposed

## 🚨 Common Pitfalls to Avoid

❌ **DON'T:**

- Trust user input
- Use `any` type
- Hardcode configuration values
- Expose internal errors to clients
- Use synchronous file operations
