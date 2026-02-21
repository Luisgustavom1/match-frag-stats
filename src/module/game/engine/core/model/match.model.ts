import { BadRequestException } from "@nestjs/common";
import { FragsModel } from "./frags.model";
import { PlayerModel } from "./player.model";

export class MatchModel {
	static readonly MAX_PLAYERS = 20;

	readonly id: number;
	readonly externalId: string;
	readonly startedAt: Date;

	private _endedAt: Date | null;
	private readonly _frags: FragsModel[] = [];
	private readonly _players: Map<string, PlayerModel> = new Map();

	constructor(params: {
		id?: number;
		externalId: string;
		startedAt: Date;
		endedAt: Date | null;
	}) {
		this.id = params.id ?? 0;
		this.externalId = params.externalId;
		this.startedAt = params.startedAt;
		this._endedAt = params.endedAt;
	}

	get endedAt(): Date | null {
		return this._endedAt;
	}

	get frags(): readonly FragsModel[] {
		return this._frags;
	}

	get players(): readonly PlayerModel[] {
		return [...this._players.values()];
	}

	isEnded(): boolean {
		return this._endedAt !== null;
	}

	markAsEnd(endedAt: Date): void {
		if (this.isEnded()) {
			throw new BadRequestException(`match is already ended`, {
				cause: { matchId: this.externalId },
			});
		}
		this._endedAt = endedAt;
	}

	addFrag(frag: FragsModel): void {
		this.addPlayer(frag.killerUsername);
		this.addPlayer(frag.victimUsername);
		this._frags.push(frag);
	}

	private addPlayer(username: string): void {
		if (this._players.has(username)) return;

		if (this._players.size >= MatchModel.MAX_PLAYERS) {
			throw new BadRequestException(
				`match has reached the maximum of ${MatchModel.MAX_PLAYERS} players`,
				{ cause: { matchExternalId: this.externalId } },
			);
		}

		this._players.set(username, new PlayerModel({ username }));
	}
}
