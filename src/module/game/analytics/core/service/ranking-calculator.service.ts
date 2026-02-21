import { Injectable } from "@nestjs/common";
import type { AwardType } from "@src/module/game/engine/core/model/award.model";
import type { FragsModel } from "@src/module/game/engine/core/model/frags.model";

export interface PlayerStats {
	username: string;
	kills: number;
	deaths: number;
	position: number;
	awards: AwardType[];
}

@Injectable()
export class RankingCalculatorService {
	calculate(frags: readonly FragsModel[]): PlayerStats[] {
		const statsMapByPlayer = new Map<string, PlayerStats>();

		for (const frag of frags) {
			// killer
			const killerStats = statsMapByPlayer.get(frag.killerUsername) || {
				username: frag.killerUsername,
				kills: 0,
				deaths: 0,
				awards: [],
				position: 0,
			};
			killerStats.kills++;
			statsMapByPlayer.set(frag.killerUsername, killerStats as PlayerStats);

			// deaths
			const victimStats = statsMapByPlayer.get(frag.victimUsername) || {
				username: frag.victimUsername,
				kills: 0,
				deaths: 0,
				awards: [],
				position: 0,
			};
			victimStats.deaths++;
			statsMapByPlayer.set(frag.victimUsername, victimStats as PlayerStats);
		}

		const sorted = [...statsMapByPlayer.values()];
		sorted.sort((a, b) => {
			if (b.kills !== a.kills) return b.kills - a.kills;
			// if kills are the same, sort by deaths ascending
			return a.deaths - b.deaths;
		});

		sorted.forEach((stats, index) => {
			stats.position = index + 1;
			if (!stats.awards) stats.awards = [];
		});

		return sorted;
	}
}
