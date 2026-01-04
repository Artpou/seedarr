import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { media } from "@/db/schema";

// Database schemas
export const mediaSelectSchema = createSelectSchema(media);
export const mediaInsertSchema = createInsertSchema(media);

// Exported types
export type Media = typeof mediaSelectSchema._output;
export type NewMedia = typeof mediaInsertSchema._input;

// Request schemas
export const mediaStatusBatchSchema = z.object({
  mediaIds: z.array(z.number()),
});

export type MediaStatusBatchInput = z.infer<typeof mediaStatusBatchSchema>;
