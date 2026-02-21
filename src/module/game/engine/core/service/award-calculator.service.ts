import { Injectable } from "@nestjs/common";
import type { PlayerStats } from "@src/module/game/analytics/core/service/ranking-calculator.service";
import { FragsModel } from "@src/module/game/engine/core/model/frags.model";
import type { MatchModel } from "@src/module/game/engine/core/model/match.model";
import { AwardModel, AwardType } from "../model/award.model";

@Injectable()
export class AwardCalculatorService {
	calculateForMatch(match: MatchModel, ranking: PlayerStats[]): AwardModel[] {
		const awards: AwardModel[] = [];

		awards.push(...this.calculateFlawlessVictory(match, ranking));
		awards.push(...this.calculateKillingSpree(match, ranking));

		return awards;
	}

	private calculateFlawlessVictory(
		match: MatchModel,
		ranking: PlayerStats[],
	): AwardModel[] {
		if (!ranking.length) return [];

		const topKills = ranking[0].kills;
		const winners = ranking.filter(
			(p) => p.kills === topKills && p.deaths === 0,
		);

		return winners.map((p) => ({
			id: 0,
			playerUsername: p.username,
			matchExternalId: match.externalId,
			type: AwardType.FLAWLESS_VICTORY,
			createdAt: new Date(),
		}));
	}

	private calculateKillingSpree(
		match: MatchModel,
		ranking: PlayerStats[],
	): AwardModel[] {
		const WINDOW_SIZE = 5;
		const MAX_WINDOW_MS = 60_000;

		const awards: AwardModel[] = [];

		for (const player of ranking) {
			const playerFrags: FragsModel[] = match.frags
				.filter((f) => f.killerUsername === player.username)
				.slice()
				.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

			if (playerFrags.length < WINDOW_SIZE) continue;

			for (let i = 0; i <= playerFrags.length - WINDOW_SIZE; i++) {
				const windowDuration =
					playerFrags[i + WINDOW_SIZE - 1].occurredAt.getTime() -
					playerFrags[i].occurredAt.getTime();

				if (windowDuration <= MAX_WINDOW_MS) {
					awards.push({
						id: 0,
						playerUsername: player.username,
						matchExternalId: match.externalId,
						type: AwardType.KILLING_SPREE,
						createdAt: new Date(),
					});
					break;
				}
			}
		}

		return awards;
	}
}
