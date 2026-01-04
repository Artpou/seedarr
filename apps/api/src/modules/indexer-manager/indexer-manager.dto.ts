import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { indexerManager, indexerTypeEnum } from "@/db/schema";

// Database schemas
export const indexerManagerSelectSchema = createSelectSchema(indexerManager);
export const indexerManagerInsertSchema = createInsertSchema(indexerManager);

// Exported types
export type IndexerManager = typeof indexerManagerSelectSchema._output;
export type NewIndexerManager = typeof indexerManagerInsertSchema._input;

// Request schemas
export const createIndexerManagerSchema = z.object({
  name: z.enum(indexerTypeEnum),
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  selected: z.boolean().optional(),
});

export type CreateIndexerManagerInput = z.infer<typeof createIndexerManagerSchema>;
