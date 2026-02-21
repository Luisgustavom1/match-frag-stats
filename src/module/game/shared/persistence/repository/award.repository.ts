import { Inject, Injectable } from "@nestjs/common";
import { AwardModel } from "@src/module/game/engine/core/model/award.model";
import { DatabaseConnection } from "@src/module/shared/persistence/drizzle/connection";
import { DATABASE_CONNECTION } from "@src/module/shared/persistence/drizzle/drizzle-persistence.module";
import { Transaction } from "@src/module/shared/persistence/drizzle/type";
import { eq, inArray } from "drizzle-orm";
import { award } from "../entity/award.entity";
import { match } from "../entity/match.entity";
import { player } from "../entity/player.entity";
import { AwardMapper } from "../mapper/award.mapper";

@Injectable()
export class AwardRepository {
	constructor(
		@Inject(DATABASE_CONNECTION)
		private readonly dbConn: DatabaseConnection,
	) {}

	async bulkCreate(
		awards: AwardModel[],
		playerIdsByUsername: Map<string, number>,
		matchIdsByExternalId: Map<string, number>,
		tx?: Transaction,
	): Promise<void> {
		if (!awards.length) return;

		const rows = awards.map((a) =>
			AwardMapper.toEntity(a, playerIdsByUsername, matchIdsByExternalId),
		);

		await (tx || this.dbConn).insert(award).values(rows).onConflictDoNothing();
	}

	async findByMatchExternalIds(externalIds?: string[]): Promise<AwardModel[]> {
		const rows = await this.dbConn
			.select({
				award,
				playerUsername: player.username,
				matchExternalId: match.externalId,
			})
			.from(award)
			.innerJoin(player, eq(award.playerId, player.id))
			.innerJoin(match, eq(award.matchId, match.id))
			.where(
				externalIds?.length
					? inArray(match.externalId, externalIds)
					: undefined,
			);

		return rows.map(({ award: awardRow, playerUsername, matchExternalId }) =>
			AwardMapper.toDomain(awardRow, playerUsername, matchExternalId),
		);
	}
}
