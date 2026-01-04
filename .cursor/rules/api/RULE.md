---
globs: apps/api/*
alwaysApply: false
---

## 🏗️ Architecture

### Module-Based Structure

```
src/modules/
├── auth/
│   ├── auth.dto.ts       # Schemas and types
│   ├── auth.route.ts     # Route definitions
│   └── auth.guard.ts     # Middleware
├── media/
│   ├── media.dto.ts
│   ├── media.route.ts
│   └── media.service.ts
└── torrent/
    ├── torrent.dto.ts
    ├── torrent.route.ts
    ├── torrent.service.ts
    └── torrent-download.service.ts
```

- Each module contains related routes, services, and DTOs
- Keep business logic in service classes
- Use guards for authentication/authorization
- Share utilities in `src/helpers/`

### DTO Pattern

Each module **must** have a `{module}.dto.ts` file containing:
- **Zod schemas** for validation (request/response)
- **TypeScript types** inferred from schemas
- **Database types** using drizzle-zod's `createSelectSchema` and `createInsertSchema`

#### Database Types

For database entities, use Drizzle-Zod to generate schemas:

```typescript
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { user } from "@/db/schema";

// Database schemas
export const userSelectSchema = createSelectSchema(user);
export const userInsertSchema = createInsertSchema(user);

// Exported types
export type User = Omit<typeof userSelectSchema._output, "password">;
export type NewUser = typeof userInsertSchema._input;
```

#### Non-Database Types

For types that don't come from the database (e.g., API responses from external services):

```typescript
import { z } from "zod";

// Define Zod schema first
export const torrentSchema = z.object({
  title: z.string(),
  tracker: z.string(),
  size: z.number(),
  seeders: z.number(),
  // ... other fields
});

// Infer TypeScript type
export type Torrent = z.infer<typeof torrentSchema>;
```

#### Request Schemas

For API request validation:

```typescript
export const createUserSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
  role: z.enum(["owner", "admin", "member", "viewer"]),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
```

### Type Exports

- **`schema.ts`**: Only export table definitions and enums (e.g., `IndexerType`, `UserRole`)
- **`{module}.dto.ts`**: Export all types and schemas for the module
- **`types.ts`**: Re-export only TypeScript types (not Zod schemas) for frontend consumption

Example `types.ts`:

```typescript
// Export DTO types (TypeScript types only, not Zod schemas)
export type { User, CreateUserInput, UpdateUserInput } from "./modules/user/user.dto";
export type { Media, MediaStatusBatchInput } from "./modules/media/media.dto";
export type { Torrent, TorrentIndexer } from "./modules/torrent/torrent.dto";

// Export enums from schema
export type { IndexerType, UserRole } from "./db/schema";

// Export route types
export type { AuthRoutesType } from "./modules/auth/auth.route";
export type { AppType } from "./server";
```

### Service Pattern

- Extend `AuthenticatedService` for services needing database/user access
- Use dependency injection via context
- Keep services focused on business logic
- Handle errors appropriately
- Import types from DTOs, not from schema

Example:

```typescript
import { AuthenticatedService } from "@/classes/authenticated-service";
import type { Media } from "./media.dto";

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
import { createMediaSchema, mediaSelectSchema } from "./media.dto";
import { MediaService } from "./media.service";

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

export type MediaRoutesType = typeof mediaRoutes;
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
- Recreate types that already exist
- Export types from `schema.ts` (only tables and enums)
- Define inline Zod schemas in route files
- Import types from `schema.ts` in services (use DTOs)
- Hardcode configuration values
- Expose internal errors to clients
- Use synchronous file operations

✅ **DO:**

- Define all schemas in DTO files
- Use `createSelectSchema` and `createInsertSchema` for database types
- Infer TypeScript types from Zod schemas
- Export only TypeScript types in `types.ts` (not Zod schemas)
- Import types from DTOs in route and service files
