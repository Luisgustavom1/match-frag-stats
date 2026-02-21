import { InferSelectModel } from "drizzle-orm";
import {
	integer,
	serial,
	timestamp,
	unique,
	varchar,
} from "drizzle-orm/pg-core";
import { match, player } from ".";
import { matchEngineSchema } from "./schema";

export const award = matchEngineSchema.table(
	"award",
	{
		id: serial("id").primaryKey(),
		playerId: integer("player_id")
			.references(() => player.id)
			.notNull(),
		matchId: integer("match_id")
			.references(() => match.id)
			.notNull(),
		type: varchar("type", { length: 50 }).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(t) => [unique().on(t.playerId, t.matchId, t.type)],
);

export type AwardEntity = InferSelectModel<typeof award>;
