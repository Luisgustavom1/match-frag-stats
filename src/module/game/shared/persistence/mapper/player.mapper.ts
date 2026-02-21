import { PlayerModel } from "@src/module/game/engine/core/model/player.model";
import { PlayerEntity } from "../entity";

export class PlayerMapper {
	static toDomain(entity: PlayerEntity): PlayerModel {
		return new PlayerModel({
			id: entity.id,
			username: entity.username,
			createdAt: entity.createdAt,
		});
	}

	static toEntity(
		domain: PlayerModel,
	): Omit<PlayerEntity, "id"> & { id?: number } {
		return {
			id: domain.id,
			username: domain.username,
			createdAt: domain.createdAt,
		};
	}
}
