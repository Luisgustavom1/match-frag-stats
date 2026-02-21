import {
	AwardModel,
	AwardType,
} from "@src/module/game/engine/core/model/award.model";
import { AwardEntity } from "../entity/award.entity";

export interface AwardEntityInsert {
	playerId: number;
	matchId: number;
	type: string;
}

export class AwardMapper {
	static toEntity(
		award: AwardModel,
		playerIdsByUsername: Map<string, number>,
		matchIdsByExternalId: Map<string, number>,
	): AwardEntityInsert {
		const playerId = playerIdsByUsername.get(award.playerUsername);
		const matchId = matchIdsByExternalId.get(award.matchExternalId);

		if (playerId === undefined) {
			throw new Error(
				`Player id not found for username: ${award.playerUsername}`,
			);
		}
		if (matchId === undefined) {
			throw new Error(
				`Match id not found for externalId: ${award.matchExternalId}`,
			);
		}

		return { playerId, matchId, type: award.type };
	}

	static toDomain(
		entity: AwardEntity,
		playerUsername: string,
		matchExternalId: string,
	): AwardModel {
		return {
			id: entity.id,
			playerUsername,
			matchExternalId,
			type: entity.type as AwardType,
			createdAt: entity.createdAt,
		};
	}
}
