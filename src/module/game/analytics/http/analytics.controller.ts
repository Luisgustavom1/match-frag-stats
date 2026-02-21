import { Controller, Get, Query } from "@nestjs/common";
import { RankMatchesUseCase } from "@src/module/game/analytics/core/use-case/rank-matches.use-case";
import { GetRankingsQueryDto } from "./dto/in/get-rankings-query.dto";
import { MatchRankingsAnalyticsResponseDto } from "./dto/out/analytics-response.dto";

@Controller("game/analytics")
export class AnalyticsController {
	constructor(private readonly getMatchRankingsUseCase: RankMatchesUseCase) {}

	@Get("/rankings")
	async getRankings(
		@Query() query: GetRankingsQueryDto,
	): Promise<MatchRankingsAnalyticsResponseDto> {
		const rankings = await this.getMatchRankingsUseCase.execute(query.matchIds);
		return new MatchRankingsAnalyticsResponseDto(rankings);
	}
}
