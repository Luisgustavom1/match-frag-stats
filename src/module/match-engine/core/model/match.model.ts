import { Frags } from "./frags.model";

export class Match {
	id: number;
	externalId: string;
	startedAt: Date;
	endedAt: Date | null;
	frags: Frags[];

	constructor(params: {
		id?: number;
		externalId: string;
		startedAt: Date;
		endedAt: Date | null;
	}) {
		this.id = params.id ?? 0;
		this.externalId = params.externalId;
		this.startedAt = params.startedAt;
		this.endedAt = params.endedAt;
		this.frags = [];
	}

	isEnded(): boolean {
		return this.endedAt !== null;
	}

	markAsEnd(endedAt: Date): void {
		this.endedAt = endedAt;
	}

	addFrag(frag: Frags): void {
		this.frags.push(frag);
	}
}
