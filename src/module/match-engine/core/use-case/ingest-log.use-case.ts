import { MatchAggregatePersistenceService } from "@match-engine/persistence/service/match-aggregate.persistence.service";
import { Injectable } from "@nestjs/common";
import { AppLogger } from "@shared/logger/service/app-logger.service";
import { FragsModel } from "../model/frags.model";
import type { MatchModel } from "../model/match.model";
import { LogParserService } from "../service/log-parser.service";

export interface PlayerStats {
	username: string;
	frags: number;
	deaths: number;
}

export interface MatchRanking {
	match: MatchModel;
	ranking: PlayerStats[];
}

@Injectable()
export class IngestLogUseCase {
	constructor(
		private readonly logParserService: LogParserService,
		private readonly matchAggregatePersistenceService: MatchAggregatePersistenceService,
		private readonly logger: AppLogger,
	) {}

	async execute(logContent: string): Promise<MatchRanking[]> {
		const matches = this.logParserService.parse(logContent);

		if (!matches.length) {
			this.logger.log("no matches found in log");
			return [];
		}

		await this.matchAggregatePersistenceService.persistMatches(matches);

		const results: MatchRanking[] = [];
		for (const match of matches) {
			const ranking = this.calculateRankings(match.frags);

			ranking.sort((a, b) => {
				if (b.frags !== a.frags) return b.frags - a.frags;
				return a.username.localeCompare(b.username);
			});

			results.push({
				match,
				ranking,
			});
		}

		this.logger.log("ingestion completed", { totalMatches: results.length });
		return results;
	}

	private calculateRankings(frags: FragsModel[]): PlayerStats[] {
		const statsMapByPlayer = new Map<string, PlayerStats>();

		for (const frag of frags) {
			// killer
			const killerStats = statsMapByPlayer.get(frag.killerUsername) || {
				username: frag.killerUsername,
				frags: 0,
				deaths: 0,
			};
			killerStats.frags++;
			statsMapByPlayer.set(frag.killerUsername, killerStats);

			// deaths
			const victimStats = statsMapByPlayer.get(frag.victimUsername) || {
				username: frag.victimUsername,
				frags: 0,
				deaths: 0,
			};
			victimStats.deaths++;
			statsMapByPlayer.set(frag.victimUsername, victimStats);
		}

		return [...statsMapByPlayer.values()];
	}
}
