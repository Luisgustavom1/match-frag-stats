import { FragsModel } from "@match-engine/core/model/frags.model";
import { FragsEntity } from "../entity";

export class FragsMapper {
	static toEntity(
		domain: FragsModel,
		matchId: number,
		killerId: number | null,
		victimId: number,
	): FragsEntity {
		return {
			id: domain.id,
			matchId,
			killerId,
			victimId,
			weapon: domain.weapon,
			occurredAt: domain.occurredAt,
		};
	}
}
