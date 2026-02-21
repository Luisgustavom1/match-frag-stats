import type { PlayerStats } from "@analytics/core/service/ranking-calculator.service";
import { MatchRanking } from "@analytics/core/use-case/rank-matches.use-case";
import { WinnerInfos } from "@match-engine/analytics/core/service/winner-infos.service";

export class AnalyticsPlayerRankingDto {
	position: number;
	username: string;
	kills: number;
	deaths: number;
	awards: string[];

	constructor(stats: PlayerStats) {
		this.position = stats.position;
		this.username = stats.username;
		this.kills = stats.kills;
		this.deaths = stats.deaths;
		this.awards = stats.awards ?? [];
	}
}

export class WinnerPlayerDto extends AnalyticsPlayerRankingDto {
	bestWeapon: string;

	constructor(winner: WinnerInfos) {
		super(winner);
		this.bestWeapon = winner.bestWeapon;
	}
}

export class AnalyticsMatchRankingDto {
	matchId: string;
	startedAt: string;
	endedAt: string | null;
	ranking: AnalyticsPlayerRankingDto[];
	winner?: WinnerPlayerDto;

	constructor(matchRanking: MatchRanking) {
		this.matchId = matchRanking.match.externalId;
		this.startedAt = matchRanking.match.startedAt.toISOString();
		this.endedAt = matchRanking.match.endedAt?.toISOString() ?? null;
		this.ranking = matchRanking.ranking.map(
			(stats) => new AnalyticsPlayerRankingDto(stats),
		);
		this.winner = matchRanking.winnerInfos
			? new WinnerPlayerDto(matchRanking.winnerInfos)
			: undefined;
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
