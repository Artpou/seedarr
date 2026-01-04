# Development Rules

This directory contains development guidelines and best practices for the Seedarr project.

## 📁 Structure

```
rules/
└── GENERAL.md          # General development rules for the entire project

apps/
├── api/
│   └── RULE.md         # Backend-specific rules (Hono, Database, API)
└── web/
    └── RULE.md         # Frontend-specific rules (React, Tailwind, TanStack)
```

## 📖 How to Use These Rules

### For All Developers
1. **Start with** [`GENERAL.md`](./GENERAL.md) - Read this first to understand project-wide conventions
2. **Then read the specific rules** for the area you're working on:
   - Working on the API? Read [`/apps/api/RULE.md`](../apps/api/RULE.md)
   - Working on the web app? Read [`/apps/web/RULE.md`](../apps/web/RULE.md)

### Quick Reference

| Topic | General | Web | API |
|-------|---------|-----|-----|
| **Code Style** | ✅ | ✅ | ✅ |
| **TypeScript** | ✅ | ✅ | ✅ |
| **Git Practices** | ✅ | - | - |
| **Testing** | ✅ | ✅ | ✅ |
| **Security** | ✅ | - | ✅ |
| **React/Components** | - | ✅ | - |
| **Routing** | - | ✅ | ✅ |
| **Database** | - | - | ✅ |
| **Authentication** | - | - | ✅ |
| **Styling** | - | ✅ | - |
| **i18n** | ✅ | ✅ | - |

## 🎯 Key Principles

### 1. Type Safety First
- Use TypeScript everywhere
- Never use `any`
- Validate inputs with Zod
- Use proper type inference

### 2. Code Organization
- Feature-based structure
- Keep modules focused
- Co-locate related code
- Minimize cross-feature dependencies

### 3. Quality Standards
- Write self-documenting code
- Keep functions small and focused
- Handle errors gracefully
- Test critical paths

### 4. Consistency
- Follow established patterns
- Use Biome for formatting
- Follow naming conventions
- Keep commits focused

## 🔄 Keeping Rules Updated

These rules are living documents. When you:
- **Discover a better pattern** → Update the rules
- **Find an unclear guideline** → Clarify it
- **Adopt a new technology** → Document its usage
- **Learn from mistakes** → Add to "Common Pitfalls"

## 💡 Rule Philosophy

> "Rules are guidelines for good decisions, not obstacles to productivity."

- **Pragmatic**: Rules should make development easier, not harder
- **Flexible**: Use judgment - rules aren't absolute laws
- **Educational**: Understand the "why" behind each rule
- **Evolving**: Rules improve as the project matures

## 🤝 Contributing to Rules

When updating these rules:
1. Discuss significant changes with the team
2. Keep language clear and concise
3. Provide code examples
4. Explain the reasoning
5. Update all affected rule files

## 📚 External Resources

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Do's and Don'ts](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

### React
- [React Docs](https://react.dev/)
- [React Patterns](https://react.dev/learn/thinking-in-react)
- [React Hooks](https://react.dev/reference/react)

### Backend
- [Hono Documentation](https://hono.dev/)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Zod Documentation](https://zod.dev/)

### Tools
- [Biome](https://biomejs.dev/)
- [TanStack Query](https://tanstack.com/query/latest)
- [TanStack Router](https://tanstack.com/router/latest)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Remember**: These rules exist to help us write better code together. When in doubt, ask the team!

