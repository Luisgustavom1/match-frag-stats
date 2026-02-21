import { Inject, Injectable } from "@nestjs/common";
import { PlayerModel } from "@src/module/game/engine/core/model/player.model";
import { DatabaseConnection } from "@src/module/shared/persistence/drizzle/connection";
import { DATABASE_CONNECTION } from "@src/module/shared/persistence/drizzle/drizzle-persistence.module";
import { Transaction } from "@src/module/shared/persistence/drizzle/type";
import { sql } from "drizzle-orm/sql/sql";
import { player } from "../entity/player.entity";
import { PlayerMapper } from "../mapper/player.mapper";

@Injectable()
export class PlayerRepository {
	constructor(
		@Inject(DATABASE_CONNECTION)
		private readonly dbConn: DatabaseConnection,
	) {}

	async bulkCreate(
		players: PlayerModel[],
		tx?: Transaction,
	): Promise<PlayerModel[]> {
		if (!players.length) return [];

		const insertedPlayers = await (tx || this.dbConn)
			.insert(player)
			.values(players.map((player) => PlayerMapper.toEntity(player)))
			.onConflictDoUpdate({
				target: player.username,
				set: {
					username: sql`excluded.username`,
				},
			})
			.returning();

		return insertedPlayers.map((playerEntity) =>
			PlayerMapper.toDomain(playerEntity),
		);
	}
}
