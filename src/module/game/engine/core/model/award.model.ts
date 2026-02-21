export enum AwardType {
	FLAWLESS_VICTORY = "FLAWLESS_VICTORY",
	KILLING_SPREE = "KILLING_SPREE",
}

export interface AwardModel {
	id: number;
	playerUsername: string;
	matchExternalId: string;
	type: AwardType;
	createdAt: Date;
}
