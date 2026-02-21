import { MatchModel } from "@match-engine/engine/core/model/match.model";
import { Injectable } from "@nestjs/common";
import { PlayerStats } from "./ranking-calculator.service";

export interface WinnerInfos extends PlayerStats {
	bestWeapon: string;
}

@Injectable()
export class WinnerInfosService {
	get(match: MatchModel, ranking: PlayerStats[]): WinnerInfos {
		const winner = ranking[0];

		const winnerFrags = match.frags.filter(
			(frag) => frag.killerUsername === winner.username,
		);

		const weaponCountsMap = new Map<string, number>();
		for (const frag of winnerFrags) {
			const count = weaponCountsMap.get(frag.weapon) || 0;
			weaponCountsMap.set(frag.weapon, count + 1);
		}

		let bestWeapon = "";
		let bestWeaponCount = 0;
		for (const [weapon, count] of weaponCountsMap.entries()) {
			if (count > bestWeaponCount) {
				bestWeapon = weapon;
				bestWeaponCount = count;
			}
		}

		return {
			...winner,
			bestWeapon,
		};
	}
}
