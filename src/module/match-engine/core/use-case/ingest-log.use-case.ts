import { MatchAggregatePersistenceService } from "@match-engine/persistence/service/match-aggregate.persistence.service";
import { Injectable } from "@nestjs/common";
import { AppLogger } from "@shared/logger/service/app-logger.service";
import { LogParserService } from "../service/log-parser.service";
import {
	type MatchRanking,
	RankingCalculatorService,
} from "../service/ranking-calculator.service";

export type {
	MatchRanking,
	PlayerStats,
} from "../service/ranking-calculator.service";

@Injectable()
export class IngestLogUseCase {
	constructor(
		private readonly logParserService: LogParserService,
		private readonly matchAggregatePersistenceService: MatchAggregatePersistenceService,
		private readonly rankingCalculatorService: RankingCalculatorService,
		private readonly logger: AppLogger,
	) {}

	async execute(logContent: string): Promise<MatchRanking[]> {
		const matches = this.logParserService.parse(logContent);

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
