/// <reference types="@types/bun" />
import "./env";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "./schema";

const sqlite = new Database("./dev.db");

// Create drizzle instance with schema
export const db = drizzle(sqlite, { schema });

// Re-export all drizzle-orm functions to ensure version consistency
export * from "drizzle-orm";
export { eq } from "drizzle-orm";
