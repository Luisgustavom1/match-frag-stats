import { FragsModel } from "@match-engine/core/model/frags.model";
import { FragsEntity } from "../entity";

export interface FragEntityParams {
	frag: FragsModel;
	matchId: number;
	killerId: number | null;
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
}
