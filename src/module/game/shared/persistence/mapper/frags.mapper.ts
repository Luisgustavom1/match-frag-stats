import { FragsModel } from "@src/module/game/engine/core/model/frags.model";
import { FragsEntity } from "../entity";

export interface FragEntityParams {
	frag: FragsModel;
	matchId: number;
	killerId: number;
	victimId: number;
}

export class FragsMapper {
	static toEntity(
		params: FragEntityParams,
	): Omit<FragsEntity, "id"> & { id?: number } {
		const { frag, matchId, killerId, victimId } = params;
		return {
			id: frag.id || undefined,
			matchId,
			killerId,
			victimId,
			weapon: frag.weapon,
			occurredAt: frag.occurredAt,
		};
	}

	static toDomain(
		entity: FragsEntity,
		killerUsername: string,
		victimUsername: string,
		matchExternalId: string,
	): FragsModel {
		return new FragsModel({
			id: entity.id,
			matchExternalId,
			killerUsername,
			victimUsername,
			weapon: entity.weapon,
			occurredAt: entity.occurredAt,
		});
	}
}
