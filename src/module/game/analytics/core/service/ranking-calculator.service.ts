import { Injectable } from "@nestjs/common";
import type { FragsModel } from "@src/module/game/engine/core/model/frags.model";
import type { MatchModel } from "@src/module/game/engine/core/model/match.model";

export interface PlayerStats {
	username: string;
	kills: number;
	deaths: number;
}

export interface MatchRanking {
	match: MatchModel;
	ranking: PlayerStats[];
}

@Injectable()
export class RankingCalculatorService {
	calculate(frags: FragsModel[]): PlayerStats[] {
		const statsMapByPlayer = new Map<string, PlayerStats>();

		for (const frag of frags) {
			// killer
			const killerStats = statsMapByPlayer.get(frag.killerUsername) || {
				username: frag.killerUsername,
				kills: 0,
				deaths: 0,
			};
			killerStats.kills++;
			statsMapByPlayer.set(frag.killerUsername, killerStats);

			// deaths
			const victimStats = statsMapByPlayer.get(frag.victimUsername) || {
				username: frag.victimUsername,
				kills: 0,
				deaths: 0,
			};
			victimStats.deaths++;
			statsMapByPlayer.set(frag.victimUsername, victimStats);
		}

		const sorted = [...statsMapByPlayer.values()];
		sorted.sort((a, b) => {
			if (b.kills !== a.kills) return b.kills - a.kills;
			// if kills are the same, sort by deaths ascending
			return a.deaths - b.deaths;
		});

		return sorted;
	}
}
