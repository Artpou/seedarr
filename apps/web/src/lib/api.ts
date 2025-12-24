import type { App } from "@basement/api";
import { edenTreaty } from "@elysiajs/eden";

export const api = edenTreaty<App>(
  import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_URL || "http://localhost:3002",
);
