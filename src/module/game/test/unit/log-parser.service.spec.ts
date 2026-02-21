import { BadRequestException } from "@nestjs/common";
import { FragsModel } from "@src/module/game/engine/core/model/frags.model";
import { LogParserService } from "@src/module/game/engine/core/service/log-parser.service";
import { loggerMock } from "test/mocks/logger";
import { beforeEach, describe, expect, it } from "vitest";

function expectFrag(frag: FragsModel, expected: Partial<FragsModel>) {
	expect(frag.killerUsername).toBe(expected.killerUsername);
	expect(frag.victimUsername).toBe(expected.victimUsername);
	expect(frag.weapon).toBe(expected.weapon);
	expect(frag.occurredAt).toEqual(expected.occurredAt);
	expect(frag.matchExternalId).toBe(expected.matchExternalId);
}

describe("LogParserService", () => {
	let service: LogParserService;

	beforeEach(() => {
		service = new LogParserService(loggerMock);
	});

	describe("parse", () => {
		it("should return empty array if try parse a empty string", () => {
			const result = service.parse("");
			expect(result).toEqual([]);
		});

		it("should return empty array if try parse a string with only whitespace", () => {
			const result = service.parse("   \n\n   ");
			expect(result).toEqual([]);
		});

		it("should parse a simple complete match with 1 frags", () => {
			const logContent = `23/04/2019 15:34:22 - New match 11348965 has started
23/04/2019 15:36:04 - Roman killed Nick using M16
23/04/2019 15:39:22 - Match 11348965 has ended`;

			const result = service.parse(logContent);
			expect(result).toHaveLength(1);

			const match = result[0];
			expect(match.externalId).toBe("11348965");
			expect(match.startedAt).toEqual(new Date(2019, 3, 23, 15, 34, 22));
			expect(match.endedAt).toEqual(new Date(2019, 3, 23, 15, 39, 22));
			expect(match.frags).toHaveLength(1);

			expectFrag(match.frags[0], {
				killerUsername: "Roman",
				victimUsername: "Nick",
				weapon: "M16",
				occurredAt: new Date(2019, 3, 23, 15, 36, 4),
				matchExternalId: "11348965",
			});
		});

		it("should disregard world kills", () => {
			const logContent = `23/04/2019 15:34:22 - New match 11348965 has started
23/04/2019 15:36:33 - <WORLD> killed Nick by DROWN
23/04/2019 15:39:22 - Match 11348965 has ended`;

			const result = service.parse(logContent);

			expect(result).toHaveLength(1);
			expect(result[0].frags).toHaveLength(0);
		});

		it("should parse multiple matches on same log file", () => {
			const logContent = `23/04/2019 15:34:22 - New match 11348965 has started
23/04/2019 15:36:04 - Roman killed Nick using M16
23/04/2019 15:39:22 - Match 11348965 has ended

23/04/2021 16:14:22 - New match 11348966 has started
23/04/2021 16:26:04 - Roman killed Marcus using M16
23/04/2021 16:49:22 - Match 11348966 has ended`;

			const result = service.parse(logContent);

			expect(result).toHaveLength(2);
			expect(result[0].externalId).toBe("11348965");
			expect(result[1].externalId).toBe("11348966");
		});

		it("should parse match with multiple kills", () => {
			const logContent = `24/04/2020 16:14:22 - New match 11348961 has started
24/04/2020 16:26:12 - Roman killed Marcus using M16
24/04/2020 16:35:56 - Marcus killed Jhon using AK47
24/04/2020 17:12:34 - Roman killed Bryian using M16
24/04/2020 18:26:14 - Bryan killed Marcus using AK47
24/04/2020 19:36:33 - <WORLD> killed Marcus by DROWN
24/04/2020 20:19:22 - Match 11348961 has ended`;

			const result = service.parse(logContent);

			expect(result).toHaveLength(1);
			const match = result[0];

			expect(match.frags).toHaveLength(4);
			expectFrag(match.frags[0], {
				killerUsername: "Roman",
				victimUsername: "Marcus",
				weapon: "M16",
				occurredAt: new Date(2020, 3, 24, 16, 26, 12),
				matchExternalId: match.externalId,
			});
			expectFrag(match.frags[1], {
				killerUsername: "Marcus",
				victimUsername: "Jhon",
				weapon: "AK47",
				occurredAt: new Date(2020, 3, 24, 16, 35, 56),
				matchExternalId: match.externalId,
			});
			expectFrag(match.frags[2], {
				killerUsername: "Roman",
				victimUsername: "Bryian",
				weapon: "M16",
				occurredAt: new Date(2020, 3, 24, 17, 12, 34),
				matchExternalId: match.externalId,
			});
			expectFrag(match.frags[3], {
				killerUsername: "Bryan",
				victimUsername: "Marcus",
				weapon: "AK47",
				occurredAt: new Date(2020, 3, 24, 18, 26, 14),
				matchExternalId: match.externalId,
			});
		});

		it("should parse multiple matches with multiple kills", () => {
			const logContent = `24/04/2020 16:14:22 - New match 11348961 has started
24/04/2020 16:26:12 - Roman killed Marcus using M16
24/04/2020 16:35:56 - Marcus killed Jhon using AK47
24/04/2020 17:12:34 - Roman killed Bryian using M16
24/04/2020 18:26:14 - Bryan killed Marcus using AK47
24/04/2020 19:36:33 - <WORLD> killed Marcus by DROWN
24/04/2020 20:19:22 - Match 11348961 has ended

23/04/2021 21:14:22 - New match 11348966 has started
23/04/2021 21:26:04 - Roman killed Marcus using M16
23/04/2021 21:26:04 - Roman killed John using AK47
24/04/2020 19:36:33 - <WORLD> killed Ramon by DROWN
23/04/2021 21:49:22 - Match 11348966 has ended
`;

			const result = service.parse(logContent);

			expect(result).toHaveLength(2);

			const firstMatch = result[0];
			expect(firstMatch.frags).toHaveLength(4);
			expectFrag(firstMatch.frags[0], {
				killerUsername: "Roman",
				victimUsername: "Marcus",
				weapon: "M16",
				occurredAt: new Date(2020, 3, 24, 16, 26, 12),
				matchExternalId: firstMatch.externalId,
			});
			expectFrag(firstMatch.frags[1], {
				killerUsername: "Marcus",
				victimUsername: "Jhon",
				weapon: "AK47",
				occurredAt: new Date(2020, 3, 24, 16, 35, 56),
				matchExternalId: firstMatch.externalId,
			});
			expectFrag(firstMatch.frags[2], {
				killerUsername: "Roman",
				victimUsername: "Bryian",
				weapon: "M16",
				occurredAt: new Date(2020, 3, 24, 17, 12, 34),
				matchExternalId: firstMatch.externalId,
			});
			expectFrag(firstMatch.frags[3], {
				killerUsername: "Bryan",
				victimUsername: "Marcus",
				weapon: "AK47",
				occurredAt: new Date(2020, 3, 24, 18, 26, 14),
				matchExternalId: firstMatch.externalId,
			});

			const secondMatch = result[1];
			expect(secondMatch.frags).toHaveLength(2);
			expectFrag(secondMatch.frags[0], {
				killerUsername: "Roman",
				victimUsername: "Marcus",
				weapon: "M16",
				occurredAt: new Date(2021, 3, 23, 21, 26, 4),
				matchExternalId: secondMatch.externalId,
			});
			expectFrag(secondMatch.frags[1], {
				killerUsername: "Roman",
				victimUsername: "John",
				weapon: "AK47",
				occurredAt: new Date(2021, 3, 23, 21, 26, 4),
				matchExternalId: secondMatch.externalId,
			});
		});

		it("should return incomplete match (no end log)", () => {
			const logContent = `23/04/2019 15:34:22 - New match 11348965 has started
23/04/2019 15:36:04 - Roman killed Nick using M16`;

			const result = service.parse(logContent);

			expect(result).toHaveLength(1);
			expect(result[0].externalId).toBe("11348965");
			expect(result[0].isEnded()).toBe(false);
			expect(result[0].frags).toHaveLength(1);
		});

		it("should throw error when match end without start", () => {
			const logContent = `23/04/2019 15:39:22 - Match 11348965 has ended`;

			expect(() => service.parse(logContent)).toThrow(
				new BadRequestException("match not started", {
					cause: { logEventStr: "Match 11348965 has ended" },
				}),
			);
		});

		it("should parse kills outside of started match", () => {
			const logContent = `23/04/2019 15:36:04 - Roman killed Nick using M16`;

			expect(() => service.parse(logContent)).toThrow(
				new BadRequestException("match not started", {
					cause: { logEventStr: "Roman killed Nick using M16" },
				}),
			);
		});

		it("should throw error when has duplicate match start log", () => {
			const logContent = `23/04/2019 15:34:22 - New match 11348965 has started
23/04/2019 15:35:00 - New match 11348966 has started
23/04/2019 15:39:22 - Match 11348965 has ended`;

			expect(() => service.parse(logContent)).toThrow(
				new BadRequestException("Match already started", {
					cause: { matchId: "11348966" },
				}),
			);
		});

		it("should not error when receive some unrecognized lines", () => {
			const logContent = `23/04/2019 15:34:22 - New match 11348965 has started
This is an invalid line
23/04/2019 15:39:22 - Match 11348965 has ended`;

			const result = service.parse(logContent);

			expect(result).toHaveLength(1);
		});

		it("should parse match when no kills", () => {
			const logContent = `23/04/2019 15:34:22 - New match 11348965 has started
23/04/2019 15:39:22 - Match 11348965 has ended`;

			const result = service.parse(logContent);

			expect(result).toHaveLength(1);
			expect(result[0].frags).toHaveLength(0);
		});
	});
});
