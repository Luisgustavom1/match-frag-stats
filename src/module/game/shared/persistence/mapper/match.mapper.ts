import { MatchModel } from "@src/module/game/engine/core/model/match.model";
import { MatchEntity } from "../entity";

export class MatchMapper {
	static toDomain(entity: MatchEntity): MatchModel {
		return new MatchModel({
			id: entity.id,
			externalId: entity.externalId,
			startedAt: entity.startedAt,
			endedAt: entity.endedAt,
		});
	}

	static toEntity(
		domain: MatchModel,
	): Omit<MatchEntity, "id"> & { id?: number } {
		return {
			id: domain.id ? domain.id : undefined,
			externalId: domain.externalId,
			startedAt: domain.startedAt,
			endedAt: domain.endedAt,
		};
	}
}
