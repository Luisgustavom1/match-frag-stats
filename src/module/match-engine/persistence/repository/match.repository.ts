import { MatchModel } from "@match-engine/core/model/match.model";
import { Inject, Injectable } from "@nestjs/common";
import { DatabaseConnection } from "@shared/persistence/drizzle/connection";
import { DATABASE_CONNECTION } from "@shared/persistence/drizzle/drizzle-persistence.module";
import { Transaction } from "@shared/persistence/drizzle/type";
import { asc, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { frags } from "../entity/frags.entity";
import { match } from "../entity/match.entity";
import { player } from "../entity/player.entity";
import { FragsMapper } from "../mapper/frags.mapper";
import { MatchMapper } from "../mapper/match.mapper";

@Injectable()
export class MatchRepository {
	constructor(
		@Inject(DATABASE_CONNECTION)
		private readonly dbConn: DatabaseConnection,
	) {}

	async bulkCreate(
		matches: MatchModel[],
		tx?: Transaction,
	): Promise<MatchModel[]> {
		if (!matches.length) return [];

		const upsertedMatches = await (tx || this.dbConn)
			.insert(match)
			.values(matches.map((m) => MatchMapper.toEntity(m)))
			.onConflictDoUpdate({
				target: match.externalId,
				set: {
					endedAt: sql`excluded.ended_at`,
					startedAt: sql`excluded.started_at`,
				},
			})
			.returning();

		return upsertedMatches.map((upsertedMatch) =>
			MatchMapper.toDomain(upsertedMatch),
		);
	}

	async findAllWithFragsAndPlayers(): Promise<MatchModel[]> {
		const killerAlias = alias(player, "killer");
		const victimAlias = alias(player, "victim");

		const results = await this.dbConn
			.select({
				match: match,
				frag: frags,
				killerUsername: killerAlias.username,
				victimUsername: victimAlias.username,
			})
			.from(match)
			.leftJoin(frags, eq(frags.matchId, match.id))
			.leftJoin(killerAlias, eq(frags.killerId, killerAlias.id))
			.leftJoin(victimAlias, eq(frags.victimId, victimAlias.id))
			.orderBy(asc(match.startedAt), asc(frags.occurredAt));

		const hydrateMatches = (rows: typeof results): MatchModel[] => {
			const matchMap = new Map<number, MatchModel>();

			for (const { match, frag, killerUsername, victimUsername } of rows) {
				if (!matchMap.has(match.id)) {
					matchMap.set(match.id, MatchMapper.toDomain(match));
				}

				const hasFrag = !!frag;
				if (!hasFrag) continue;

				if (!victimUsername || !killerUsername) continue;

				matchMap
					.get(match.id)
					?.addFrag(
						FragsMapper.toDomain(
							frag,
							killerUsername,
							victimUsername,
							match.externalId,
						),
					);
			}

			return [...matchMap.values()];
		};

		return hydrateMatches(results);
	}
}
