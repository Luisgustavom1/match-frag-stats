import { MatchRanking } from "@match-engine/analytics/core/use-case/rank-matches.use-case";
import { MatchAggregatePersistenceService } from "@match-engine/engine/persistence/service/match-aggregate.persistence.service";
import { MatchRepository } from "@match-engine/shared/persistence/repository/match.repository";
import { Injectable } from "@nestjs/common";
import { RankingCalculatorService } from "@src/module/game/analytics/core/service/ranking-calculator.service";
import { AppLogger } from "@src/module/shared/logger/service/app-logger.service";
import { LogParserService } from "../service/log-parser.service";

export type { PlayerStats } from "@src/module/game/analytics/core/service/ranking-calculator.service";

@Injectable()
export class IngestLogUseCase {
	constructor(
		private readonly logParserService: LogParserService,
		private readonly matchAggregatePersistenceService: MatchAggregatePersistenceService,
		private readonly rankingCalculatorService: RankingCalculatorService,
		private readonly matchRepository: MatchRepository,
		private readonly logger: AppLogger,
	) {}

	async execute(logContent: Buffer): Promise<MatchRanking[]> {
		const matchInProgress = await this.matchRepository.findLastInProgress();

		const matches = this.logParserService.parseBuffer(
			logContent,
			matchInProgress,
		);

		if (!matches.length) {
			this.logger.log("no matches found in log");
			return [];
		}

		await this.matchAggregatePersistenceService.persistMatches(matches);

		const results: MatchRanking[] = matches.map((match) => ({
			match,
			ranking: this.rankingCalculatorService.calculate(match.frags),
		}));

		this.logger.log("ingestion completed", { totalMatches: results.length });
		return results;
	}
}
