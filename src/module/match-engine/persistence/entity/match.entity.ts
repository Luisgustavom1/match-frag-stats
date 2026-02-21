import { InferSelectModel, relations } from "drizzle-orm";
import { serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { frags } from ".";
import { matchEngineSchema } from "./schema";

export const match = matchEngineSchema.table("match", {
	id: serial("id").primaryKey(),
	externalId: varchar("external_id", { length: 50 }).unique().notNull(),
	startedAt: timestamp("started_at").notNull(),
	endedAt: timestamp("ended_at"),
});

export const matchesRelations = relations(match, ({ many }) => ({
	frags: many(frags),
}));

export type MatchEntity = InferSelectModel<typeof match>;
