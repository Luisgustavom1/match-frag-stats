import { PlayerModel } from "@match-engine/core/model/player.model";
import { Inject, Injectable } from "@nestjs/common";
import { DatabaseConnection } from "@shared/persistence/drizzle/connection";
import { DATABASE_CONNECTION } from "@shared/persistence/drizzle/drizzle-persistence.module";
import { player } from "../entity/player.entity";
import { PlayerMapper } from "../mapper/player.mapper";

@Injectable()
export class PlayerRepository {
	constructor(
		@Inject(DATABASE_CONNECTION)
		private readonly dbConn: DatabaseConnection,
	) {}

	async findOrCreateBatch(usernames: string[]): Promise<PlayerModel[]> {
		if (!usernames.length) return [];

		const uniqueUsernames = [...new Set(usernames)];
		const insertedPlayers = await this.dbConn
			.insert(player)
			.values(
				uniqueUsernames.map((username) =>
					PlayerMapper.toEntity({
						username,
						createdAt: new Date(),
					}),
				),
			)
			.onConflictDoNothing()
			.returning();

		return insertedPlayers.map((playerEntity) =>
			PlayerMapper.toDomain(playerEntity),
		);
	}
}
