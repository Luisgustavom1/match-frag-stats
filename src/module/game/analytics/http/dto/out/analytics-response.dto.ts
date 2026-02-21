import type {
	MatchRanking,
	PlayerStats,
} from "@src/module/game/analytics/core/service/ranking-calculator.service";

export class AnalyticsPlayerRankingDto {
	position: number;
	username: string;
	kills: number;
	deaths: number;

	constructor(stats: PlayerStats, position: number) {
		this.position = position;
		this.username = stats.username;
		this.kills = stats.kills;
		this.deaths = stats.deaths;
	}
}

export class AnalyticsMatchRankingDto {
	matchId: string;
	startedAt: string;
	endedAt: string | null;
	ranking: AnalyticsPlayerRankingDto[];

	constructor(matchRanking: MatchRanking) {
		this.matchId = matchRanking.match.externalId;
		this.startedAt = matchRanking.match.startedAt.toISOString();
		this.endedAt = matchRanking.match.endedAt?.toISOString() ?? null;
		this.ranking = matchRanking.ranking.map(
			(stats, index) => new AnalyticsPlayerRankingDto(stats, index + 1),
		);
	}
}

export class MatchRankingsAnalyticsResponseDto {
	totalMatches: number;
	matches: AnalyticsMatchRankingDto[];

	constructor(matchRankings: MatchRanking[]) {
		this.matches = matchRankings.map(
			(ranking) => new AnalyticsMatchRankingDto(ranking),
		);
		this.totalMatches = this.matches.length;
	}
}
