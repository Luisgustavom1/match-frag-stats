import type { PlayerStats } from "@src/module/game/analytics/core/service/ranking-calculator.service";
import { AwardType } from "@src/module/game/engine/core/model/award.model";
import { FragsModel } from "@src/module/game/engine/core/model/frags.model";
import { MatchModel } from "@src/module/game/engine/core/model/match.model";
import { AwardCalculatorService } from "@src/module/game/engine/core/service/award-calculator.service";
import { beforeEach, describe, expect, it } from "vitest";

function makeMatch(externalId: string, frags: FragsModel[]): MatchModel {
	const match = new MatchModel({
		externalId,
		startedAt: new Date(),
		endedAt: new Date(),
	});
	for (const frag of frags) {
		match.addFrag(frag);
	}
	return match;
}

function makeFrag(
	killer: string,
	victim: string,
	occurredAt: Date,
	matchExternalId = "1",
): FragsModel {
	return new FragsModel({
		killerUsername: killer,
		victimUsername: victim,
		weapon: "AK47",
		occurredAt,
		matchExternalId,
	});
}

function makeStats(
	username: string,
	kills: number,
	deaths: number,
	position = 1,
): PlayerStats {
	return { username, kills, deaths, position, awards: [] };
}

function atSecond(s: number): Date {
	return new Date(2019, 3, 23, 15, 0, s);
}

describe("AwardCalculatorService", () => {
	let service: AwardCalculatorService;

	beforeEach(() => {
		service = new AwardCalculatorService();
	});

	describe("FLAWLESS_VICTORY", () => {
		it("should give FLAWLESS_VICTORY to top player with deaths = 0", () => {
			const frags = [makeFrag("Alpha", "Beta", atSecond(1))];
			const match = makeMatch("1", frags);
			const ranking: PlayerStats[] = [
				makeStats("Alpha", 1, 0, 1),
				makeStats("Beta", 0, 1, 2),
			];

			const awards = service.calculateForMatch(match, ranking);

			expect(awards).toHaveLength(1);
			expect(awards[0].type).toBe(AwardType.FLAWLESS_VICTORY);
			expect(awards[0].playerUsername).toBe("Alpha");
		});

		it("should NOT give FLAWLESS_VICTORY to top player with deaths > 0", () => {
			const frags = [
				makeFrag("Alpha", "Beta", atSecond(1)),
				makeFrag("Beta", "Alpha", atSecond(2)),
			];
			const match = makeMatch("1", frags);
			const ranking: PlayerStats[] = [
				makeStats("Alpha", 1, 1, 1),
				makeStats("Beta", 1, 1, 2),
			];

			const awards = service.calculateForMatch(match, ranking);

			const flawless = awards.filter(
				(a) => a.type === AwardType.FLAWLESS_VICTORY,
			);
			expect(flawless).toHaveLength(0);
		});

		it("should give FLAWLESS_VICTORY to all tied top players with deaths = 0", () => {
			const frags = [
				makeFrag("Alpha", "Charlie", atSecond(1)),
				makeFrag("Beta", "Charlie", atSecond(2)),
			];
			const match = makeMatch("1", frags);
			const ranking: PlayerStats[] = [
				makeStats("Alpha", 1, 0, 1),
				makeStats("Beta", 1, 0, 1),
				makeStats("Charlie", 0, 2, 3),
			];

			const awards = service.calculateForMatch(match, ranking);

			const flawless = awards.filter(
				(a) => a.type === AwardType.FLAWLESS_VICTORY,
			);
			expect(flawless).toHaveLength(2);
			expect(flawless.map((a) => a.playerUsername).sort()).toEqual([
				"Alpha",
				"Beta",
			]);
		});

		it("should return empty awards when ranking is empty", () => {
			const match = makeMatch("1", []);
			const awards = service.calculateForMatch(match, []);
			expect(awards).toHaveLength(0);
		});
	});

	describe("KILLING_SPREE", () => {
		it("should give KILLING_SPREE for 5 kills within 59 seconds", () => {
			const frags = [0, 10, 20, 30, 59].map((s, i) =>
				makeFrag("Alpha", `Victim${i}`, atSecond(s)),
			);
			const match = makeMatch("1", frags);
			const ranking: PlayerStats[] = [makeStats("Alpha", 5, 0, 1)];

			const awards = service.calculateForMatch(match, ranking);

			const spree = awards.filter((a) => a.type === AwardType.KILLING_SPREE);
			expect(spree).toHaveLength(1);
			expect(spree[0].playerUsername).toBe("Alpha");
		});

		it("should give KILLING_SPREE for 5 kills in exactly 60 seconds", () => {
			const frags = [0, 15, 30, 45, 60].map((s, i) =>
				makeFrag("Alpha", `Victim${i}`, atSecond(s)),
			);
			const match = makeMatch("1", frags);
			const ranking: PlayerStats[] = [makeStats("Alpha", 5, 0, 1)];

			const awards = service.calculateForMatch(match, ranking);

			const spree = awards.filter((a) => a.type === AwardType.KILLING_SPREE);
			expect(spree).toHaveLength(1);
		});

		it("should NOT give KILLING_SPREE for 5 kills in 61 seconds", () => {
			const frags = [0, 15, 30, 45, 61].map((s, i) =>
				makeFrag("Alpha", `Victim${i}`, atSecond(s)),
			);
			const match = makeMatch("1", frags);
			const ranking: PlayerStats[] = [makeStats("Alpha", 5, 0, 1)];

			const awards = service.calculateForMatch(match, ranking);

			const spree = awards.filter((a) => a.type === AwardType.KILLING_SPREE);
			expect(spree).toHaveLength(0);
		});

		it("should NOT give KILLING_SPREE when player has fewer than 5 kills", () => {
			const frags = [0, 1, 2, 3].map((s, i) =>
				makeFrag("Alpha", `Victim${i}`, atSecond(s)),
			);
			const match = makeMatch("1", frags);
			const ranking: PlayerStats[] = [makeStats("Alpha", 4, 0, 1)];

			const awards = service.calculateForMatch(match, ranking);

			const spree = awards.filter((a) => a.type === AwardType.KILLING_SPREE);
			expect(spree).toHaveLength(0);
		});

		it("should give KILLING_SPREE only once per player even with multiple qualifying windows", () => {
			// 10 kills all within 60s of each other
			const frags = Array.from({ length: 10 }, (_, i) =>
				makeFrag("Alpha", `Victim${i}`, atSecond(i * 5)),
			);
			const match = makeMatch("1", frags);
			const ranking: PlayerStats[] = [makeStats("Alpha", 10, 0, 1)];

			const awards = service.calculateForMatch(match, ranking);

			const spree = awards.filter(
				(a) =>
					a.type === AwardType.KILLING_SPREE && a.playerUsername === "Alpha",
			);
			expect(spree).toHaveLength(1);
		});
	});
});
