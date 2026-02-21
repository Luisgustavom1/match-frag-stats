import { RankMatchesUseCase } from "@match-engine/core/use-case/rank-matches.use-case";
import { Controller, Get } from "@nestjs/common";
import { MatchRankingsAnalyticsResponseDto } from "./dto/analytics-response.dto";

@Controller("match-engine/analytics")
export class AnalyticsController {
	constructor(private readonly getMatchRankingsUseCase: RankMatchesUseCase) {}

	@Get("/rankings")
	async getRankings(): Promise<MatchRankingsAnalyticsResponseDto> {
		const rankings = await this.getMatchRankingsUseCase.execute();
		return new MatchRankingsAnalyticsResponseDto(rankings);
	}
}
