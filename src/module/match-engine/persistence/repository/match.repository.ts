import { MatchModel } from "@match-engine/core/model/match.model";
import { Inject, Injectable } from "@nestjs/common";
import { DatabaseConnection } from "@shared/persistence/drizzle/connection";
import { DATABASE_CONNECTION } from "@shared/persistence/drizzle/drizzle-persistence.module";
import { Transaction } from "@shared/persistence/drizzle/type";
import { sql } from "drizzle-orm";
import { match } from "../entity/match.entity";
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
}
