import { MatchModel } from "@match-engine/engine/core/model/match.model";
import { Injectable } from "@nestjs/common";
import { AwardRepository } from "@src/module/game/shared/persistence/repository/award.repository";
import { MatchRepository } from "@src/module/game/shared/persistence/repository/match.repository";
import { AppLogger } from "@src/module/shared/logger/service/app-logger.service";
import {
	PlayerStats,
	RankingCalculatorService,
} from "../service/ranking-calculator.service";
import {
	WinnerInfos,
	WinnerInfosService,
} from "../service/winner-infos.service";

export interface MatchRanking {
	match: MatchModel;
	ranking: PlayerStats[];
	winnerInfos?: WinnerInfos;
}

@Injectable()
export class RankMatchesUseCase {
	constructor(
		private readonly matchRepository: MatchRepository,
		private readonly awardRepository: AwardRepository,
		private readonly rankingCalculatorService: RankingCalculatorService,
		private readonly winnerInfosService: WinnerInfosService,
		private readonly logger: AppLogger,
	) {}

	async execute(externalIds?: string[]): Promise<MatchRanking[]> {
		const matches =
			await this.matchRepository.findAllWithFragsAndPlayers(externalIds);

		this.logger.log("fetching rankings for all matches", {
			totalMatches: matches.length,
			externalIds,
		});

		const awards = await this.awardRepository.findByMatchExternalIds(
			externalIds ?? matches.map((m) => m.externalId),
		);

		const awardsByMatchAndPlayer = new Map<string, PlayerStats["awards"]>();
		for (const award of awards) {
			const key = `${award.matchExternalId}::${award.playerUsername}`;
			const existing = awardsByMatchAndPlayer.get(key) ?? [];
			existing.push(award.type);
			awardsByMatchAndPlayer.set(key, existing);
		}

		const results: MatchRanking[] = matches.map((match) => {
			const ranking = this.rankingCalculatorService.calculate(match.frags);

			for (const stats of ranking) {
				const key = `${match.externalId}::${stats.username}`;
				stats.awards = awardsByMatchAndPlayer.get(key) ?? [];
			}

			const winnerInfos = this.winnerInfosService.get(match, ranking);
			return { match, ranking, winnerInfos };
		});

		return results;
	}
}
