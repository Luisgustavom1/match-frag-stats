export class FragsModel {
	id: number;
	matchExternalId: string;
	killerUsername: string;
	victimUsername: string;
	weapon: string;
	occurredAt: Date;

	constructor(params: {
		id?: number;
		matchExternalId: string;
		killerUsername: string;
		victimUsername: string;
		weapon: string;
		occurredAt: Date;
	}) {
		this.id = params.id ?? 0;
		this.matchExternalId = params.matchExternalId;
		this.killerUsername = params.killerUsername;
		this.victimUsername = params.victimUsername;
		this.weapon = params.weapon;
		this.occurredAt = params.occurredAt;
	}
}
