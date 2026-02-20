import { relations } from "drizzle-orm";
import { serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { frags } from ".";
import { matchEngineSchema } from "./schema";

export const player = matchEngineSchema.table("player", {
	id: serial("id").primaryKey(),
	username: varchar("username", { length: 255 }).unique().notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const playersRelations = relations(player, ({ many }) => ({
	fragsAsKiller: many(frags, { relationName: "killer" }),
	fragsAsVictim: many(frags, { relationName: "victim" }),
}));
