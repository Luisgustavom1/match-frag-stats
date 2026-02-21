import type {
	MatchRanking,
	PlayerStats,
} from "@match-engine/core/use-case/ingest-log.use-case";

export class PlayerRankingDto {
	username: string;
	kills: number;
	deaths: number;

	constructor(stats: PlayerStats) {
		this.username = stats.username;
		this.kills = stats.frags;
		this.deaths = stats.deaths;
	}
}

export class MatchRankingResponseDto {
	matchId: string;
	startedAt: string;
	endedAt: string | null;
	ranking: PlayerRankingDto[];

	constructor(matchRanking: MatchRanking) {
		this.matchId = matchRanking.match.externalId;
		this.startedAt = matchRanking.match.startedAt.toISOString();
		this.endedAt = matchRanking.match.endedAt?.toISOString() ?? null;
		this.ranking = matchRanking.ranking.map(
			(stats) => new PlayerRankingDto(stats),
		);
	}
}

export class IngestLogResponseDto {
	matches: MatchRankingResponseDto[];
	totalMatches: number;

	constructor(matchRankings: MatchRanking[]) {
		this.matches = matchRankings.map(
			(ranking) => new MatchRankingResponseDto(ranking),
		);
		this.totalMatches = this.matches.length;
	}
}
