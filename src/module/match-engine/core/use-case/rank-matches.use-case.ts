import { MatchRepository } from "@match-engine/persistence/repository/match.repository";
import { Injectable } from "@nestjs/common";
import { AppLogger } from "@shared/logger/service/app-logger.service";
import {
	type MatchRanking,
	RankingCalculatorService,
} from "../service/ranking-calculator.service";

@Injectable()
export class RankMatchesUseCase {
	constructor(
		private readonly matchRepository: MatchRepository,
		private readonly rankingCalculatorService: RankingCalculatorService,
		private readonly logger: AppLogger,
	) {}

	async execute(externalIds?: string[]): Promise<MatchRanking[]> {
		const matches =
			await this.matchRepository.findAllWithFragsAndPlayers(externalIds);

		this.logger.log("fetching rankings for all matches", {
			totalMatches: matches.length,
		});

		return matches.map((match) => ({
			match,
			ranking: this.rankingCalculatorService.calculate(match.frags),
		}));
	}
}
