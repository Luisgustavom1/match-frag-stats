import { PlayerModel } from "@match-engine/core/model/player.model";
import { Inject, Injectable } from "@nestjs/common";
import { DatabaseConnection } from "@shared/persistence/drizzle/connection";
import { DATABASE_CONNECTION } from "@shared/persistence/drizzle/drizzle-persistence.module";
import { Transaction } from "@shared/persistence/drizzle/type";
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
		usernames: string[],
		tx?: Transaction,
	): Promise<PlayerModel[]> {
		if (!usernames.length) return [];

		const insertedPlayers = await (tx || this.dbConn)
			.insert(player)
			.values(
				usernames.map((username) =>
					PlayerMapper.toEntity({
						username,
						createdAt: new Date(),
					}),
				),
			)
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
