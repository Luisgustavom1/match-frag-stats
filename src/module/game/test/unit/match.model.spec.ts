import { BadRequestException } from "@nestjs/common";
import { FragsModel } from "@src/module/game/engine/core/model/frags.model";
import { MatchModel } from "@src/module/game/engine/core/model/match.model";
import { describe, expect, it } from "vitest";

function makeFrag(killer: string, victim: string): FragsModel {
	return new FragsModel({
		matchExternalId: "test-match",
		killerUsername: killer,
		victimUsername: victim,
		weapon: "AK47",
		occurredAt: new Date(),
	});
}

function makeMatch(): MatchModel {
	return new MatchModel({
		externalId: "test-match",
		startedAt: new Date(),
		endedAt: null,
	});
}

describe("MatchModel", () => {
	describe("players", () => {
		it("should populate correctly players from frags", () => {
			const match = makeMatch();
			match.addFrag(makeFrag("Alice", "Bob"));
			match.addFrag(makeFrag("Bob", "Charlie"));

			const usernames = match.players.map((p) => p.username);
			expect(usernames).toHaveLength(3);
			expect(usernames).toEqual(
				expect.arrayContaining(["Alice", "Bob", "Charlie"]),
			);
		});

		it("should not count the same player two times", () => {
			const match = makeMatch();
			match.addFrag(makeFrag("Alice", "Bob"));
			match.addFrag(makeFrag("Alice", "Bob"));

			expect(match.players).toHaveLength(2);
		});

		it("should allow exactly 20 players", () => {
			const match = makeMatch();
			for (let i = 0; i < 10; i++) {
				match.addFrag(makeFrag(`player${i * 2 + 1}`, `player${i * 2 + 2}`));
			}

			expect(match.players).toHaveLength(20);
		});

		it("should throw when a 21st unique player is introduced via frag", () => {
			const match = makeMatch();
			for (let i = 0; i < 10; i++) {
				match.addFrag(makeFrag(`player${i * 2 + 1}`, `player${i * 2 + 2}`));
			}

			expect(() => match.addFrag(makeFrag("player1", "player21"))).toThrow(
				BadRequestException,
			);
		});

		it("should not throw when re-using an already registered player as the 21st frag participant", () => {
			const match = makeMatch();
			for (let i = 0; i < 10; i++) {
				match.addFrag(makeFrag(`player${i * 2 + 1}`, `player${i * 2 + 2}`));
			}

			expect(() => match.addFrag(makeFrag("player1", "player2"))).not.toThrow();
		});
	});

	describe("markAsEnd", () => {
		it("should mark the match as ended", () => {
			const match = makeMatch();
			const endedAt = new Date();

			match.markAsEnd(endedAt);

			expect(match.isEnded()).toBe(true);
			expect(match.endedAt).toEqual(endedAt);
		});

		it("should throw error when try end match already ended", () => {
			const match = makeMatch();
			match.markAsEnd(new Date());

			expect(() => match.markAsEnd(new Date())).toThrow(BadRequestException);
		});
	});
});
