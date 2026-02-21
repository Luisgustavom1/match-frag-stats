import { InferSelectModel, relations } from "drizzle-orm";
import { integer, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { match, player } from ".";
import { matchEngineSchema } from "./schema";

export const frags = matchEngineSchema.table("frags", {
	id: serial("id").primaryKey(),
	matchId: integer("match_id")
		.references(() => match.id)
		.notNull(),
	// nullable to <WORLD>
	killerId: integer("killer_id").references(() => player.id),
	victimId: integer("victim_id").references(() => player.id),
	weapon: varchar("weapon", { length: 50 }).notNull(),
	occurredAt: timestamp("occurred_at").notNull(),
});

export const fragsRelations = relations(frags, ({ one }) => ({
	match: one(match, {
		fields: [frags.matchId],
		references: [match.id],
	}),
	killer: one(player, {
		fields: [frags.killerId],
		references: [player.id],
		relationName: "killer",
	}),
	victim: one(player, {
		fields: [frags.victimId],
		references: [player.id],
		relationName: "victim",
	}),
}));

export type FragsEntity = InferSelectModel<typeof frags>;
